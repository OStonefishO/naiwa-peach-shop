package com.naiwa.peachshop;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {

    private static final int REQ_FILE_CHOOSER = 1001;

    private WebView web;
    private View splash;
    private AssetServer server;
    private ValueCallback<Uri[]> pendingFileCallback;
    private final Handler uiHandler = new Handler(Looper.getMainLooper());
    private final Runnable pauseTimersTask = new Runnable() {
        @Override public void run() {
            if (web != null) web.pauseTimers();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#FFF6E6"));
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        configureWebView();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#FFF6E6"));
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        try {
            splash = getLayoutInflater().inflate(R.layout.splash, root, false);
            root.addView(splash, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        } catch (Exception e) {
            splash = null;
        }
        setContentView(root);
        // 必须放在 setContentView 之后：DecorView 还没创建时调用
        // getWindow().getInsetsController() 会 NPE（PhoneWindow.mDecor == null）。
        applyImmersive();

        String url;
        try {
            server = new AssetServer(this);
            int port = server.start();
            url = "http://127.0.0.1:" + port + "/index.html";
        } catch (Exception e) {
            server = null;
            url = "file:///android_asset/index.html";
        }

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(url);
        }
        web.requestFocus(View.FOCUS_DOWN);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
    }

    private void configureWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setLoadsImagesAutomatically(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(false);
        // 让页面知道自己在 APK 里跑（检查更新时据此决定跳网页版还是下载 APK）
        try {
            String vn = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            s.setUserAgentString(s.getUserAgentString() + " NaiwaAndroid/" + vn);
        } catch (Exception ignored) {
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(false);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleExternal(url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    return handleExternal(request.getUrl().toString());
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                hideSplash();
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                hideSplash();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileCallback != null) {
                    pendingFileCallback.onReceiveValue(null);
                }
                pendingFileCallback = callback;
                try {
                    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
                            params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                    startActivityForResult(Intent.createChooser(intent, "选择文件"), REQ_FILE_CHOOSER);
                    return true;
                } catch (Exception e) {
                    pendingFileCallback = null;
                    return false;
                }
            }
        });

        web.setDownloadListener(new android.webkit.DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                        String mimetype, long contentLength) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {
                }
            }
        });
    }

    private boolean handleExternal(String url) {
        if (url == null) return false;
        if (url.startsWith("http://127.0.0.1") || url.startsWith("file://")) return false;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")
                || url.startsWith("tel:")) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE_CHOOSER) {
            if (pendingFileCallback != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK && data != null) {
                    if (data.getClipData() != null) {
                        int n = data.getClipData().getItemCount();
                        result = new Uri[n];
                        for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
                    } else if (data.getData() != null) {
                        result = new Uri[]{data.getData()};
                    }
                }
                pendingFileCallback.onReceiveValue(result);
                pendingFileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    private void applyImmersive() {
        try {
            View decor = getWindow().getDecorView();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                getWindow().setDecorFitsSystemWindows(false);
                android.view.WindowInsetsController c = decor.getWindowInsetsController();
                if (c != null) {
                    c.hide(android.view.WindowInsets.Type.systemBars());
                    c.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                }
            } else {
                decor.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
            }
        } catch (Exception ignored) {
            // 沉浸式失败不影响游戏运行
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersive();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (web != null && web.canGoBack()) {
                web.goBack();
                return true;
            }
            confirmExit();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private void hideSplash() {
        if (splash == null || splash.getVisibility() != View.VISIBLE) return;
        final View s = splash;
        splash = null;
        try {
            s.animate().alpha(0f).setDuration(320).withEndAction(new Runnable() {
                @Override
                public void run() {
                    View parent = (View) s.getParent();
                    if (parent instanceof android.view.ViewGroup) {
                        ((android.view.ViewGroup) parent).removeView(s);
                    }
                }
            }).start();
        } catch (Exception e) {
            View parent = (View) s.getParent();
            if (parent instanceof android.view.ViewGroup) {
                ((android.view.ViewGroup) parent).removeView(s);
            }
        }
    }

    private void confirmExit() {
        try {
            final android.app.Dialog dialog = new android.app.Dialog(this);
            View content = getLayoutInflater().inflate(R.layout.dialog_exit, null);
            content.findViewById(R.id.btnStay).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    dialog.dismiss();
                }
            });
            content.findViewById(R.id.btnExit).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    dialog.dismiss();
                    finish();
                }
            });
            dialog.setContentView(content);
            Window w = dialog.getWindow();
            if (w != null) {
                w.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
                w.setLayout(android.view.ViewGroup.LayoutParams.WRAP_CONTENT,
                        android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
            }
            dialog.show();
        } catch (Exception e) {
            // 自定义对话框异常时退回系统对话框，避免按返回键无反应
            new AlertDialog.Builder(this)
                    .setTitle("奶蛙黄桃罐头商店")
                    .setMessage("要离开小店了吗？")
                    .setPositiveButton("退出", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface d, int which) {
                            finish();
                        }
                    })
                    .setNegativeButton("再玩一会", null)
                    .show();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) {
            // 先让页面把这一局存进本地、再补一次云存档，稍后才冻结计时器
            try {
                web.evaluateJavascript("window.__naiwaFlush&&window.__naiwaFlush()", null);
            } catch (Exception ignored) {}
            web.onPause();
            uiHandler.removeCallbacks(pauseTimersTask);
            uiHandler.postDelayed(pauseTimersTask, 600);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            uiHandler.removeCallbacks(pauseTimersTask);
            web.resumeTimers();
            web.onResume();
        }
    }

    @Override
    protected void onDestroy() {
        if (server != null) server.stop();
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
