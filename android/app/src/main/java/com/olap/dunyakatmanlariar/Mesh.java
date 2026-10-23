package com.olap.dunyakatmanlariar;

import android.opengl.GLES20;

import java.util.Arrays;

/** Konum(3) + normal(3) + renk(3) + doku koordinati(2) iceren basit ucgen agi. */
final class Mesh {
    private static final int STRIDE = 11;
    private float[] v = new float[STRIDE * 512];
    private short[] idx = new short[1536];
    private int vc, ic;
    private int vbo, ibo;

    int vertex(float x, float y, float z, float nx, float ny, float nz,
               float r, float g, float b, float u, float t) {
        if ((vc + 1) * STRIDE > v.length) v = Arrays.copyOf(v, v.length * 2);
        int o = vc * STRIDE;
        v[o] = x; v[o + 1] = y; v[o + 2] = z;
        v[o + 3] = nx; v[o + 4] = ny; v[o + 5] = nz;
        v[o + 6] = r; v[o + 7] = g; v[o + 8] = b;
        v[o + 9] = u; v[o + 10] = t;
        return vc++;
    }

    void tri(int a, int b, int c) {
        if (ic + 3 > idx.length) idx = Arrays.copyOf(idx, idx.length * 2);
        idx[ic++] = (short) a; idx[ic++] = (short) b; idx[ic++] = (short) c;
    }

    void upload() {
        int[] ids = new int[2];
        GLES20.glGenBuffers(2, ids, 0);
        vbo = ids[0];
        ibo = ids[1];
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, vbo);
        GLES20.glBufferData(GLES20.GL_ARRAY_BUFFER, vc * STRIDE * 4, GlUtil.floats(v, vc * STRIDE), GLES20.GL_STATIC_DRAW);
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, ibo);
        GLES20.glBufferData(GLES20.GL_ELEMENT_ARRAY_BUFFER, ic * 2, GlUtil.shorts(idx, ic), GLES20.GL_STATIC_DRAW);
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, 0);
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, 0);
    }

    void draw(int aPos, int aNrm, int aCol, int aUV) {
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, vbo);
        attrib(aPos, 3, 0);
        attrib(aNrm, 3, 3);
        attrib(aCol, 3, 6);
        attrib(aUV, 2, 9);
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, ibo);
        GLES20.glDrawElements(GLES20.GL_TRIANGLES, ic, GLES20.GL_UNSIGNED_SHORT, 0);
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, 0);
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, 0);
    }

    private static void attrib(int loc, int size, int offset) {
        if (loc < 0) return;
        GLES20.glEnableVertexAttribArray(loc);
        GLES20.glVertexAttribPointer(loc, size, GLES20.GL_FLOAT, false, STRIDE * 4, offset * 4);
    }
}
