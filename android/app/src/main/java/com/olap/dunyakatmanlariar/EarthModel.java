package com.olap.dunyakatmanlariar;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;

import java.util.Random;

/**
 * Yaricapi 1 birim olan, x>0, y>0, z>0 sekizde biri kesilmis Dunya modeli (iOS surumundeki EarthModel ile ayni).
 * Katman sinirlari Dunya yaricapina oranladir. Yer kabugu gercekte cok incedir (~0.005);
 * gorunebilmesi icin kalin cizilir (model olcekli degildir).
 */
final class EarthModel {
    private EarthModel() {}

    static final class Layer {
        final String key, title, info;
        final float r0, r1;
        final float[] inner, outer;

        Layer(String key, String title, float r0, float r1, float[] inner, float[] outer, String info) {
            this.key = key; this.title = title; this.r0 = r0; this.r1 = r1;
            this.inner = inner; this.outer = outer; this.info = info;
        }
    }

    static final Layer[] LAYERS = {
        new Layer("ic_cekirdek", "İç çekirdek", 0.00f, 0.20f,
            new float[]{1.00f, 0.97f, 0.88f}, new float[]{0.98f, 0.86f, 0.62f},
            "Dünya'nın merkezindeki en sıcak katmandır. Çok yüksek basınç nedeniyle katı hâldedir; demir ve nikelden oluşur."),
        new Layer("dis_cekirdek", "Dış çekirdek", 0.20f, 0.55f,
            new float[]{1.00f, 0.86f, 0.30f}, new float[]{1.00f, 0.58f, 0.10f},
            "Mantonun altındadır. Çok sıcaktır ve sıvı hâldedir. Büyük ölçüde demir ve nikelden oluşur."),
        new Layer("manto", "Manto", 0.55f, 0.91f,
            new float[]{0.98f, 0.45f, 0.08f}, new float[]{0.72f, 0.16f, 0.05f},
            "Yer kabuğunun altındaki en kalın katmandır. Sıcaklığı çok yüksektir; bazı bölümlerinde erimiş kayaçlar (magma) bulunur."),
        new Layer("yer_kabugu", "Yer kabuğu", 0.91f, 1.00f,
            new float[]{0.55f, 0.32f, 0.16f}, new float[]{0.38f, 0.21f, 0.11f},
            "Dünya'nın en dış ve en ince katmanıdır. Üzerinde yaşadığımız karalar ve okyanus tabanları bu katmandadır. Katı hâldedir."),
    };

    static Layer layer(String key) {
        for (Layer l : LAYERS) if (l.key.equals(key)) return l;
        return null;
    }

    // Etiket yerlesimi: model sahnede -45 derece dondurulecegi icin (1,0,1) yonu kameraya, (1,0,-1) yonu saga bakar.
    static final float LABEL_HEIGHT = 0.17f;
    static final float TITLE_HEIGHT = 0.22f;
    static final float TITLE_Y = 1.62f;

    /** k. katmanin etiket konumu (model biriminde). */
    static float[] labelPos(int k) {
        final float s2 = (float) Math.sqrt(0.5);
        final float[] side = {1, -1, 1, -1};
        final float[] height = {0.30f, 0.62f, 0.95f, 1.25f};
        float fwd = 1.30f * s2, right = 0.72f * side[k] * s2;
        return new float[]{fwd + right, height[k], fwd - right};
    }

    /** k. katmanin etiket cizgisinin kesik tabanindaki baslangic noktasi. */
    static float[] labelAnchor(int k) {
        final float s2 = (float) Math.sqrt(0.5);
        float rm = (LAYERS[k].r0 + LAYERS[k].r1) / 2;
        return new float[]{rm * s2, 0.002f, rm * s2};
    }

    // ---- Geometri ----

    static Mesh surface() {
        final int n = 96, m = 48; // boylam / enlem bolmeleri (4 ve 2'nin kati olmali)
        Mesh mesh = new Mesh();
        for (int j = 0; j <= m; j++) {
            double phi = -Math.PI / 2 + Math.PI * j / m;
            for (int i = 0; i <= n; i++) {
                double th = 2 * Math.PI * i / n;
                float x = (float) (Math.cos(phi) * Math.cos(th)), y = (float) Math.sin(phi), z = (float) (Math.cos(phi) * Math.sin(th));
                mesh.vertex(x, y, z, x, y, z, 1, 1, 1, (float) i / n, 1f - (float) j / m);
            }
        }
        for (int j = 0; j < m; j++) {
            for (int i = 0; i < n; i++) {
                if (i < n / 4 && j >= m / 2) continue; // kesilen sekizde bir
                int a = j * (n + 1) + i, b = (j + 1) * (n + 1) + i;
                mesh.tri(a, b, b + 1);
                mesh.tri(a, b + 1, a + 1);
            }
        }
        return mesh;
    }

    /** Katmanin uc kesit yuzundeki (y=0, x=0, z=0 duzlemleri) ceyrek halkalari. */
    static Mesh cutFaces(Layer l) {
        Mesh mesh = new Mesh();
        float[] X = {1, 0, 0}, Y = {0, 1, 0}, Z = {0, 0, 1};
        sector(mesh, X, Z, Y, l); // taban (y=0)
        sector(mesh, Y, Z, X, l); // x=0 duvari
        sector(mesh, X, Y, Z, l); // z=0 duvari
        return mesh;
    }

    private static void sector(Mesh m, float[] e1, float[] e2, float[] n, Layer l) {
        final int segs = 32;
        int prevIn = 0, prevOut = 0;
        for (int s = 0; s <= segs; s++) {
            double a = Math.PI / 2 * s / segs;
            float ca = (float) Math.cos(a), sa = (float) Math.sin(a);
            float dx = ca * e1[0] + sa * e2[0], dy = ca * e1[1] + sa * e2[1], dz = ca * e1[2] + sa * e2[2];
            int vin = m.vertex(dx * l.r0, dy * l.r0, dz * l.r0, n[0], n[1], n[2], l.inner[0], l.inner[1], l.inner[2], 0, 0);
            int vout = m.vertex(dx * l.r1, dy * l.r1, dz * l.r1, n[0], n[1], n[2], l.outer[0], l.outer[1], l.outer[2], 0, 0);
            if (s > 0) {
                m.tri(prevIn, prevOut, vout);
                if (l.r0 > 0) m.tri(prevIn, vout, vin); // merkezde bu ucgen sifir alanli
            }
            prevIn = vin;
            prevOut = vout;
        }
    }

    /**
     * Model uzayindaki isinin (o + t*d) ilk carptigi katmanin anahtarini dondurur; yoksa null.
     * Dis yuzey "yer_kabugu" sayilir.
     */
    static String hitTest(float[] o, float[] d) {
        float best = Float.MAX_VALUE;
        String key = null;

        // Dis kure (kesik bolge haric)
        float a = dot(d, d), b = 2 * dot(o, d), c = dot(o, o) - 1;
        float disc = b * b - 4 * a * c;
        if (disc >= 0) {
            float sq = (float) Math.sqrt(disc);
            float[] ts = {(-b - sq) / (2 * a), (-b + sq) / (2 * a)};
            for (float t : ts) {
                if (t <= 0) continue;
                float px = o[0] + t * d[0], py = o[1] + t * d[1], pz = o[2] + t * d[2];
                if (px > 0 && py > 0 && pz > 0) continue; // kesik bolgeden iceri bakiyor
                best = t;
                key = "yer_kabugu";
                break;
            }
        }

        // Kesit yuzleri: her eksen icin o eksenin 0 oldugu duzlem, diger iki koordinat pozitif.
        for (int axis = 0; axis < 3; axis++) {
            if (Math.abs(d[axis]) < 1e-6f) continue;
            float t = -o[axis] / d[axis];
            if (t <= 0 || t >= best) continue;
            float[] p = {o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]};
            boolean inside = true;
            for (int k = 0; k < 3; k++) if (k != axis && p[k] < 0) inside = false;
            if (!inside) continue;
            float r = (float) Math.sqrt(dot(p, p));
            for (Layer l : LAYERS) {
                if (r >= l.r0 && r <= l.r1) { best = t; key = l.key; break; }
            }
        }
        return key;
    }

    private static float dot(float[] a, float[] b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    // ---- Bitmapler ----

    /** Prosedurel Dunya dokusu (temsili kara, kutup ve bulutlar). Ust kenar kuzey kutbudur. */
    static Bitmap earthTexture() {
        final int w = 1024, h = 512;
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        int deep = Color.rgb(15, 51, 115), shallow = Color.rgb(26, 92, 184);
        p.setShader(new LinearGradient(0, 0, 0, h, new int[]{deep, shallow, deep}, new float[]{0, 0.5f, 1}, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);
        p.setShader(null);

        // Kitalar: sabit tohumlu rastgele elips kumeleri (her calistirmada ayni gorunum)
        Random rnd = new Random(18);
        for (int k = 0; k < 13; k++) {
            float cx = rnd.nextFloat() * w, cy = h * (0.18f + rnd.nextFloat() * 0.64f);
            float spread = 40 + rnd.nextFloat() * 70;
            for (int e = 0; e < 26; e++) {
                float x = cx + (rnd.nextFloat() - 0.5f) * spread * 2.2f, y = cy + (rnd.nextFloat() - 0.5f) * spread * 1.4f;
                float ew = 18 + rnd.nextFloat() * 50, eh = 12 + rnd.nextFloat() * 34;
                if (rnd.nextFloat() < 0.3f) p.setColor(Color.rgb(179, 148, 97));
                else p.setColor(Color.rgb((int) (51 + rnd.nextFloat() * 25), (int) (115 + rnd.nextFloat() * 25), 46));
                for (int wrap = -1; wrap <= 1; wrap++)
                    c.drawOval(new RectF(x - ew / 2 + wrap * w, y - eh / 2, x + ew / 2 + wrap * w, y + eh / 2), p);
            }
        }

        // Kutuplar
        p.setColor(Color.rgb(242, 247, 255));
        for (float x = -30; x < w + 30; x += 26) {
            float t = 18 + rnd.nextFloat() * 22, b = 18 + rnd.nextFloat() * 22;
            c.drawOval(new RectF(x, -t, x + 46, t), p);
            c.drawOval(new RectF(x, h - b, x + 46, h + b), p);
        }

        // Bulutlar
        for (int i = 0; i < 90; i++) {
            p.setColor(Color.argb((int) (255 * (0.18f + rnd.nextFloat() * 0.25f)), 255, 255, 255));
            float ew = 40 + rnd.nextFloat() * 120, eh = 6 + rnd.nextFloat() * 14;
            float x = rnd.nextFloat() * w, y = rnd.nextFloat() * h;
            for (int wrap = -1; wrap <= 1; wrap++)
                c.drawOval(new RectF(x + wrap * w, y, x + ew + wrap * w, y + eh), p);
        }
        return bmp;
    }

    /** Yuvarlak koseli etiket. dot null degilse solda katman rengi nokta cizilir. */
    static Bitmap labelBitmap(String text, float[] dot, int bgColor) {
        final float fontSize = 64;
        Paint tp = new Paint(Paint.ANTI_ALIAS_FLAG);
        tp.setTypeface(Typeface.DEFAULT_BOLD);
        tp.setTextSize(fontSize);
        tp.setColor(Color.WHITE);
        Paint.FontMetrics fm = tp.getFontMetrics();
        float tw = tp.measureText(text), th = fm.descent - fm.ascent;
        float pad = fontSize * 0.45f, dotD = dot != null ? fontSize * 0.7f : 0, gap = dot != null ? fontSize * 0.35f : 0;
        int bw = (int) Math.ceil(tw + dotD + gap + pad * 2), bh = (int) Math.ceil(th + pad * 1.2f);

        Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(bgColor);
        c.drawRoundRect(new RectF(0, 0, bw, bh), bh * 0.3f, bh * 0.3f, p);
        if (dot != null) {
            p.setColor(Color.rgb((int) (dot[0] * 255), (int) (dot[1] * 255), (int) (dot[2] * 255)));
            c.drawOval(new RectF(pad, (bh - dotD) / 2, pad + dotD, (bh + dotD) / 2), p);
        }
        c.drawText(text, pad + dotD + gap, (bh - th) / 2 - fm.ascent, tp);
        return bmp;
    }
}
