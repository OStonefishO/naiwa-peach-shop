package android.content.res;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

/** 测试替身：把 assets 映射到本地目录，让 AssetServer 可以在桌面 JVM 上跑起来。 */
public class AssetManager {
    public static final int ACCESS_STREAMING = 2;

    private final File base;

    public AssetManager(File base) {
        this.base = base;
    }

    public InputStream open(String path, int mode) throws IOException {
        File f = new File(base, path);
        if (!f.isFile()) throw new FileNotFoundException(path);
        return new FileInputStream(f);
    }
}
