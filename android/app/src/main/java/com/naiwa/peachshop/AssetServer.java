package com.naiwa.peachshop;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 极简本地资源服务器：把 APK 内的 assets 以 http://127.0.0.1:port/ 提供给 WebView。
 * 这样页面有真正的 http 源，localStorage / fetch / IndexedDB 都按正常网页行为工作。
 */
public class AssetServer {
    private final Context ctx;
    private ServerSocket server;
    private ExecutorService pool;
    private volatile boolean running = false;
    private int port = -1;

    public AssetServer(Context c) {
        this.ctx = c.getApplicationContext();
    }

    public int getPort() {
        return port;
    }

    /**
     * 端口必须尽量固定：WebView 的 localStorage 是按源（含端口）隔离的，
     * 每次换个端口就等于换了一个新手机 —— 存档会"用完就丢"。
     * 优先 43971，被占用就顺着往下试，最后才退回随机端口。
     */
    private static final int[] PREFERRED_PORTS = {43971, 43972, 43973, 43974, 43975};

    /** 老版本每次随机端口，存档是按「端口」分开的；优先复用旧的端口把存档接回来。 */
    private int legacyPort() {
        try {
            java.io.File dir = new java.io.File(ctx.getApplicationInfo().dataDir,
                    "app_webview/Default/Local Storage/leveldb");
            java.io.File[] files = dir.listFiles();
            if (files == null) return 0;
            java.util.regex.Pattern pat = java.util.regex.Pattern.compile("http://127\\.0\\.0\\.1:(\\d{4,5})");
            java.util.HashMap<Integer, Integer> count = new java.util.HashMap<Integer, Integer>();
            for (java.io.File f : files) {
                if (!f.isFile() || f.length() > 8 * 1024 * 1024) continue;
                byte[] buf = new byte[(int) f.length()];
                java.io.FileInputStream in = new java.io.FileInputStream(f);
                try {
                    int off = 0, n;
                    while (off < buf.length && (n = in.read(buf, off, buf.length - off)) > 0) off += n;
                } finally {
                    in.close();
                }
                java.util.regex.Matcher m = pat.matcher(new String(buf, "ISO-8859-1"));
                while (m.find()) {
                    Integer key = Integer.valueOf(m.group(1));
                    Integer c = count.get(key);
                    count.put(key, c == null ? 1 : c + 1);
                }
            }
            int best = 0, bestCount = 0;
            for (java.util.Map.Entry<Integer, Integer> e : count.entrySet()) {
                if (e.getValue() > bestCount) { bestCount = e.getValue(); best = e.getKey(); }
            }
            return best;
        } catch (Throwable t) {
            return 0;
        }
    }

    private int[] portsToTry() {
        int legacy = legacyPort();
        int[] out = new int[PREFERRED_PORTS.length + 1];
        out[0] = legacy;
        System.arraycopy(PREFERRED_PORTS, 0, out, 1, PREFERRED_PORTS.length);
        return out;
    }

    public int start() throws IOException {
        IOException lastError = null;
        int[] ports = portsToTry();
        for (int p : ports) {
            if (p <= 0) continue;
            try {
                ServerSocket s = new ServerSocket();
                s.setReuseAddress(true);
                s.bind(new java.net.InetSocketAddress(InetAddress.getByName("127.0.0.1"), p), 64);
                server = s;
                break;
            } catch (IOException e) {
                lastError = e;
            }
        }
        if (server == null) {
            try {
                server = new ServerSocket(0, 64, InetAddress.getByName("127.0.0.1"));
            } catch (IOException e) {
                throw lastError != null ? lastError : e;
            }
        }
        port = server.getLocalPort();
        running = true;
        pool = Executors.newFixedThreadPool(4);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                while (running) {
                    try {
                        final Socket s = server.accept();
                        pool.execute(new Runnable() {
                            @Override
                            public void run() {
                                handle(s);
                            }
                        });
                    } catch (IOException e) {
                        // 关闭时 accept 会抛异常，忽略
                    }
                }
            }
        }, "naiwa-asset-server");
        t.setDaemon(true);
        t.start();
        return port;
    }

    public void stop() {
        running = false;
        try {
            if (server != null) server.close();
        } catch (IOException ignored) {
        }
        if (pool != null) pool.shutdownNow();
    }

    private void handle(Socket sock) {
        OutputStream out = null;
        try {
            sock.setSoTimeout(15000);
            BufferedReader in = new BufferedReader(new InputStreamReader(sock.getInputStream(), "ISO-8859-1"));
            String requestLine = in.readLine();
            if (requestLine == null) return;

            int contentLength = -1;
            int rangeStart = -1, rangeEnd = -1;
            String header;
            while ((header = in.readLine()) != null && header.length() > 0) {
                String lower = header.toLowerCase(Locale.US);
                if (lower.startsWith("range:")) {
                    int eq = header.indexOf('=');
                    String spec = eq >= 0 ? header.substring(eq + 1).trim() : "";
                    int dash = spec.indexOf('-');
                    if (dash >= 0) {
                        try {
                            String a = spec.substring(0, dash).trim();
                            String b = spec.substring(dash + 1).trim();
                            rangeStart = a.isEmpty() ? -1 : Integer.parseInt(a);
                            rangeEnd = b.isEmpty() ? -1 : Integer.parseInt(b);
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;
            String method = parts[0];
            String rawPath = parts[1];
            int q = rawPath.indexOf('?');
            if (q >= 0) rawPath = rawPath.substring(0, q);
            String path = URLDecoder.decode(rawPath, "UTF-8");
            if (path.equals("/") || path.isEmpty()) path = "/index.html";
            String rel = path.startsWith("/") ? path.substring(1) : path;
            if (rel.contains("..")) {
                writeSimple(sock, 403, "Forbidden");
                return;
            }

            byte[] data;
            try {
                data = readAsset(rel);
            } catch (IOException e) {
                // 目录或不存在
                try {
                    data = readAsset(rel + "/index.html");
                    rel = rel + "/index.html";
                } catch (IOException e2) {
                    writeSimple(sock, 404, "Not Found");
                    return;
                }
            }

            String mime = mimeOf(rel);
            out = sock.getOutputStream();

            if (!"HEAD".equalsIgnoreCase(method) && (rangeStart >= 0 || rangeEnd >= 0) && data.length > 0) {
                int start = rangeStart < 0 ? 0 : rangeStart;
                int end = (rangeEnd < 0 || rangeEnd >= data.length) ? data.length - 1 : rangeEnd;
                if (start > end || start >= data.length) {
                    String head = "HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */" + data.length + "\r\n\r\n";
                    out.write(head.getBytes("ISO-8859-1"));
                    return;
                }
                int len = end - start + 1;
                StringBuilder sb = new StringBuilder();
                sb.append("HTTP/1.1 206 Partial Content\r\n")
                        .append("Content-Type: ").append(mime).append("\r\n")
                        .append("Accept-Ranges: bytes\r\n")
                        .append("Content-Range: bytes ").append(start).append("-").append(end).append("/").append(data.length).append("\r\n")
                        .append("Content-Length: ").append(len).append("\r\n")
                        .append("Cache-Control: no-store\r\n")
                        .append("Access-Control-Allow-Origin: *\r\n")
                        .append("Connection: close\r\n\r\n");
                out.write(sb.toString().getBytes("ISO-8859-1"));
                if (!"HEAD".equalsIgnoreCase(method)) out.write(data, start, len);
                out.flush();
                return;
            }

            StringBuilder sb = new StringBuilder();
            sb.append("HTTP/1.1 200 OK\r\n")
                    .append("Content-Type: ").append(mime).append("\r\n")
                    .append("Accept-Ranges: bytes\r\n")
                    .append("Content-Length: ").append(data.length).append("\r\n")
                    .append("Cache-Control: no-store\r\n")
                    .append("Access-Control-Allow-Origin: *\r\n")
                    .append("Connection: close\r\n\r\n");
            out.write(sb.toString().getBytes("ISO-8859-1"));
            if (!"HEAD".equalsIgnoreCase(method)) out.write(data);
            out.flush();
        } catch (Exception ignored) {
            // 单次请求失败不影响整体
        } finally {
            try {
                if (out != null) out.close();
            } catch (IOException ignored) {
            }
            try {
                sock.close();
            } catch (IOException ignored) {
            }
        }
    }

    private byte[] readAsset(String rel) throws IOException {
        AssetManager am = ctx.getAssets();
        InputStream is;
        try {
            is = am.open(rel, AssetManager.ACCESS_STREAMING);
        } catch (IOException e) {
            // 有些打包工具会把 assets 子目录写成反斜杠，兼容一下
            is = am.open(rel.replace('/', '\\'), AssetManager.ACCESS_STREAMING);
        }
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream(Math.max(1024, is.available()));
            byte[] buf = new byte[16384];
            int n;
            while ((n = is.read(buf)) > 0) bos.write(buf, 0, n);
            return bos.toByteArray();
        } finally {
            try {
                is.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void writeSimple(Socket sock, int code, String text) throws IOException {
        byte[] body = text.getBytes("UTF-8");
        String head = "HTTP/1.1 " + code + " " + text + "\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: "
                + body.length + "\r\nConnection: close\r\n\r\n";
        OutputStream o = sock.getOutputStream();
        o.write(head.getBytes("ISO-8859-1"));
        o.write(body);
        o.flush();
        o.close();
    }

    private String mimeOf(String rel) {
        String p = rel.toLowerCase(Locale.US);
        if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html; charset=utf-8";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript; charset=utf-8";
        if (p.endsWith(".css")) return "text/css; charset=utf-8";
        if (p.endsWith(".json")) return "application/json; charset=utf-8";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".gif")) return "image/gif";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".m4a")) return "audio/mp4";
        if (p.endsWith(".mp4")) return "video/mp4";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }
}
