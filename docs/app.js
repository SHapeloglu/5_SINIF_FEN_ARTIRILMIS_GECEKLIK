// Dunya'nin Katmanlari - web AR (MindAR + three.js).
// iOS (ARKit) ve Android (ARCore) surumleriyle ayni model: yaricapi 1 birim, x>0, y>0, z>0 sekizde biri kesik.
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

// Kitaptaki (s.18) Dunya gorselinin basili genisligi 31.1 mm; MindAR'da gorsel genisligi = 1 birim.
const REFERENCE_WIDTH_M = 0.0311;
const MODEL_RADIUS_M = 0.045;
const RADIUS = MODEL_RADIUS_M / REFERENCE_WIDTH_M; // gorsel biriminde model yaricapi
const GROW_MS = 700;

// Katman sinirlari Dunya yaricapina oranladir. Yer kabugu gercekte cok incedir (~0.005);
// gorunebilmesi icin kalin cizilir (model olcekli degildir).
const LAYERS = [
  { key: 'ic_cekirdek', title: 'İç çekirdek', r0: 0.00, r1: 0.20, inner: [1.00, 0.97, 0.88], outer: [0.98, 0.86, 0.62],
    info: "Dünya'nın merkezindeki en sıcak katmandır. Çok yüksek basınç nedeniyle katı hâldedir; demir ve nikelden oluşur." },
  { key: 'dis_cekirdek', title: 'Dış çekirdek', r0: 0.20, r1: 0.55, inner: [1.00, 0.86, 0.30], outer: [1.00, 0.58, 0.10],
    info: 'Mantonun altındadır. Çok sıcaktır ve sıvı hâldedir. Büyük ölçüde demir ve nikelden oluşur.' },
  { key: 'manto', title: 'Manto', r0: 0.55, r1: 0.91, inner: [0.98, 0.45, 0.08], outer: [0.72, 0.16, 0.05],
    info: 'Yer kabuğunun altındaki en kalın katmandır. Sıcaklığı çok yüksektir; bazı bölümlerinde erimiş kayaçlar (magma) bulunur.' },
  { key: 'yer_kabugu', title: 'Yer kabuğu', r0: 0.91, r1: 1.00, inner: [0.55, 0.32, 0.16], outer: [0.38, 0.21, 0.11],
    info: "Dünya'nın en dış ve en ince katmanıdır. Üzerinde yaşadığımız karalar ve okyanus tabanları bu katmandadır. Katı hâldedir." },
];
const LAYER_BY_KEY = Object.fromEntries(LAYERS.map((l) => [l.key, l]));

const $ = (s) => document.querySelector(s);

// ---------- Geometri ----------

function surfaceGeometry() {
  const N = 96, M = 48; // boylam / enlem bolmeleri (4 ve 2'nin kati olmali)
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= M; j++) {
    const phi = -Math.PI / 2 + (Math.PI * j) / M;
    for (let i = 0; i <= N; i++) {
      const th = (2 * Math.PI * i) / N;
      pos.push(Math.cos(phi) * Math.cos(th), Math.sin(phi), Math.cos(phi) * Math.sin(th));
      uv.push(i / N, j / M); // CanvasTexture flipY: v=1 tuvalin ustu (kuzey)
    }
  }
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      if (i < N / 4 && j >= M / 2) continue; // kesilen sekizde bir
      const a = j * (N + 1) + i, b = (j + 1) * (N + 1) + i;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function linearColor(c) {
  const col = new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
  return [col.r, col.g, col.b];
}

// Katmanin uc kesit yuzundeki (y=0, x=0, z=0 duzlemleri) ceyrek halkalari.
function cutFacesGeometry(l) {
  const pos = [], nrm = [], col = [], idx = [];
  const ci = linearColor(l.inner), co = linearColor(l.outer);
  const sector = (e1, e2, n) => {
    const segs = 32;
    let prevIn = 0, prevOut = 0;
    for (let s = 0; s <= segs; s++) {
      const a = (Math.PI / 2) * (s / segs), ca = Math.cos(a), sa = Math.sin(a);
      const d = [0, 1, 2].map((k) => ca * e1[k] + sa * e2[k]);
      const vin = pos.length / 3;
      pos.push(d[0] * l.r0, d[1] * l.r0, d[2] * l.r0); nrm.push(...n); col.push(...ci);
      const vout = pos.length / 3;
      pos.push(d[0] * l.r1, d[1] * l.r1, d[2] * l.r1); nrm.push(...n); col.push(...co);
      if (s > 0) {
        idx.push(prevIn, prevOut, vout);
        if (l.r0 > 0) idx.push(prevIn, vout, vin); // merkezde bu ucgen sifir alanli
      }
      prevIn = vin; prevOut = vout;
    }
  };
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  sector(X, Z, Y); // taban (y=0)
  sector(Y, Z, X); // x=0 duvari
  sector(X, Y, Z); // z=0 duvari
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// ---------- Dokular ----------

// Sabit tohumlu rastgele sayi (her acilista ayni gorunum)
function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Prosedurel Dunya dokusu (temsili kara, kutup ve bulutlar). Ust kenar kuzey kutbudur.
function earthTexture() {
  const W = 1024, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0f3373'); g.addColorStop(0.5, '#1a5cb8'); g.addColorStop(1, '#0f3373');
  c.fillStyle = g; c.fillRect(0, 0, W, H);

  const r = rng(18);
  const oval = (x, y, w, h) => { c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill(); };
  for (let k = 0; k < 13; k++) {
    const cx = r() * W, cy = H * (0.18 + r() * 0.64), spread = 40 + r() * 70;
    for (let e = 0; e < 26; e++) {
      const x = cx + (r() - 0.5) * spread * 2.2, y = cy + (r() - 0.5) * spread * 1.4;
      const w = 18 + r() * 50, h = 12 + r() * 34;
      c.fillStyle = r() < 0.3 ? '#b39461' : `rgb(${51 + r() * 25 | 0},${115 + r() * 25 | 0},46)`;
      for (let wrap = -1; wrap <= 1; wrap++) oval(x - w / 2 + wrap * W, y - h / 2, w, h);
    }
  }
  c.fillStyle = '#f2f7ff';
  for (let x = -30; x < W + 30; x += 26) {
    const t = 18 + r() * 22, b = 18 + r() * 22;
    oval(x, -t, 46, t * 2);
    oval(x, H - b, 46, b * 2);
  }
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(255,255,255,${0.18 + r() * 0.25})`;
    const w = 40 + r() * 120, h = 6 + r() * 14, x = r() * W, y = r() * H;
    for (let wrap = -1; wrap <= 1; wrap++) oval(x + wrap * W, y, w, h);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Kameraya donuk etiket. dot verilirse solda katman rengi nokta cizilir.
function labelSprite(text, dot, bg, height) {
  const fs = 64, pad = fs * 0.45, dotD = dot ? fs * 0.7 : 0, gap = dot ? fs * 0.35 : 0;
  const font = `bold ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const cv = document.createElement('canvas');
  const c = cv.getContext('2d');
  c.font = font;
  const tw = c.measureText(text).width, th = fs * 1.2;
  cv.width = Math.ceil(tw + dotD + gap + pad * 2);
  cv.height = Math.ceil(th + pad * 1.2);
  c.font = font;
  c.fillStyle = bg;
  c.beginPath();
  c.roundRect(0, 0, cv.width, cv.height, cv.height * 0.3);
  c.fill();
  if (dot) {
    c.fillStyle = `rgb(${dot.map((v) => Math.round(v * 255)).join(',')})`;
    c.beginPath();
    c.arc(pad + dotD / 2, cv.height / 2, dotD / 2, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#fff';
  c.textBaseline = 'middle';
  c.fillText(text, pad + dotD + gap, cv.height / 2 + fs * 0.04);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set((height * cv.width) / cv.height, height, 1);
  sp.renderOrder = 10;
  return sp;
}

function lineMesh(a, b, mat) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), mat);
  m.position.copy(va).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// ---------- Model ----------

function buildModel() {
  const pickables = [];
  const spin = new THREE.Group();
  spin.rotation.y = -Math.PI / 4; // kesik bolge kameraya baksin

  const surface = new THREE.Mesh(surfaceGeometry(),
    new THREE.MeshLambertMaterial({ map: earthTexture(), side: THREE.DoubleSide }));
  surface.userData.key = 'yer_kabugu';
  spin.add(surface);
  pickables.push(surface);

  for (const l of LAYERS) {
    const m = new THREE.Mesh(cutFacesGeometry(l),
      new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    m.userData.key = l.key;
    spin.add(m);
    pickables.push(m);
  }

  // Etiketler: kesik bolgenin tabanindaki noktalardan, kesigin onune dogru cizgiyle cikar.
  // Model -45 derece dondugu icin (1,0,1) yonu kameraya, (1,0,-1) yonu saga bakar.
  const s2 = Math.SQRT1_2, side = [1, -1, 1, -1], height = [0.30, 0.62, 0.95, 1.25];
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  LAYERS.forEach((l, k) => {
    const rm = (l.r0 + l.r1) / 2;
    const anchor = [rm * s2, 0.002, rm * s2];
    const fwd = 1.30 * s2, right = 0.72 * side[k] * s2;
    const pos = [fwd + right, height[k], fwd - right];
    const sp = labelSprite(l.title, l.outer, 'rgba(20,20,20,0.78)', 0.17);
    sp.position.set(...pos);
    sp.userData.key = l.key;
    spin.add(sp);
    pickables.push(sp);
    spin.add(lineMesh(anchor, pos, lineMat));
  });

  const content = new THREE.Group();
  content.add(spin);
  const title = labelSprite("Dünya'nın Katmanları", null, 'rgba(242,140,31,0.92)', 0.22);
  title.position.set(0, 1.62, 0);
  content.add(title);

  // MindAR capasinda gorsel XY duzleminde, z sayfadan disari bakar. Modelde sayfaya dik eksen y oldugu icin
  // x ekseni etrafinda +90 derece dondurulur (model z'si gorselin altina bakar; ARKit/ARCore ile ayni).
  const base = new THREE.Group();
  base.rotation.x = Math.PI / 2;
  base.add(content);
  return { base, content, spin, pickables };
}

// ---------- Arayuz ----------

function setHint(text) {
  const h = $('#hint');
  h.textContent = text;
  h.style.display = text ? 'block' : 'none';
}

function showInfo(key) {
  const panel = $('#info');
  const l = key && LAYER_BY_KEY[key];
  if (!l) { panel.style.display = 'none'; return; }
  panel.querySelector('h2').textContent = l.title;
  panel.querySelector('p').textContent = l.info;
  panel.style.opacity = '0';
  panel.style.display = 'block';
  requestAnimationFrame(() => { panel.style.opacity = '1'; });
}

// ---------- AR ----------

async function start() {
  const go = $('#go');
  go.disabled = true;
  go.textContent = 'Yükleniyor…';
  $('#err').textContent = '';

  const container = $('#ar');
  const mindar = new MindARThree({
    container,
    imageTargetSrc: 'targets.mind',
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
    filterMinCF: 0.0001, // titremeyi azaltir
    filterBeta: 0.001,
  });
  const { renderer, scene, camera } = mindar;

  // Lambert isiklari three r155+ fiziksel birimdedir; pi ile carpim eski (iOS/Android) parlaklikla eslesir.
  scene.add(new THREE.AmbientLight(0xffffff, 0.45 * Math.PI));
  const sun = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI);
  sun.position.set(0.3, 0.6, 1);
  scene.add(sun);

  const model = buildModel();
  const anchor = mindar.addAnchor(0);
  anchor.group.add(model.base);

  let detectedAt = -1;
  let userRadius = RADIUS;
  anchor.onTargetFound = () => {
    if (detectedAt < 0) detectedAt = performance.now();
    setHint('Bir katmana dokun • Sürükle: döndür • İki parmak: büyüt');
  };
  anchor.onTargetLost = () => {
    setHint("Kitabın 18. sayfasındaki Dünya görselini kameraya gösterin");
    showInfo(null);
  };

  try {
    await mindar.start();
  } catch (e) {
    console.error(e);
    go.disabled = false;
    go.textContent = 'Tekrar Dene';
    $('#err').textContent = location.protocol !== 'https:' && location.hostname !== 'localhost'
      ? 'Kamera yalnızca güvenli (https) bağlantıda açılır.'
      : 'Kamera açılamadı. Tarayıcı ayarlarından kamera iznini verip tekrar deneyin.';
    return;
  }
  $('#start').style.display = 'none';
  setHint("Kitabın 18. sayfasındaki Dünya görselini kameraya gösterin");

  renderer.setAnimationLoop(() => {
    // Buyuyerek yukselme (ease-out), sonra kullanici olcegi
    const t = detectedAt < 0 ? 0 : Math.min(1, (performance.now() - detectedAt) / GROW_MS);
    const e = 1 - (1 - t) ** 3;
    const s = Math.max(userRadius * e, 1e-4);
    model.content.scale.setScalar(s);
    model.content.position.set(0, userRadius * (0.2 + 0.95 * e), 0);
    renderer.render(scene, camera);
  });

  // Dokunma: tek parmak surukle = dondur, kisa dokunus = katman bilgisi, iki parmak = olcek
  const pointers = new Map();
  let pinchStart = 0, pinchRadius = userRadius, moved = 0;
  const raycaster = new THREE.Raycaster();

  container.addEventListener('pointerdown', (ev) => {
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      pinchRadius = userRadius;
    }
  });
  container.addEventListener('pointermove', (ev) => {
    const p = pointers.get(ev.pointerId);
    if (!p) return;
    const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    p.x = ev.clientX; p.y = ev.clientY;
    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      model.spin.rotation.y += dx * 0.01;
    } else if (pointers.size === 2 && pinchStart > 0) {
      moved = Infinity;
      const [a, b] = [...pointers.values()];
      const f = Math.hypot(a.x - b.x, a.y - b.y) / pinchStart;
      userRadius = Math.min(RADIUS * 4, Math.max(RADIUS * 0.4, pinchRadius * f));
    }
  });
  const up = (ev) => {
    const wasTap = pointers.size === 1 && moved < 8;
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinchStart = 0;
    if (!wasTap || ev.type === 'pointercancel' || !anchor.group.visible || detectedAt < 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(model.pickables, false)
      .sort((a, b) => (b.object.isSprite ? 1 : 0) - (a.object.isSprite ? 1 : 0) || a.distance - b.distance)[0];
    showInfo(hit ? hit.object.userData.key : null);
  };
  container.addEventListener('pointerup', up);
  container.addEventListener('pointercancel', up);
}

$('#go').addEventListener('click', start);
