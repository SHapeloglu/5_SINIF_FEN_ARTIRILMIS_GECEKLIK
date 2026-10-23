package com.olap.dunyakatmanlariar;

import android.opengl.GLES11Ext;
import android.opengl.GLES20;

import com.google.ar.core.Coordinates2d;
import com.google.ar.core.Frame;

import java.nio.FloatBuffer;

/** ARCore kamera goruntusunu ekranin arka planina cizer. */
final class BackgroundRenderer {
    private static final float[] QUAD = {-1, -1, 1, -1, -1, 1, 1, 1};

    private static final String VS =
            "attribute vec4 aPos; attribute vec2 aUV; varying vec2 vUV;\n" +
            "void main() { gl_Position = aPos; vUV = aUV; }";
    private static final String FS =
            "#extension GL_OES_EGL_image_external : require\n" +
            "precision mediump float; varying vec2 vUV; uniform samplerExternalOES uTex;\n" +
            "void main() { gl_FragColor = texture2D(uTex, vUV); }";

    private final FloatBuffer quad = GlUtil.floats(QUAD, QUAD.length);
    private final FloatBuffer uv = GlUtil.floats(8);
    private int tex, prog, aPos, aUV;

    int textureId() { return tex; }

    void create() {
        int[] t = new int[1];
        GLES20.glGenTextures(1, t, 0);
        tex = t[0];
        int target = GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
        GLES20.glBindTexture(target, tex);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(target, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        prog = GlUtil.program(VS, FS);
        aPos = GLES20.glGetAttribLocation(prog, "aPos");
        aUV = GLES20.glGetAttribLocation(prog, "aUV");
    }

    void draw(Frame frame) {
        if (frame.hasDisplayGeometryChanged()) {
            quad.position(0);
            uv.position(0);
            frame.transformCoordinates2d(Coordinates2d.OPENGL_NORMALIZED_DEVICE_COORDINATES, quad,
                    Coordinates2d.TEXTURE_NORMALIZED, uv);
        }
        if (frame.getTimestamp() == 0) return; // kamera henuz ilk goruntuyu vermedi

        GLES20.glDisable(GLES20.GL_DEPTH_TEST);
        GLES20.glDepthMask(false);
        GLES20.glUseProgram(prog);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, tex);
        quad.position(0);
        uv.position(0);
        GLES20.glEnableVertexAttribArray(aPos);
        GLES20.glVertexAttribPointer(aPos, 2, GLES20.GL_FLOAT, false, 0, quad);
        GLES20.glEnableVertexAttribArray(aUV);
        GLES20.glVertexAttribPointer(aUV, 2, GLES20.GL_FLOAT, false, 0, uv);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        GLES20.glDisableVertexAttribArray(aPos);
        GLES20.glDisableVertexAttribArray(aUV);
        GLES20.glDepthMask(true);
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
    }
}
