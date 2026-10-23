package com.olap.dunyakatmanlariar;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.opengl.GLES20;
import android.opengl.Matrix;

import java.nio.FloatBuffer;

/**
 * Kesik Dunya modelini, etiketleri ve etiket cizgilerini cizer.
 * Sahne hiyerarsisi (iOS ile ayni): goruntu pozu -> icerik (yukseklik + olcek) -> donus (-45 derece + kullanici).
 */
final class EarthRenderer {
    private static final String LIT_VS =
            "uniform mat4 uMVP; uniform mat4 uMV;\n" +
            "attribute vec3 aPos; attribute vec3 aNrm; attribute vec3 aCol; attribute vec2 aUV;\n" +
            "varying vec3 vN; varying vec3 vCol; varying vec2 vUV;\n" +
            "void main() {\n" +
            "  gl_Position = uMVP * vec4(aPos, 1.0);\n" +
            "  vN = (uMV * vec4(aNrm, 0.0)).xyz; vCol = aCol; vUV = aUV;\n" +
            "}";
    private static final String LIT_FS =
            "precision mediump float;\n" +
            "uniform sampler2D uTex; uniform float uUseTex; uniform float uUnlit;\n" +
            "varying vec3 vN; varying vec3 vCol; varying vec2 vUV;\n" +
            "void main() {\n" +
            "  vec3 c = uUseTex > 0.5 ? texture2D(uTex, vUV).rgb : vCol;\n" +
            "  if (uUnlit > 0.5) { gl_FragColor = vec4(c, 1.0); return; }\n" +
            "  float d = abs(dot(normalize(vN), normalize(vec3(0.3, 0.6, 1.0))));\n" +
            "  gl_FragColor = vec4(c * (0.45 + 0.6 * d), 1.0);\n" +
            "}";
    private static final String QUAD_VS =
            "uniform mat4 uVP; attribute vec3 aPos; attribute vec2 aUV; varying vec2 vUV;\n" +
            "void main() { gl_Position = uVP * vec4(aPos, 1.0); vUV = aUV; }";
    private static final String QUAD_FS =
            "precision mediump float; uniform sampler2D uTex; varying vec2 vUV;\n" +
            "void main() { gl_FragColor = texture2D(uTex, vUV); }";

    /** Kameraya donuk duran etiket. */
    private static final class Label {
        String key;          // null: baslik (dokunulamaz)
        int tex;
        float aspect, height;
        float[] pos;         // model biriminde
        boolean inSpin;      // donus dugumunun cocugu mu (baslik degil)
        final float[] rect = new float[4]; // ekran: minX, minY, maxX, maxY
        boolean visible;
    }

    private int lit, uMVP, uMV, uUseTex, uUnlit, uTexLit, aPos, aNrm, aCol, aUV;
    private int quad, qVP, qTex, qPos, qUV;
    private Mesh surface;
    private final Mesh[] faces = new Mesh[EarthModel.LAYERS.length];
    private int earthTex;
    private final Label[] labels = new Label[EarthModel.LAYERS.length + 1];
    private final FloatBuffer lineBuf = GlUtil.floats(EarthModel.LAYERS.length * 6);
    private final FloatBuffer quadBuf = GlUtil.floats(4 * 5);

    private final float[] content = new float[16], spin = new float[16];
    private final float[] vp = new float[16], mvp = new float[16], mv = new float[16], tmp = new float[16];
    private float scale;

    void create() {
        lit = GlUtil.program(LIT_VS, LIT_FS);
        uMVP = GLES20.glGetUniformLocation(lit, "uMVP");
        uMV = GLES20.glGetUniformLocation(lit, "uMV");
        uUseTex = GLES20.glGetUniformLocation(lit, "uUseTex");
        uUnlit = GLES20.glGetUniformLocation(lit, "uUnlit");
        uTexLit = GLES20.glGetUniformLocation(lit, "uTex");
        aPos = GLES20.glGetAttribLocation(lit, "aPos");
        aNrm = GLES20.glGetAttribLocation(lit, "aNrm");
        aCol = GLES20.glGetAttribLocation(lit, "aCol");
        aUV = GLES20.glGetAttribLocation(lit, "aUV");

        quad = GlUtil.program(QUAD_VS, QUAD_FS);
        qVP = GLES20.glGetUniformLocation(quad, "uVP");
        qTex = GLES20.glGetUniformLocation(quad, "uTex");
        qPos = GLES20.glGetAttribLocation(quad, "aPos");
        qUV = GLES20.glGetAttribLocation(quad, "aUV");

        surface = EarthModel.surface();
        surface.upload();
        for (int k = 0; k < faces.length; k++) {
            faces[k] = EarthModel.cutFaces(EarthModel.LAYERS[k]);
            faces[k].upload();
        }
        earthTex = GlUtil.texture(EarthModel.earthTexture());

        float[] lines = new float[EarthModel.LAYERS.length * 6];
        int bgDark = Color.argb(199, 20, 20, 20);
        for (int k = 0; k < EarthModel.LAYERS.length; k++) {
            EarthModel.Layer l = EarthModel.LAYERS[k];
            Label lb = new Label();
            lb.key = l.key;
            lb.pos = EarthModel.labelPos(k);
            lb.inSpin = true;
            lb.height = EarthModel.LABEL_HEIGHT;
            setBitmap(lb, EarthModel.labelBitmap(l.title, l.outer, bgDark));
            labels[k] = lb;
            System.arraycopy(EarthModel.labelAnchor(k), 0, lines, k * 6, 3);
            System.arraycopy(lb.pos, 0, lines, k * 6 + 3, 3);
        }
        lineBuf.put(lines).position(0);

        Label title = new Label();
        title.pos = new float[]{0, EarthModel.TITLE_Y, 0};
        title.height = EarthModel.TITLE_HEIGHT;
        setBitmap(title, EarthModel.labelBitmap("Dünya'nın Katmanları", null, Color.argb(235, 242, 140, 31)));
        labels[labels.length - 1] = title;
    }

    private static void setBitmap(Label lb, Bitmap bmp) {
        lb.aspect = (float) bmp.getWidth() / bmp.getHeight();
        lb.tex = GlUtil.texture(bmp);
    }

    /**
     * @param imagePose goruntunun merkez pozu (y ekseni sayfadan disari)
     * @param s         modelin yaricapi (metre)
     * @param lift      modelin sayfadan yuksekligi (metre)
     * @param yawDeg    y ekseni etrafinda donus (derece)
     */
    void draw(float[] view, float[] proj, float[] imagePose, float s, float lift, float yawDeg, int vw, int vh) {
        scale = s;
        Matrix.translateM(tmp, 0, imagePose, 0, 0, lift, 0);
        Matrix.scaleM(content, 0, tmp, 0, s, s, s);
        Matrix.rotateM(spin, 0, content, 0, yawDeg, 0, 1, 0);
        Matrix.multiplyMM(vp, 0, proj, 0, view, 0);
        Matrix.multiplyMM(mvp, 0, vp, 0, spin, 0);
        Matrix.multiplyMM(mv, 0, view, 0, spin, 0);

        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
        GLES20.glDisable(GLES20.GL_CULL_FACE);
        GLES20.glUseProgram(lit);
        GLES20.glUniformMatrix4fv(uMVP, 1, false, mvp, 0);
        GLES20.glUniformMatrix4fv(uMV, 1, false, mv, 0);
        GLES20.glUniform1f(uUnlit, 0);
        GLES20.glUniform1i(uTexLit, 0);

        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, earthTex);
        GLES20.glUniform1f(uUseTex, 1);
        surface.draw(aPos, aNrm, aCol, aUV);
        GLES20.glUniform1f(uUseTex, 0);
        for (Mesh f : faces) f.draw(aPos, aNrm, aCol, aUV);

        // Etiket cizgileri (beyaz, isiksiz)
        GLES20.glUniform1f(uUnlit, 1);
        GLES20.glDisableVertexAttribArray(aNrm);
        GLES20.glDisableVertexAttribArray(aCol);
        GLES20.glDisableVertexAttribArray(aUV);
        GLES20.glVertexAttrib3f(aCol, 1, 1, 1);
        lineBuf.position(0);
        GLES20.glVertexAttribPointer(aPos, 3, GLES20.GL_FLOAT, false, 0, lineBuf);
        GLES20.glLineWidth(3);
        GLES20.glDrawArrays(GLES20.GL_LINES, 0, EarthModel.LAYERS.length * 2);
        GLES20.glDisableVertexAttribArray(aPos);

        drawLabels(view, vw, vh);
    }

    private void drawLabels(float[] view, int vw, int vh) {
        // Gorus matrisinin ilk iki satiri kameranin sag ve yukari yonleridir.
        float rx = view[0], ry = view[4], rz = view[8];
        float ux = view[1], uy = view[5], uz = view[9];

        GLES20.glDisable(GLES20.GL_DEPTH_TEST);
        GLES20.glEnable(GLES20.GL_BLEND);
        GLES20.glBlendFunc(GLES20.GL_ONE, GLES20.GL_ONE_MINUS_SRC_ALPHA); // Android bitmapleri on-carpimli alfa
        GLES20.glUseProgram(quad);
        GLES20.glUniformMatrix4fv(qVP, 1, false, vp, 0);
        GLES20.glUniform1i(qTex, 0);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);

        float[] c = new float[4], w = new float[4];
        float[] q = new float[20];
        for (Label lb : labels) {
            c[0] = lb.pos[0]; c[1] = lb.pos[1]; c[2] = lb.pos[2]; c[3] = 1;
            Matrix.multiplyMV(w, 0, lb.inSpin ? spin : content, 0, c, 0);
            float hh = lb.height * scale / 2, hw = hh * lb.aspect;
            float[][] corners = {
                {-hw, -hh, 0, 1}, {hw, -hh, 1, 1}, {-hw, hh, 0, 0}, {hw, hh, 1, 0}};
            lb.rect[0] = lb.rect[1] = Float.MAX_VALUE;
            lb.rect[2] = lb.rect[3] = -Float.MAX_VALUE;
            lb.visible = true;
            for (int i = 0; i < 4; i++) {
                float sx = corners[i][0], sy = corners[i][1];
                float px = w[0] + rx * sx + ux * sy, py = w[1] + ry * sx + uy * sy, pz = w[2] + rz * sx + uz * sy;
                q[i * 5] = px; q[i * 5 + 1] = py; q[i * 5 + 2] = pz;
                q[i * 5 + 3] = corners[i][2]; q[i * 5 + 4] = corners[i][3];
                project(px, py, pz, vw, vh, lb);
            }
            quadBuf.position(0);
            quadBuf.put(q).position(0);
            GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, lb.tex);
            GLES20.glEnableVertexAttribArray(qPos);
            GLES20.glVertexAttribPointer(qPos, 3, GLES20.GL_FLOAT, false, 20, quadBuf);
            quadBuf.position(3);
            GLES20.glEnableVertexAttribArray(qUV);
            GLES20.glVertexAttribPointer(qUV, 2, GLES20.GL_FLOAT, false, 20, quadBuf);
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        }
        GLES20.glDisableVertexAttribArray(qPos);
        GLES20.glDisableVertexAttribArray(qUV);
        GLES20.glDisable(GLES20.GL_BLEND);
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
    }

    private void project(float x, float y, float z, int vw, int vh, Label lb) {
        float[] in = {x, y, z, 1}, out = new float[4];
        Matrix.multiplyMV(out, 0, vp, 0, in, 0);
        if (out[3] <= 0) { lb.visible = false; return; }
        float sx = (out[0] / out[3] + 1) / 2 * vw, sy = (1 - out[1] / out[3]) / 2 * vh;
        lb.rect[0] = Math.min(lb.rect[0], sx); lb.rect[1] = Math.min(lb.rect[1], sy);
        lb.rect[2] = Math.max(lb.rect[2], sx); lb.rect[3] = Math.max(lb.rect[3], sy);
    }

    /** Son cizilen kareye gore ekrandaki (x, y) noktasindaki katman anahtari; yoksa null. */
    String hitTest(float x, float y, int vw, int vh) {
        for (Label lb : labels) {
            if (lb.key != null && lb.visible && x >= lb.rect[0] && x <= lb.rect[2] && y >= lb.rect[1] && y <= lb.rect[3])
                return lb.key;
        }
        float nx = 2 * x / vw - 1, ny = 1 - 2 * y / vh;
        float[] inv = new float[16];
        if (!Matrix.invertM(inv, 0, mvp, 0)) return null;
        float[] near = new float[4], far = new float[4];
        Matrix.multiplyMV(near, 0, inv, 0, new float[]{nx, ny, -1, 1}, 0);
        Matrix.multiplyMV(far, 0, inv, 0, new float[]{nx, ny, 1, 1}, 0);
        float[] o = {near[0] / near[3], near[1] / near[3], near[2] / near[3]};
        float[] d = {far[0] / far[3] - o[0], far[1] / far[3] - o[1], far[2] / far[3] - o[2]};
        return EarthModel.hitTest(o, d);
    }
}
