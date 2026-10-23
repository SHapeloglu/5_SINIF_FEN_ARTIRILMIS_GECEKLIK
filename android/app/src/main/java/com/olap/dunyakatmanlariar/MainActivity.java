package com.olap.dunyakatmanlariar;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.util.TypedValue;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.AugmentedImageDatabase;
import com.google.ar.core.Camera;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.CameraNotAvailableException;
import com.google.ar.core.exceptions.ImageInsufficientQualityException;
import com.google.ar.core.exceptions.UnavailableDeviceNotCompatibleException;
import com.google.ar.core.exceptions.UnavailableException;

import java.io.InputStream;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class MainActivity extends Activity implements GLSurfaceView.Renderer {
    private static final String TAG = "DunyaAR";

    // Kitaptaki (s.18) Dunya gorselinin basili genisligi: 88.2 pt = 31.1 mm.
    // Gorsel ekranda/farkli boyutta basilmissa algilama yine calisir, sadece model olcegi degisir.
    private static final float REFERENCE_WIDTH_M = 0.0311f;
    // Modelin yaricapi (metre). Gorselden biraz buyuk tutulur ki katmanlar rahat secilsin.
    private static final float MODEL_RADIUS_M = 0.045f;
    private static final long GROW_MS = 700;

    private GLSurfaceView surfaceView;
    private TextView hint, infoTitle, infoText;
    private LinearLayout infoPanel;

    private Session session, textureSession;
    private boolean installRequested;
    private final BackgroundRenderer background = new BackgroundRenderer();
    private final EarthRenderer earth = new EarthRenderer();
    private int viewW, viewH;
    private volatile boolean displayChanged;

    private final float[] imagePose = new float[16];
    private final float[] view = new float[16], proj = new float[16];
    private long detectedAt = -1;
    private volatile float yawDeg = -45f;   // kesik bolge kameraya baksin
    private volatile float userRadius = MODEL_RADIUS_M;
    private final ConcurrentLinkedQueue<float[]> taps = new ConcurrentLinkedQueue<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);

        surfaceView = new GLSurfaceView(this);
        surfaceView.setPreserveEGLContextOnPause(true);
        surfaceView.setEGLContextClientVersion(2);
        surfaceView.setEGLConfigChooser(8, 8, 8, 8, 16, 0);
        surfaceView.setRenderer(this);
        surfaceView.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        root.addView(surfaceView);

        hint = new TextView(this);
        hint.setTextColor(Color.WHITE);
        hint.setTypeface(Typeface.DEFAULT_BOLD);
        hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        hint.setGravity(Gravity.CENTER);
        hint.setPadding(dp(12), dp(10), dp(12), dp(10));
        hint.setBackground(rounded(Color.argb(140, 0, 0, 0), 12));
        FrameLayout.LayoutParams hp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.TOP);
        hp.setMargins(dp(16), dp(28), dp(16), 0);
        root.addView(hint, hp);

        infoPanel = new LinearLayout(this);
        infoPanel.setOrientation(LinearLayout.VERTICAL);
        infoPanel.setPadding(dp(16), dp(12), dp(16), dp(14));
        infoPanel.setBackground(rounded(Color.argb(240, 255, 255, 255), 16));
        infoPanel.setVisibility(View.GONE);
        infoTitle = new TextView(this);
        infoTitle.setTypeface(Typeface.DEFAULT_BOLD);
        infoTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 21);
        infoTitle.setTextColor(Color.rgb(217, 102, 13));
        infoText = new TextView(this);
        infoText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        infoText.setTextColor(Color.rgb(31, 31, 31));
        infoText.setPadding(0, dp(4), 0, 0);
        infoPanel.addView(infoTitle);
        infoPanel.addView(infoText);
        FrameLayout.LayoutParams ip = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
        ip.setMargins(dp(12), 0, dp(12), dp(16));
        root.addView(infoPanel, ip);

        setContentView(root);
        setHint("Kitabın 18. sayfasındaki Dünya görselini kameraya gösterin");
        setupGestures();
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable rounded(int color, int radiusDp) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        return g;
    }

    private void setupGestures() {
        GestureDetector gestures = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override public boolean onDown(MotionEvent e) { return true; }

            @Override public boolean onSingleTapUp(MotionEvent e) {
                taps.add(new float[]{e.getX(), e.getY()});
                return true;
            }

            @Override public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy) {
                yawDeg -= dx * 0.57f; // iOS'taki 0.01 rad/piksel
                return true;
            }
        });
        ScaleGestureDetector pinch = new ScaleGestureDetector(this, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override public boolean onScale(ScaleGestureDetector d) {
                userRadius = Math.max(MODEL_RADIUS_M * 0.4f, Math.min(MODEL_RADIUS_M * 4f, userRadius * d.getScaleFactor()));
                return true;
            }
        });
        surfaceView.setOnTouchListener((v, e) -> {
            pinch.onTouchEvent(e);
            if (!pinch.isInProgress() && e.getPointerCount() == 1) gestures.onTouchEvent(e);
            return true;
        });
    }

    // ---- ARCore oturumu ----

    @Override
    protected void onResume() {
        super.onResume();
        if (session == null) {
            try {
                if (ArCoreApk.getInstance().requestInstall(this, !installRequested) == ArCoreApk.InstallStatus.INSTALL_REQUESTED) {
                    installRequested = true;
                    return;
                }
                if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, 1);
                    return;
                }
                session = new Session(this);
                configure(session);
            } catch (UnavailableDeviceNotCompatibleException e) {
                setHint("Bu cihaz ARCore desteklemiyor.");
                return;
            } catch (UnavailableException e) {
                setHint("Play Store'dan \"Google Play Services for AR\" kurulmalı.");
                return;
            } catch (ImageInsufficientQualityException e) {
                setHint("Referans görsel ARCore için yetersiz bulundu.");
                session = null;
                return;
            } catch (Exception e) {
                Log.e(TAG, "Oturum acilamadi", e);
                setHint("AR başlatılamadı: " + e.getMessage());
                return;
            }
        }
        try {
            session.resume();
        } catch (CameraNotAvailableException e) {
            setHint("Kamera açılamadı. Uygulamayı yeniden başlatın.");
            session = null;
            return;
        }
        surfaceView.onResume();
        displayChanged = true;
    }

    private void configure(Session s) throws Exception {
        Config config = new Config(s);
        config.setFocusMode(Config.FocusMode.AUTO); // 3 cm'lik gorsel yakindan okunur
        config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
        AugmentedImageDatabase db = new AugmentedImageDatabase(s);
        try (InputStream in = getAssets().open("DunyaReferans.png")) {
            Bitmap bmp = BitmapFactory.decodeStream(in);
            db.addImage("dunya_s18", bmp, REFERENCE_WIDTH_M);
        }
        config.setAugmentedImageDatabase(db);
        s.configure(config);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (session != null) {
            surfaceView.onPause();
            session.pause();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (session != null) {
            session.close();
            session = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (results.length == 0 || results[0] != PackageManager.PERMISSION_GRANTED) {
            setHint("Kamera izni olmadan AR çalışmaz. Ayarlar'dan izin verin.");
        }
    }

    // ---- Cizim (GL is parcacigi) ----

    @Override
    public void onSurfaceCreated(GL10 gl, EGLConfig config) {
        GLES20.glClearColor(0, 0, 0, 1);
        background.create();
        earth.create();
        textureSession = null;
    }

    @Override
    public void onSurfaceChanged(GL10 gl, int w, int h) {
        GLES20.glViewport(0, 0, w, h);
        viewW = w;
        viewH = h;
        displayChanged = true;
    }

    @Override
    public void onDrawFrame(GL10 gl) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
        Session s = session;
        if (s == null) return;
        if (s != textureSession) {
            s.setCameraTextureName(background.textureId());
            textureSession = s;
        }
        if (displayChanged) {
            s.setDisplayGeometry(getWindowManager().getDefaultDisplay().getRotation(), viewW, viewH);
            displayChanged = false;
        }
        try {
            Frame frame = s.update();
            Camera camera = frame.getCamera();
            background.draw(frame);

            for (AugmentedImage img : frame.getUpdatedTrackables(AugmentedImage.class)) {
                if (img.getTrackingState() == TrackingState.TRACKING
                        && img.getTrackingMethod() == AugmentedImage.TrackingMethod.FULL_TRACKING) {
                    // Goruntu pozunda y ekseni sayfaya dik (sayfadan disari) bakar.
                    img.getCenterPose().toMatrix(imagePose, 0);
                    if (detectedAt < 0) {
                        detectedAt = SystemClock.uptimeMillis();
                        setHint("Bir katmana dokun • Sürükle: döndür • İki parmak: büyüt");
                    }
                }
            }
            if (detectedAt < 0 || camera.getTrackingState() != TrackingState.TRACKING) {
                taps.clear();
                return;
            }

            camera.getProjectionMatrix(proj, 0, 0.01f, 20f);
            camera.getViewMatrix(view, 0);

            // Buyuyerek yukselme (ease-out), sonra kullanici olcegi
            float t = Math.min(1f, (SystemClock.uptimeMillis() - detectedAt) / (float) GROW_MS);
            float e = 1 - (1 - t) * (1 - t) * (1 - t);
            float r = userRadius;
            earth.draw(view, proj, imagePose, Math.max(r * e, 0.0005f), r * (0.2f + 0.95f * e), yawDeg, viewW, viewH);

            float[] tap;
            while ((tap = taps.poll()) != null) {
                String key = earth.hitTest(tap[0], tap[1], viewW, viewH);
                runOnUiThread(() -> showInfo(key));
            }
        } catch (Throwable th) {
            Log.e(TAG, "Kare cizilemedi", th);
        }
    }

    // ---- Arayuz ----

    private void setHint(String text) {
        runOnUiThread(() -> hint.setText(text));
    }

    private void showInfo(String key) {
        EarthModel.Layer l = key == null ? null : EarthModel.layer(key);
        if (l == null) {
            infoPanel.setVisibility(View.GONE);
            return;
        }
        infoTitle.setText(l.title);
        infoText.setText(l.info);
        infoPanel.setAlpha(0f);
        infoPanel.setVisibility(View.VISIBLE);
        infoPanel.animate().alpha(1f).setDuration(200).start();
    }
}
