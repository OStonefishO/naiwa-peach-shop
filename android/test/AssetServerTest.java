import android.content.Context;
import android.content.res.AssetManager;
import com.naiwa.peachshop.AssetServer;

import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** 桌面端冒烟测试：用替身 AssetManager 跑真实 AssetServer，验证 HTTP 行为。 */
public class AssetServerTest {
    private static int failures = 0;

    public static void main(String[] args) throws Exception {
        File assets = new File(args.length > 0 ? args[0] : "assets");
        if (!assets.isDirectory()) {
            System.out.println("FAIL assets dir missing: " + assets.getAbsolutePath());
            System.exit(2);
        }
        Context ctx = new Context(new AssetManager(assets));
        AssetServer server = new AssetServer(ctx);
        int port = server.start();
        System.out.println("server on 127.0.0.1:" + port + " root=" + assets.getAbsolutePath());
        String base = "http://127.0.0.1:" + port;

        // 1) index.html 完整返回
        long expectHtml = new File(assets, "index.html").length();
        HttpURLConnection c = get(base + "/index.html", null);
        check("index status", c.getResponseCode() == 200);
        check("index content-type", c.getContentType().startsWith("text/html"));
        byte[] body = readAll(c.getInputStream());
        check("index size " + body.length + " == " + expectHtml, body.length == expectHtml);
        check("index looks like html", new String(body, 0, Math.min(200, body.length), "UTF-8").toLowerCase().contains("<!doctype html"));

        // 2) 根路径默认 index.html
        c = get(base + "/", null);
        check("root status", c.getResponseCode() == 200);
        check("root size", readAll(c.getInputStream()).length == expectHtml);

        // 3) 音乐 Range 请求
        long expectMp3 = new File(assets, "music/title.mp3").length();
        c = get(base + "/music/title.mp3", "bytes=0-1023");
        check("mp3 status 206", c.getResponseCode() == 206);
        String cr = c.getHeaderField("Content-Range");
        check("mp3 content-range " + cr, cr != null && cr.equals("bytes 0-1023/" + expectMp3));
        check("mp3 partial len", readAll(c.getInputStream()).length == 1024);

        // 4) 音乐完整请求
        c = get(base + "/music/title.mp3", null);
        check("mp3 full 200", c.getResponseCode() == 200);
        check("mp3 full mime", "audio/mpeg".equals(c.getContentType()));
        check("mp3 full len", readAll(c.getInputStream()).length == expectMp3);

        // 5) open-ended range
        c = get(base + "/music/title.mp3", "bytes=1000-");
        check("mp3 open range 206", c.getResponseCode() == 206);
        check("mp3 open range len", readAll(c.getInputStream()).length == expectMp3 - 1000);

        // 6) 404
        c = get(base + "/nope.png", null);
        check("404 status", c.getResponseCode() == 404);

        // 7) 目录穿越拦截
        c = get(base + "/../android.jar", null);
        check("traversal blocked", c.getResponseCode() == 403 || c.getResponseCode() == 404);

        // 8) HEAD
        HttpURLConnection h = get(base + "/index.html", null);
        h.setRequestMethod("HEAD");
        check("HEAD status", h.getResponseCode() == 200);
        check("HEAD length header", String.valueOf(expectHtml).equals(h.getHeaderField("Content-Length")));

        server.stop();
        System.out.println(failures == 0 ? "ALL PASS" : ("FAILURES: " + failures));
        System.exit(failures == 0 ? 0 : 1);
    }

    private static HttpURLConnection get(String url, String range) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(5000);
        c.setReadTimeout(5000);
        c.setRequestProperty("Connection", "close");
        if (range != null) c.setRequestProperty("Range", range);
        return c;
    }

    private static byte[] readAll(InputStream in) throws Exception {
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        in.close();
        return bos.toByteArray();
    }

    private static void check(String name, boolean ok) {
        System.out.println((ok ? "  ok   " : "  FAIL ") + name);
        if (!ok) failures++;
    }
}
