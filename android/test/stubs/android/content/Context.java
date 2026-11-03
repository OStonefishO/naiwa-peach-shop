package android.content;

/** 测试替身：仅提供 AssetServer 需要的两个方法。 */
public class Context {
    private final android.content.res.AssetManager assets;

    public Context(android.content.res.AssetManager assets) {
        this.assets = assets;
    }

    public Context getApplicationContext() {
        return this;
    }

    public android.content.res.AssetManager getAssets() {
        return assets;
    }
}
