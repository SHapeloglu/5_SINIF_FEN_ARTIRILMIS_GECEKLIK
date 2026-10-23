// Ortak 3D bilesenler. Tum sahneler "sahne birimi" ile calisir: hedef gorselin genisligi = 1.
// Sahne grubunda y ekseni sayfadan yukari (sayfaya dik), x saga, z gorselin altina (izleyiciye) bakar.
import * as THREE from 'three';

export { THREE };

export const C = {
  white: 0xffffff, red: 0xe53935, orange: 0xf28c1f, yellow: 0xffd54f, green: 0x43a047,
  blue: 0x1e88e5, navy: 0x1a237e, gray: 0x9e9e9e, dark: 0x263238, brown: 0x8d6e63,
  bone: 0xf1e3c6, muscle: 0xc0392b, skin: 0xf2c6a0,
};

// Sabit tohumlu rastgele sayi (her acilista ayni gorunum)
export function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

export function basic(color, extra = {}) {
  return new THREE.MeshBasicMaterial({ color, ...extra });
}

/** Dokunuldugunda bilgi gosterecek nesne. */
export function info(obj, title, text) {
  obj.userData.title = title;
  obj.userData.info = text;
  return obj;
}

// ---------- Etiketler ----------

function drawLabel(cv, text, { dot, bg = 'rgba(20,20,20,0.8)', fg = '#fff', size = 64 } = {}) {
  const pad = size * 0.45, dotD = dot ? size * 0.7 : 0, gap = dot ? size * 0.35 : 0;
  const font = `bold ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const c = cv.getContext('2d');
  c.font = font;
  const lines = String(text).split('\n');
  const tw = Math.max(...lines.map((l) => c.measureText(l).width));
  const lh = size * 1.2;
  cv.width = Math.ceil(tw + dotD + gap + pad * 2);
  cv.height = Math.ceil(lh * lines.length + pad * 1.2);
  c.font = font;
  c.fillStyle = bg;
  c.beginPath();
  c.roundRect(0, 0, cv.width, cv.height, Math.min(cv.height * 0.3, size * 0.6));
  c.fill();
  if (dot) {
    c.fillStyle = typeof dot === 'number' ? '#' + dot.toString(16).padStart(6, '0') : dot;
    c.beginPath();
    c.arc(pad + dotD / 2, cv.height / 2, dotD / 2, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = fg;
  c.textBaseline = 'middle';
  lines.forEach((l, i) => c.fillText(l, pad + dotD + gap, pad * 0.6 + lh * (i + 0.5)));
}

/**
 * Kameraya donuk etiket. height: sahne biriminde satir yuksekligi.
 * Donen sprite'in setText(t) metodu metni gunceller (sayac, olcum degeri vb. icin).
 */
export function label(text, { height = 0.07, ...style } = {}) {
  const cv = document.createElement('canvas');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.renderOrder = 20;
  let current = null;
  sp.setText = (t) => {
    if (t === current) return;
    current = t;
    drawLabel(cv, t, style);
    tex.needsUpdate = true;
    const lines = String(t).split('\n').length;
    // 1.35: telefonda 20-30 cm'den okunabilirlik icin buyutme
    const h = 1.35 * height * (lines * 1.2 + 0.9) / 2.1;
    sp.scale.set((h * cv.width) / cv.height, h, 1);
  };
  sp.setText(text);
  return sp;
}

/** Etiket + nesneye uzanan ince cizgi. */
export function callout(text, from, to, opts = {}) {
  const g = new THREE.Group();
  const l = label(text, opts);
  l.position.copy(to);
  g.add(l, line([from, to], opts.lineColor ?? 0xffffff));
  g.label = l;
  return g;
}

export function line(points, color = 0xffffff, dashed = false) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.03, gapSize: 0.02 })
    : new THREE.LineBasicMaterial({ color });
  const l = new THREE.Line(geo, mat);
  if (dashed) l.computeLineDistances();
  return l;
}

// ---------- Temel sekiller ----------

export function box(w, h, d, color, extra) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color, extra));
}

export function cyl(rTop, rBot, h, color, seg = 24, extra) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), lambert(color, extra));
}

export function ball(r, color, seg = 32, extra) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), lambert(color, extra));
}

export function capsule(r, len, color, extra) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), lambert(color, extra));
}

/** a noktasindan b noktasina uzanan silindir. */
export function rod(a, b, r, color, seg = 10) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), seg), lambert(color));
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

/** Ok (govde + uc). setLength(l) ile boyu degisir. */
export function arrow(dir, length, color = C.red, thick = 0.012) {
  const g = new THREE.Group();
  const mat = basic(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick, 1, 10), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(thick * 2.6, thick * 6, 14), mat);
  g.add(shaft, head);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.setLength = (l) => {
    const hl = Math.min(thick * 6, l * 0.5);
    shaft.scale.set(1, Math.max(l - hl, 1e-4), 1);
    shaft.position.y = (l - hl) / 2;
    head.scale.set(1, hl / (thick * 6), 1);
    head.position.y = l - hl / 2;
  };
  g.setLength(length);
  return g;
}

/** Donme yonunu gosteren kavisli ok (yatay duzlemde, saat yonunun tersine). */
export function spinArrow(radius, color = C.yellow, arc = Math.PI * 1.4) {
  const g = new THREE.Group();
  const mat = basic(color);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.04, 6, 40, arc), mat));
  const head = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.12, radius * 0.3, 10), mat);
  head.position.set(Math.cos(arc) * radius, Math.sin(arc) * radius, 0);
  head.rotation.z = arc;
  g.add(head);
  g.rotation.x = -Math.PI / 2; // xz duzlemine yatir; yukaridan bakinca saat yonunun tersi
  return g;
}

export function orbit(radius, color = 0xffffff, dashed = true, rz = radius) {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * rz));
  }
  return line(pts, color, dashed);
}

export function stars(n = 300, r = 2.2, seed = 3) {
  const rnd = rng(seed), pos = [];
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.push(Math.cos(a) * s * r, Math.abs(u) * r * 0.9 + 0.1, Math.sin(a) * s * r);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012 }));
}

// ---------- Dokular ----------

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function oval(c, x, y, w, h) {
  c.beginPath();
  c.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
  c.fill();
}

const texCache = {};

/** 'earth' | 'moon' | 'sun' esdikdortgen dokulari (ust kenar kuzey). */
export function planetTexture(kind) {
  if (texCache[kind]) return texCache[kind];
  const r = rng(kind === 'earth' ? 18 : kind === 'moon' ? 7 : 11);
  const W = 1024, H = 512;
  let t;
  if (kind === 'earth') {
    t = canvasTex(W, H, (c) => {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0f3373'); g.addColorStop(0.5, '#1a5cb8'); g.addColorStop(1, '#0f3373');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let k = 0; k < 13; k++) {
        const cx = r() * W, cy = H * (0.18 + r() * 0.64), spread = 40 + r() * 70;
        for (let e = 0; e < 26; e++) {
          const x = cx + (r() - 0.5) * spread * 2.2, y = cy + (r() - 0.5) * spread * 1.4;
          const w = 18 + r() * 50, h = 12 + r() * 34;
          c.fillStyle = r() < 0.3 ? '#b39461' : `rgb(${51 + r() * 25 | 0},${115 + r() * 25 | 0},46)`;
          for (let wrap = -1; wrap <= 1; wrap++) oval(c, x - w / 2 + wrap * W, y - h / 2, w, h);
        }
      }
      c.fillStyle = '#f2f7ff';
      for (let x = -30; x < W + 30; x += 26) {
        const a = 18 + r() * 22, b = 18 + r() * 22;
        oval(c, x, -a, 46, a * 2); oval(c, x, H - b, 46, b * 2);
      }
      for (let i = 0; i < 90; i++) {
        c.fillStyle = `rgba(255,255,255,${0.18 + r() * 0.25})`;
        const w = 40 + r() * 120, h = 6 + r() * 14, x = r() * W, y = r() * H;
        for (let wrap = -1; wrap <= 1; wrap++) oval(c, x + wrap * W, y, w, h);
      }
    });
  } else if (kind === 'moon') {
    t = canvasTex(W, H, (c) => {
      c.fillStyle = '#9a9a96'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) { // karanlik duzlukler (denizler)
        c.fillStyle = `rgba(70,70,72,${0.35 + r() * 0.3})`;
        const w = 80 + r() * 200, x = r() * W, y = H * (0.25 + r() * 0.5);
        for (let wrap = -1; wrap <= 1; wrap++) oval(c, x + wrap * W, y, w, w * (0.5 + r() * 0.4));
      }
      for (let i = 0; i < 260; i++) { // kraterler
        const d = 4 + r() ** 3 * 50, x = r() * W, y = r() * H;
        c.fillStyle = 'rgba(60,60,60,0.35)'; oval(c, x, y, d, d);
        c.fillStyle = 'rgba(215,215,210,0.35)'; oval(c, x - d * 0.12, y - d * 0.12, d * 0.8, d * 0.8);
        c.fillStyle = 'rgba(120,120,118,0.6)'; oval(c, x + d * 0.08, y + d * 0.08, d * 0.7, d * 0.7);
      }
    });
  } else if (kind === 'sun') {
    t = canvasTex(W, H, (c) => {
      c.fillStyle = '#ff9a1a'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600; i++) { // granulasyon
        const d = 4 + r() * 16, x = r() * W, y = r() * H;
        c.fillStyle = r() < 0.5 ? `rgba(255,${200 + r() * 55 | 0},80,0.5)` : 'rgba(200,70,0,0.35)';
        oval(c, x, y, d, d);
      }
    });
  }
  texCache[kind] = t;
  return t;
}

export function planet(kind, r = 0.3, seg = 48) {
  const mat = kind === 'sun'
    ? new THREE.MeshBasicMaterial({ map: planetTexture('sun') })
    : new THREE.MeshLambertMaterial({ map: planetTexture(kind) });
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat);
}

/** Gunes ve isik kaynaklari icin parlama halesi. */
export function glow(size, color = '#ffb300') {
  const tex = canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color); g.addColorStop(0.35, color + 'aa'); g.addColorStop(1, color + '00');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.set(size, size, 1);
  return sp;
}

export function sun(r = 0.25) {
  const g = new THREE.Group();
  g.body = planet('sun', r);
  g.add(g.body, glow(r * 3.4));
  return g;
}

/**
 * Isik yonu bir dunya noktasindan (gunes) gelen, ortam isigindan etkilenmeyen malzeme.
 * Ay evreleri gibi karanlik tarafin gercekten karanlik gorunmesi gereken yerlerde kullanilir.
 * sunWorld: THREE.Vector3 (her karede guncellenir).
 */
export function sunlitMaterial(map, sunWorld, ambient = 0.03) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, sunPos: { value: sunWorld }, amb: { value: ambient } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 sunPos; uniform float amb;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main() {
        float d = max(dot(normalize(vN), normalize(sunPos - vW)), 0.0);
        vec3 c = texture2D(map, vUv).rgb * (amb + d * 1.05);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Kameraya donuk duran ve evresi phase (0..1; 0 yeni ay, 0.5 dolunay) ile verilen Ay.
 * Ay'in Dunya'dan nasil gorundugunu gostermek icin.
 */
export function phaseMoon(r = 0.12) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: planetTexture('moon') }, phase: { value: 0.25 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN;
      void main() { vUv = uv; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform float phase; varying vec2 vUv; varying vec3 vN;
      void main() {
        float a = phase * 6.2831853;
        vec3 L = vec3(sin(a), 0.0, -cos(a));
        float d = max(dot(normalize(vN), L), 0.0);
        gl_FragColor = vec4(texture2D(map, vUv).rgb * (0.04 + d), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 20), mat);
  m.setPhase = (p) => { mat.uniforms.phase.value = p; };
  const camPos = new THREE.Vector3();
  m.onBeforeRender = (renderer, scene, camera) => {
    // Yerel +z kameraya baksin (aydinlik taraf yonu buna gore hesaplanir)
    m.lookAt(camPos.setFromMatrixPosition(camera.matrixWorld));
    m.updateMatrixWorld();
  };
  return m;
}

export function phaseName(p) {
  const names = ['Yeni Ay', 'Hilal', 'İlk Dördün', 'Şişkin Ay', 'Dolunay', 'Şişkin Ay', 'Son Dördün', 'Hilal'];
  return names[Math.round(((p % 1) + 1) % 1 * 8) % 8];
}

// ---------- Katmanli kesit kure ----------

/**
 * Bir sekizde biri (x>0, y>0, z>0) kesik kure. layers: [{key,title,r0,r1,inner,outer,info}]
 * (renkler 0..1 sRGB dizileri). surface: dis yuzey malzemesi.
 */
export function cutSphere(layers, surface, { labels = true, labelHeight = 0.09 } = {}) {
  const g = new THREE.Group();
  const N = 96, M = 48, pos = [], uv = [], idx = [];
  for (let j = 0; j <= M; j++) {
    const phi = -Math.PI / 2 + (Math.PI * j) / M;
    for (let i = 0; i <= N; i++) {
      const th = (2 * Math.PI * i) / N;
      pos.push(Math.cos(phi) * Math.cos(th), Math.sin(phi), Math.cos(phi) * Math.sin(th));
      uv.push(i / N, j / M);
    }
  }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    if (i < N / 4 && j >= M / 2) continue;
    const a = j * (N + 1) + i, b = (j + 1) * (N + 1) + i;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  sg.setAttribute('normal', new THREE.Float32BufferAttribute(pos, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  sg.setIndex(idx);
  surface.side = THREE.DoubleSide;
  const outer = layers[layers.length - 1];
  g.add(info(new THREE.Mesh(sg, surface), outer.title, outer.info));

  const lin = (c) => { const k = new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace); return [k.r, k.g, k.b]; };
  const s2 = Math.SQRT1_2, side = [1, -1, 1, -1, 1, -1];
  layers.forEach((l, k) => {
    const p = [], n = [], col = [], ix = [];
    const ci = lin(l.inner), co = lin(l.outer);
    const sector = (e1, e2, nn) => {
      let pi = 0, po = 0;
      for (let s = 0; s <= 32; s++) {
        const a = (Math.PI / 2) * (s / 32), ca = Math.cos(a), sa = Math.sin(a);
        const d = [0, 1, 2].map((q) => ca * e1[q] + sa * e2[q]);
        const vi = p.length / 3; p.push(d[0] * l.r0, d[1] * l.r0, d[2] * l.r0); n.push(...nn); col.push(...ci);
        const vo = p.length / 3; p.push(d[0] * l.r1, d[1] * l.r1, d[2] * l.r1); n.push(...nn); col.push(...co);
        if (s > 0) { ix.push(pi, po, vo); if (l.r0 > 0) ix.push(pi, vo, vi); }
        pi = vi; po = vo;
      }
    };
    sector([1, 0, 0], [0, 0, 1], [0, 1, 0]);
    sector([0, 1, 0], [0, 0, 1], [1, 0, 0]);
    sector([1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    fg.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    fg.setIndex(ix);
    const mat = l.emissive
      ? new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
      : new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    g.add(info(new THREE.Mesh(fg, mat), l.title, l.info));

    if (labels) {
      const rm = (l.r0 + l.r1) / 2;
      const anchor = new THREE.Vector3(rm * s2, 0.002, rm * s2);
      const fwd = 1.30 * s2, right = 0.72 * side[k] * s2;
      const to = new THREE.Vector3(fwd + right, 0.3 + k * (0.95 / Math.max(1, layers.length - 1)), fwd - right);
      const dot = '#' + l.outer.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
      const co2 = callout(l.title, anchor, to, { height: labelHeight, dot });
      info(co2.label, l.title, l.info);
      g.add(co2);
    }
  });
  g.rotation.y = -Math.PI / 4; // kesik bolge izleyiciye baksin
  return g;
}

// ---------- Yay ve dinamometre ----------

/** Birim uzunlukta (y: 0..-1) helis yay; scale.y ile uzar. */
export function spring(radius = 0.03, turns = 12, wire = 0.005, color = 0xb0bec5) {
  class Helix extends THREE.Curve {
    getPoint(t) {
      const a = t * turns * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, -t, Math.sin(a) * radius);
    }
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new Helix(), turns * 16, wire, 6, false),
    new THREE.MeshLambertMaterial({ color }));
}

/**
 * Seffaf govdeli dinamometre. Ust kanca y=0'da, govde asagi uzanir.
 * setForce(f) (0..1 olcek) yayi uzatir, gostergeyi ve alt kancayi indirir. hook: alt kanca grubu.
 */
export function dynamometer({ len = 0.5, r = 0.05, color = 0x1e88e5, maxN = 10, springColor = 0xb0bec5, thick = 1 } = {}) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.TorusGeometry(r * 0.5, r * 0.12, 8, 20), lambert(0x607d8b));
  top.position.y = r * 0.5;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 24, 1, true),
    new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  body.position.y = -len / 2;
  const cap = cyl(r * 1.05, r * 1.05, r * 0.25, color);
  cap.position.y = -r * 0.1;
  const sp = spring(r * 0.55, 14, 0.005 * thick, springColor);
  const restLen = len * 0.45;
  sp.position.y = -r * 0.2;
  // Olcek cizgileri
  for (let i = 0; i <= maxN; i++) {
    const tick = box(i % 5 === 0 ? r * 0.6 : r * 0.35, 0.003, 0.003, 0xffffff);
    tick.position.set(r * 0.7, -r * 0.2 - restLen - (len * 0.45 * i) / maxN, r * 0.75);
    g.add(tick);
  }
  const marker = box(r * 0.9, r * 0.12, r * 0.9, C.red);
  const rodM = cyl(r * 0.08, r * 0.08, 1, 0x90a4ae, 8);
  const hook = new THREE.Group();
  const hk = new THREE.Mesh(new THREE.TorusGeometry(r * 0.35, r * 0.08, 8, 16, Math.PI * 1.5), lambert(0x607d8b));
  hk.rotation.z = Math.PI * 0.75;
  hk.position.y = -r * 0.35;
  hook.add(hk);
  g.add(top, body, cap, sp, marker, rodM, hook);
  g.hook = hook;
  g.setForce = (f) => {
    const L = restLen + len * 0.45 * Math.min(1.05, Math.max(0, f));
    sp.scale.y = L;
    marker.position.y = -r * 0.2 - L;
    rodM.scale.y = len - L;
    rodM.position.y = -r * 0.2 - L - (len - L) / 2;
    hook.position.y = -len - r * 0.25;
  };
  g.setForce(0);
  g.length = len + r * 0.6;
  return g;
}

// ---------- Ay yuzeyi ----------

/** Kraterli zemin. craters: [{x,z,r,depth}] (hepsi sahne biriminde). setCrater ile sonradan eklenebilir. */
export function terrain(w = 1.2, d = 0.9, seg = 120, craters = [], { color = 0x9e9e9a, rough = 0.012, seed = 5, maria = [] } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.round((seg * d) / w));
  geo.rotateX(-Math.PI / 2);
  // Zemin taban yuksekligi 0.07: kraterler (~0.06 derinlik) sayfanin altina inmesin
  const posA = geo.attributes.position;
  const base = new Float32Array(posA.count);
  const rnd = rng(seed);
  const bumps = Array.from({ length: 40 }, () => [rnd() * w - w / 2, rnd() * d - d / 2, 0.03 + rnd() * 0.1, (rnd() - 0.5) * rough * 2]);
  for (let i = 0; i < posA.count; i++) {
    const x = posA.getX(i), z = posA.getZ(i);
    let h = 0.07;
    for (const [bx, bz, br, bh] of bumps) h += bh * Math.exp(-((x - bx) ** 2 + (z - bz) ** 2) / (br * br));
    h += (Math.sin(x * 60 + z * 13) * Math.sin(z * 55 - x * 7)) * rough * 0.15;
    base[i] = h;
  }
  const col = new Float32Array(posA.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const cBase = new THREE.Color(color);
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  const list = [...craters];
  mesh.update = () => {
    for (let i = 0; i < posA.count; i++) {
      const x = posA.getX(i), z = posA.getZ(i);
      let h = base[i], shade = 1;
      for (const m of maria) {
        const q = ((x - m.x) / m.rx) ** 2 + ((z - m.z) / m.rz) ** 2;
        if (q < 1) { h = 0.07 + (h - 0.07) * 0.3; shade *= 0.62 + 0.38 * q; }
      }
      for (const c of list) {
        const q = Math.hypot(x - c.x, z - c.z) / c.r;
        const dep = c.depth ?? c.r * 0.35;
        if (q < 1) h += -dep * (1 - q * q) + dep * 0.35 * q ** 6;
        else if (q < 1.6) h += dep * 0.35 * Math.exp(-((q - 1) ** 2) * 14);
      }
      posA.setY(i, h);
      const v = Math.min(1.15, Math.max(0.45, 0.82 + (h - 0.07) / 0.06)) * shade;
      col[i * 3] = cBase.r * v; col[i * 3 + 1] = cBase.g * v; col[i * 3 + 2] = cBase.b * v;
    }
    posA.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.computeVertexNormals();
  };
  mesh.addCrater = (c) => { list.push(c); mesh.update(); };
  mesh.craters = list;
  mesh.update();
  return mesh;
}

// ---------- Insan figuru ----------

/**
 * Eklemli, stilize insan. Pivot gruplari: hips, spine, neck, lShoulder/rShoulder, lElbow/rElbow,
 * lHip/rHip, lKnee/rKnee. Boy ~ h. Ayak tabani y=0.
 */
export function human({ h = 0.6, shirt = 0x1e88e5, pants = 0x283593, skin = C.skin, hair = 0x4e342e } = {}) {
  const s = h / 1.8;
  const g = new THREE.Group();
  const P = {};
  const piv = (name, parent, x, y, z = 0) => { const p = new THREE.Group(); p.position.set(x * s, y * s, z * s); parent.add(p); P[name] = p; return p; };
  const seg = (parent, len, r, color, dir = -1) => {
    const m = capsule(r * s, len * s, color);
    m.position.y = (dir * len * s) / 2;
    parent.add(m);
    return m;
  };
  const hips = piv('hips', g, 0, 0.95);
  hips.add(Object.assign(box(0.34 * s, 0.16 * s, 0.2 * s, pants), {}));
  const spine = piv('spine', hips, 0, 0.06);
  const torso = box(0.38 * s, 0.55 * s, 0.22 * s, shirt);
  torso.position.y = 0.28 * s;
  spine.add(torso);
  const neck = piv('neck', spine, 0, 0.58);
  const head = ball(0.12 * s, skin, 24);
  head.position.y = 0.14 * s;
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.125 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), lambert(hair));
  hairM.position.y = 0.15 * s;
  hairM.rotation.x = -0.25;
  neck.add(head, hairM);
  for (const side of [-1, 1]) {
    const k = side < 0 ? 'l' : 'r';
    const sh = piv(k + 'Shoulder', spine, side * 0.24, 0.52);
    seg(sh, 0.24, 0.05, shirt);
    const el = piv(k + 'Elbow', sh, 0, -0.3);
    seg(el, 0.22, 0.045, skin);
    const hand = ball(0.05 * s, skin, 12); hand.position.y = -0.3 * s; el.add(hand);
    const hp = piv(k + 'Hip', hips, side * 0.1, -0.06);
    seg(hp, 0.36, 0.065, pants);
    const kn = piv(k + 'Knee', hp, 0, -0.44);
    seg(kn, 0.36, 0.055, pants);
    const foot = box(0.1 * s, 0.06 * s, 0.22 * s, 0x37474f); foot.position.set(0, -0.46 * s, 0.05 * s); kn.add(foot);
  }
  g.joints = P;
  return g;
}

// ---------- Stilize iskelet ----------

/** Etiketli, eklemli iskelet. Pivotlar human() ile ayni adlarda. Boy ~ h. */
export function skeleton({ h = 1, color = C.bone, labels = false, labelH = 0.035 } = {}) {
  const s = h / 1.8;
  const g = new THREE.Group();
  const P = {};
  const mat = lambert(color);
  const bones = [];
  const named = (m, title, text) => { info(m, title, text); bones.push(m); return m; };
  const piv = (name, parent, x, y, z = 0) => { const p = new THREE.Group(); p.position.set(x * s, y * s, z * s); parent.add(p); P[name] = p; return p; };
  const longBone = (parent, len, r, title, text) => {
    const b = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * s, r * s, len * s, 10), mat);
    shaft.position.y = -len * s / 2;
    const k1 = new THREE.Mesh(new THREE.SphereGeometry(r * 1.9 * s, 12, 8), mat);
    const k2 = k1.clone(); k2.position.y = -len * s;
    b.add(shaft, k1, k2);
    parent.add(b);
    b.children.forEach((c) => named(c, title, text));
    return b;
  };
  const hips = piv('hips', g, 0, 0.98);
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.13 * s, 0.045 * s, 8, 20, Math.PI), mat);
  pelvis.rotation.x = Math.PI / 2; pelvis.rotation.z = Math.PI;
  pelvis.scale.set(1.2, 0.8, 1.6);
  hips.add(named(pelvis, 'Leğen kemiği', 'Yassı bir kemiktir. Gövdenin alt kısmını taşır, bacakları gövdeye bağlar.'));
  const spine = piv('spine', hips, 0, 0.04);
  for (let i = 0; i < 17; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.026 * s, 10), mat);
    v.position.set(0, (0.02 + i * 0.034) * s, -0.06 * s + Math.sin(i / 16 * Math.PI) * 0.03 * s);
    spine.add(named(v, 'Omur kemiği', 'Omurgayı oluşturan kısa kemiklerdir. Aralarındaki eklemler yarı oynar eklemdir.'));
  }
  for (let i = 0; i < 6; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry((0.13 - Math.abs(i - 2) * 0.008) * s, 0.012 * s, 6, 24), mat);
    rib.rotation.x = Math.PI / 2 + 0.25;
    rib.scale.set(1, 0.75, 1);
    rib.position.set(0, (0.3 + i * 0.045) * s, 0);
    spine.add(named(rib, 'Kaburga kemiği', 'Yassı kemiklerdir. Göğüs kafesini oluşturur; kalbi ve akciğerleri korur.'));
  }
  const sternum = box(0.03 * s, 0.22 * s, 0.015 * s, color);
  sternum.position.set(0, 0.42 * s, 0.1 * s);
  spine.add(named(sternum, 'Göğüs kemiği', 'Kaburgaların önde bağlandığı yassı kemiktir.'));
  const neck = piv('neck', spine, 0, 0.6);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 24, 16), mat);
  skull.scale.set(0.9, 1, 1.1);
  skull.position.y = 0.16 * s;
  const jaw = box(0.12 * s, 0.05 * s, 0.1 * s, color);
  jaw.position.set(0, 0.05 * s, 0.04 * s);
  neck.add(named(skull, 'Kafatası', 'Yassı kemiklerden oluşur ve beyni korur. Kafatası kemikleri arasındaki eklemler oynamaz eklemdir.'),
    named(jaw, 'Kafatası', 'Alt çene, kafatasının hareket edebilen tek kemiğidir.'));
  const eyeMat = basic(0x3e2723);
  for (const x of [-0.04, 0.04]) { const e = ball(0.022 * s, 0x3e2723, 10); e.material = eyeMat; e.position.set(x * s, 0.17 * s, 0.1 * s); neck.add(e); }
  for (const side of [-1, 1]) {
    const k = side < 0 ? 'l' : 'r';
    const clav = rod(new THREE.Vector3(0, 0.55 * s, 0.05 * s), new THREE.Vector3(side * 0.19 * s, 0.56 * s, 0), 0.012 * s, color);
    spine.add(named(clav, 'Köprücük kemiği', 'Kolu gövdeye bağlayan uzun kemiklerden biridir.'));
    const scap = box(0.1 * s, 0.13 * s, 0.015 * s, color);
    scap.position.set(side * 0.12 * s, 0.48 * s, -0.11 * s);
    spine.add(named(scap, 'Kürek kemiği', 'Sırtta bulunan yassı bir kemiktir.'));
    const sh = piv(k + 'Shoulder', spine, side * 0.21, 0.54);
    longBone(sh, 0.28, 0.018, 'Pazu kemiği', 'Üst koldaki uzun kemiktir.');
    const el = piv(k + 'Elbow', sh, 0, -0.29);
    const fa = longBone(el, 0.25, 0.013, 'Ön kol kemiği', 'Ön kolda iki uzun kemik bulunur. Dirsek eklemi ile pazu kemiğine bağlanır.');
    const fa2 = fa.clone(); fa2.position.x = side * 0.02 * s; el.add(fa2);
    fa2.children.forEach((c) => named(c, 'Ön kol kemiği', 'Ön kolda iki uzun kemik bulunur.'));
    const hand = new THREE.Group(); hand.position.y = -0.27 * s; el.add(hand);
    const palm = box(0.06 * s, 0.07 * s, 0.015 * s, color); palm.position.y = -0.035 * s;
    hand.add(named(palm, 'El bilek kemikleri', 'El bileğindeki kemikler kısa kemiklerdir.'));
    for (let f = 0; f < 4; f++) {
      const fg = box(0.01 * s, 0.07 * s, 0.01 * s, color); fg.position.set((f - 1.5) * 0.015 * s, -0.1 * s, 0);
      hand.add(named(fg, 'El parmak kemikleri', 'Parmak kemikleri uzun kemiklerdendir.'));
    }
    const hp = piv(k + 'Hip', hips, side * 0.1, -0.03);
    longBone(hp, 0.42, 0.022, 'Uyluk kemiği', 'Vücuttaki en uzun kemiktir.');
    const kn = piv(k + 'Knee', hp, 0, -0.43);
    const cap = ball(0.025 * s, color, 12); cap.position.set(0, 0.01 * s, 0.03 * s);
    kn.add(named(cap, 'Diz kapağı', 'Diz ekleminin önünde bulunan kemiktir.'));
    longBone(kn, 0.4, 0.017, 'Kaval kemiği', 'Alt bacaktaki kalın uzun kemiktir.');
    const fib = longBone(kn, 0.38, 0.009, 'Baldır kemiği', 'Kaval kemiğinin yanındaki ince uzun kemiktir.');
    fib.position.x = side * 0.03 * s;
    const foot = box(0.07 * s, 0.03 * s, 0.17 * s, color); foot.position.set(0, -0.42 * s, 0.04 * s);
    kn.add(named(foot, 'Ayak bilek kemikleri', 'Ayak bileğindeki kemikler kısa kemiklerdir.'));
  }
  g.joints = P;
  g.bones = bones;
  return g;
}

// ---------- Organlar ----------

/** Stilize kalp; beat(t) ile atar. */
export function heart(size = 0.2) {
  const g = new THREE.Group();
  const red = lambert(0xb71c1c), dark = lambert(0x7f0000), blue = lambert(0x1565c0);
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.6, -0.1, 0.55, 0.45, 0.25, 0.45);
  shape.bezierCurveTo(0.1, 0.45, 0, 0.35, 0, 0.25);
  shape.bezierCurveTo(0, 0.35, -0.1, 0.45, -0.25, 0.45);
  shape.bezierCurveTo(-0.55, 0.45, -0.6, -0.1, 0, -0.5);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.15, bevelSegments: 6, curveSegments: 24 });
  geo.center();
  const body = new THREE.Mesh(geo, red);
  body.scale.setScalar(size);
  body.rotation.z = 0.35;
  g.add(body);
  const aorta = new THREE.Mesh(new THREE.TorusGeometry(size * 0.18, size * 0.06, 8, 16, Math.PI), dark);
  aorta.position.set(size * 0.02, size * 0.42, 0);
  const vein = cyl(size * 0.05, size * 0.05, size * 0.35, 0x1565c0, 10);
  vein.material = blue;
  vein.position.set(-size * 0.2, size * 0.45, -size * 0.02);
  g.add(aorta, vein);
  g.beat = (t) => {
    const p = t % 0.85;
    const k = 1 + 0.08 * Math.exp(-((p - 0.1) ** 2) / 0.002) + 0.05 * Math.exp(-((p - 0.3) ** 2) / 0.003);
    body.scale.setScalar(size * k);
  };
  return g;
}

/** Stilize mide (J seklinde tup); churn(t) ile kasilir. */
export function stomach(size = 0.25) {
  const pts = [[-0.1, 0.55], [-0.05, 0.35], [0.05, 0.15], [0.05, -0.1], [-0.1, -0.3], [-0.35, -0.35], [-0.55, -0.25]]
    .map(([x, y]) => new THREE.Vector3(x * size, y * size, 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  const radii = [0.07, 0.12, 0.26, 0.28, 0.22, 0.12, 0.08];
  const geo = new THREE.TubeGeometry(curve, 64, size * 0.3, 16, false);
  const posA = geo.attributes.position, base = posA.array.slice();
  const mesh = new THREE.Mesh(geo, lambert(0xe57373));
  const centers = Array.from({ length: 65 }, (_, i) => curve.getPointAt(i / 64));
  const apply = (phase = 0) => {
    for (let i = 0; i < posA.count; i++) {
      const ring = Math.floor(i / 17), u = ring / 64;
      const fi = Math.min(radii.length - 1.001, u * (radii.length - 1));
      const r = radii[Math.floor(fi)] * (1 - (fi % 1)) + radii[Math.ceil(fi)] * (fi % 1);
      const wave = 1 + 0.08 * Math.sin(u * 18 - phase * 5);
      const c = centers[ring];
      const k = (r / 0.3) * wave;
      posA.setXYZ(i, c.x + (base[i * 3] - c.x) * k, c.y + (base[i * 3 + 1] - c.y) * k, c.z + (base[i * 3 + 2] - c.z) * k);
    }
    posA.needsUpdate = true;
    geo.computeVertexNormals();
  };
  apply();
  mesh.churn = apply;
  return mesh;
}

/** Kas lifi demeti (cizgili / duz / kalp kasi dokusu icin). type: 'striated'|'smooth'|'cardiac' */
export function muscleTissue(type, w = 0.6, h = 0.25) {
  const g = new THREE.Group();
  const rnd = rng(type.length * 7);
  const n = type === 'smooth' ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * (h / n);
    if (type === 'smooth') {
      // Ig seklinde tek cekirdekli hucreler
      const cell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), lambert(0xef9a9a));
      cell.scale.set(w * 0.45, h / n * 0.45, h / n * 0.45);
      cell.position.set((rnd() - 0.5) * w * 0.4, y, 0);
      const nuc = ball(h / n * 0.12, 0x4a148c, 10); nuc.position.copy(cell.position).setZ(h / n * 0.18);
      g.add(cell, nuc);
    } else {
      const fiber = capsule(h / n * 0.42, w, 0xe57373);
      fiber.rotation.z = Math.PI / 2;
      fiber.position.y = y;
      g.add(fiber);
      // Enine cizgiler
      for (let s = 0; s < 22; s++) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(h / n * 0.43, h / n * 0.03, 4, 16), basic(0xb71c1c));
        band.rotation.y = Math.PI / 2;
        band.position.set(-w / 2 + (s / 21) * w, y, 0);
        g.add(band);
      }
      const nn = type === 'cardiac' ? 2 : 4;
      for (let k = 0; k < nn; k++) {
        const nuc = ball(h / n * 0.12, 0x4a148c, 10);
        nuc.scale.set(2, 1, 1);
        nuc.position.set(-w / 2 + (k + 0.5) * (w / nn), y, h / n * 0.38);
        g.add(nuc);
      }
      if (type === 'cardiac' && i < n - 1) { // dallanmalar
        const br = rod(new THREE.Vector3(-w * 0.1 + rnd() * 0.1, y, 0), new THREE.Vector3(w * 0.1, y + h / n, 0), h / n * 0.25, 0xe57373);
        g.add(br);
      }
    }
  }
  return g;
}

// ---------- Mikroskop ----------

/** Etiketli isik mikroskobu. Taban y=0. focus(f) tablayi oynatir. */
export function microscope(h = 0.8, { labels = true } = {}) {
  const s = h / 1;
  const g = new THREE.Group();
  const white = 0xeceff1, dark = 0x37474f;
  const add = (m, title, text, lbl) => { g.add(info(m, title, text)); if (labels && lbl) { const c = callout(title, lbl[0], lbl[1], { height: 0.045 }); info(c.label, title, text); g.add(c); } return m; };
  const V = (x, y, z = 0) => new THREE.Vector3(x * s, y * s, z * s);
  add(box(0.42 * s, 0.06 * s, 0.32 * s, dark), 'Taban', 'Mikroskobu dik ve dengede tutar.');
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.25 * s, 0.045 * s, 10, 24, Math.PI * 0.9), lambert(white));
  arm.rotation.y = Math.PI / 2; arm.rotation.z = -0.35;
  arm.position.set(0, 0.42 * s, -0.12 * s);
  add(arm, 'Taşıma kolu', 'Mikroskop taşınırken bu koldan tutulur.', [V(0, 0.6, -0.33), V(-0.4, 0.75, -0.3)]);
  const pillar = box(0.08 * s, 0.32 * s, 0.08 * s, white); pillar.position.set(0, 0.2 * s, -0.12 * s); g.add(pillar);
  const light = cyl(0.05 * s, 0.06 * s, 0.05 * s, 0xfff59d);
  light.material = basic(0xfff59d);
  light.position.set(0, 0.09 * s, 0.03 * s);
  add(light, 'Işık kaynağı', 'Örneği alttan aydınlatır. Önce ışık kaynağının çalıştığından emin olunur.', [V(0, 0.09, 0.08), V(-0.38, 0.12, 0.1)]);
  const stage = box(0.26 * s, 0.025 * s, 0.22 * s, dark); stage.position.set(0, 0.3 * s, 0.03 * s);
  add(stage, 'Tabla', 'İncelenecek örneğin bulunduğu lam bu tablaya yerleştirilir.', [V(0.13, 0.3, 0.1), V(0.42, 0.3, 0.15)]);
  const slide = box(0.18 * s, 0.006 * s, 0.06 * s, 0xb3e5fc, { transparent: true, opacity: 0.8 }); slide.position.set(0, 0.316 * s, 0.03 * s); g.add(slide);
  const turret = cyl(0.06 * s, 0.07 * s, 0.04 * s, white); turret.position.set(0, 0.5 * s, 0.03 * s); g.add(turret);
  const obj = new THREE.Group();
  [0, 1, 2].forEach((i) => {
    const o = cyl(0.015 * s, 0.022 * s, (0.06 + i * 0.015) * s, i === 0 ? 0xffd54f : i === 1 ? 0x42a5f5 : 0xef5350, 12);
    const a = (i - 1) * 0.8;
    o.position.set(Math.sin(a) * 0.035 * s, 0.46 * s - (0.03 + i * 0.008) * s, 0.03 * s + Math.cos(a) * 0.035 * s);
    obj.add(info(o, 'Objektif', 'Örneğe bakan merceklerdir. Farklı büyütme oranlarında objektifler bulunur.'));
  });
  g.add(obj);
  if (labels) { const c = callout('Objektif', V(0.03, 0.42, 0.07), V(0.42, 0.45, 0.15), { height: 0.045 }); info(c.label, 'Objektif', 'Örneğe bakan merceklerdir.'); g.add(c); }
  const tube = cyl(0.035 * s, 0.035 * s, 0.22 * s, white); tube.position.set(0, 0.62 * s, -0.03 * s); tube.rotation.x = -0.35; g.add(tube);
  const eye = cyl(0.025 * s, 0.025 * s, 0.07 * s, dark); eye.position.set(0, 0.76 * s, -0.08 * s); eye.rotation.x = -0.35;
  add(eye, 'Oküler', 'Göz ile bakılan mercektir.', [V(0, 0.8, -0.09), V(-0.35, 0.92, -0.1)]);
  const knob1 = cyl(0.05 * s, 0.05 * s, 0.03 * s, 0x546e7a); knob1.rotation.z = Math.PI / 2; knob1.position.set(0.07 * s, 0.25 * s, -0.12 * s);
  add(knob1, 'Kaba ayar vidası', 'Görüntüyü kabaca netleştirmek için tablayı hızlıca yukarı-aşağı oynatır.', [V(0.09, 0.25, -0.12), V(0.45, 0.2, -0.1)]);
  const knob2 = cyl(0.028 * s, 0.028 * s, 0.03 * s, 0x90a4ae); knob2.rotation.z = Math.PI / 2; knob2.position.set(0.1 * s, 0.25 * s, -0.12 * s);
  add(knob2, 'İnce ayar vidası', 'Görüntüyü tam netleştirmek için tablayı çok az oynatır.', [V(0.115, 0.25, -0.12), V(0.45, 0.09, -0.05)]);
  g.focus = (f) => { stage.position.y = (0.29 + f * 0.02) * s; slide.position.y = stage.position.y + 0.016 * s; knob1.rotation.x = f * 6; knob2.rotation.x = f * 12; };
  return g;
}

// ---------- Hucreler ----------

/** type: 'plant' | 'animal'. detail: organelleri de ekle. */
export function cell(type, size = 0.5, { detail = true } = {}) {
  const g = new THREE.Group();
  const rnd = rng(type === 'plant' ? 4 : 9);
  const add = (m, title, text) => g.add(info(m, title, text));
  if (type === 'plant') {
    const wall = box(size, size * 0.6, size * 0.6, 0x7cb342, { transparent: true, opacity: 0.35, depthWrite: false });
    add(wall, 'Hücre duvarı (çeper)', 'Sadece bitki hücresinde bulunur. Hücreye destek olur ve şeklini korur.');
    const mem = box(size * 0.94, size * 0.54, size * 0.54, 0xc5e1a5, { transparent: true, opacity: 0.28, depthWrite: false });
    add(mem, 'Hücre zarı', 'Hücreyi çevreler; hücreye madde giriş-çıkışını kontrol eder.');
    const vac = ball(size * 0.22, 0x81d4fa, 24, { transparent: true, opacity: 0.6 });
    vac.scale.set(1.5, 0.9, 0.9);
    add(vac, 'Koful', 'Bitki hücresinde büyüktür; su ve besin depolar.');
    for (let i = 0; i < (detail ? 10 : 0); i++) {
      const ch = ball(size * 0.04, 0x2e7d32, 12); ch.scale.set(1.6, 0.8, 1);
      ch.position.set((rnd() - 0.5) * size * 0.8, (rnd() - 0.5) * size * 0.45, (rnd() - 0.5) * size * 0.45);
      add(ch, 'Kloroplast', 'Sadece bitki hücresinde bulunur. Fotosentez yaparak besin üretir.');
    }
  } else {
    const mem = ball(size * 0.45, 0xf8bbd0, 40, { transparent: true, opacity: 0.4, depthWrite: false });
    mem.scale.set(1.1, 0.85, 0.95);
    add(mem, 'Hücre zarı', 'Hücreyi çevreler; hücreye madde giriş-çıkışını kontrol eder.');
    if (detail) {
      const cen = new THREE.Group();
      for (const r of [0, Math.PI / 2]) { const c = cyl(size * 0.012, size * 0.012, size * 0.07, 0x6a1b9a, 8); c.rotation.z = r; cen.add(c); }
      cen.position.set(size * 0.2, size * 0.12, 0);
      add(cen, 'Sentrozom', 'Hayvan hücresinde bulunur; hücre bölünmesinde görev alır.');
      const lys = ball(size * 0.035, 0x8e24aa, 12); lys.position.set(-size * 0.25, -size * 0.12, size * 0.1);
      add(lys, 'Lizozom', 'Hücre içi sindirimi sağlar.');
    }
  }
  const nuc = ball(size * 0.12, 0x6a1b9a, 24);
  nuc.position.set(type === 'plant' ? size * 0.28 : 0, 0, 0);
  add(nuc, 'Çekirdek', 'Hücrenin yönetim merkezidir; kalıtım maddesini taşır.');
  if (detail) {
    for (let i = 0; i < 5; i++) {
      const mi = capsule(size * 0.02, size * 0.05, 0xff7043); mi.rotation.z = rnd() * 3;
      mi.position.set((rnd() - 0.5) * size * 0.6, (rnd() - 0.5) * size * 0.35, (rnd() - 0.3) * size * 0.3);
      add(mi, 'Mitokondri', 'Hücrenin enerji üretim merkezidir.');
    }
    const er = new THREE.Mesh(new THREE.TorusGeometry(size * 0.17, size * 0.012, 6, 30, Math.PI * 1.3), lambert(0xffb74d));
    er.position.copy(nuc.position); er.rotation.z = 0.5;
    add(er, 'Endoplazmik retikulum', 'Hücre içinde madde taşınmasını sağlayan kanallardır.');
    const golgi = new THREE.Group();
    for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.TorusGeometry(size * (0.06 - k * 0.008), size * 0.008, 5, 16, Math.PI), lambert(0xf06292)); d.position.y = k * size * 0.02; golgi.add(d); }
    golgi.position.set(-size * 0.15, size * 0.1, size * 0.05);
    add(golgi, 'Golgi aygıtı', 'Hücrede üretilen maddeleri paketler ve salgılar.');
    for (let i = 0; i < 25; i++) {
      const rb = ball(size * 0.008, 0x3949ab, 6);
      rb.position.set((rnd() - 0.5) * size * 0.7, (rnd() - 0.5) * size * 0.4, (rnd() - 0.5) * size * 0.4);
      add(rb, 'Ribozom', 'Protein üretimini sağlar.');
    }
  }
  return g;
}

// ---------- Yuzey ----------

/** Dokulu zemin plakasi. kind: 'wood'|'polished'|'carpet'|'marble'|'glass'|'snow'|'grass' */
export function floor(kind, w = 0.6, d = 0.3) {
  const colors = {
    wood: ['#8d6e63', '#6d4c41'], polished: ['#bc8f6a', '#a1714f'], carpet: ['#8e244d', '#5e1631'],
    marble: ['#eceff1', '#b0bec5'], glass: ['#b3e5fc', '#81d4fa'], snow: ['#fafafa', '#e3f2fd'], grass: ['#7cb342', '#558b2f'],
    sand: ['#d7ccc8', '#bcaaa4'],
  }[kind];
  const tex = canvasTex(256, 128, (c, W, H) => {
    c.fillStyle = colors[0]; c.fillRect(0, 0, W, H);
    const r = rng(kind.length);
    if (kind === 'wood' || kind === 'polished') {
      for (let y = 0; y < H; y += 16) { c.fillStyle = colors[1]; c.fillRect(0, y, W, 2); }
      for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(r() * W, r() * H, 20 + r() * 40, 1); }
      if (kind === 'polished') { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(0.7, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    } else if (kind === 'carpet') {
      for (let i = 0; i < 4000; i++) { c.fillStyle = r() < 0.5 ? colors[1] : '#b03a6a'; c.fillRect(r() * W, r() * H, 2, 2); }
    } else if (kind === 'marble') {
      c.strokeStyle = colors[1]; c.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) { c.beginPath(); let x = r() * W, y = 0; c.moveTo(x, y); while (y < H) { x += (r() - 0.5) * 20; y += 8; c.lineTo(x, y); } c.stroke(); }
    } else if (kind === 'sand' || kind === 'grass' || kind === 'snow') {
      for (let i = 0; i < 3000; i++) { c.fillStyle = colors[1]; c.fillRect(r() * W, r() * H, 2, 2); }
    }
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), new THREE.MeshLambertMaterial({ map: tex, transparent: kind === 'glass', opacity: kind === 'glass' ? 0.7 : 1 }));
  m.position.y = -0.01;
  return m;
}

/** Basit masa (ust tabla + 4 ayak). Ust yuzey y=h. */
export function table(w = 0.4, d = 0.22, h = 0.2, color = 0x6d4c41) {
  const g = new THREE.Group();
  const top = box(w, 0.025, d, color); top.position.y = h;
  g.add(top);
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const leg = box(0.02, h, 0.02, color); leg.position.set(x * (w / 2 - 0.02), h / 2, z * (d / 2 - 0.02)); g.add(leg);
  }
  return g;
}

/** Basit tasit sekilleri (akis cizgileri icin). */
export function vehicle(kind) {
  const g = new THREE.Group();
  if (kind === 'car') {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 6, 16), lambert(0xffa000)); b.rotation.z = Math.PI / 2; b.scale.set(0.7, 1, 1.3); g.add(b);
    const cab = ball(0.06, 0x263238, 16); cab.scale.set(1.6, 0.6, 0.9); cab.position.set(-0.02, 0.04, 0); g.add(cab);
    for (const x of [-0.09, 0.09]) for (const z of [-0.05, 0.05]) { const w = cyl(0.025, 0.025, 0.02, 0x212121, 14); w.rotation.x = Math.PI / 2; w.position.set(x, -0.04, z); g.add(w); }
  } else if (kind === 'jet') {
    const b = capsule(0.025, 0.3, 0x90a4ae); b.rotation.z = Math.PI / 2; g.add(b);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 12), lambert(0x90a4ae)); nose.rotation.z = -Math.PI / 2; nose.position.x = 0.21; g.add(nose);
    const wing = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.16, 0.01, 3), lambert(0x78909c)); wing.position.x = -0.02; wing.rotation.y = Math.PI / 2; wing.scale.set(1, 1, 1.4); g.add(wing);
    const fin = box(0.06, 0.06, 0.006, 0x78909c); fin.position.set(-0.15, 0.04, 0); g.add(fin);
  } else if (kind === 'train') {
    const b = capsule(0.04, 0.4, 0xeceff1); b.rotation.z = Math.PI / 2; b.scale.set(1, 1, 1); g.add(b);
    const stripe = box(0.4, 0.012, 0.082, C.red); g.add(stripe);
  } else if (kind === 'ship') {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.4, 4, 1), lambert(0x37474f)); hull.rotation.z = Math.PI / 2; hull.rotation.x = Math.PI / 4; hull.scale.set(1, 1, 0.6); g.add(hull);
    const deck = box(0.2, 0.06, 0.05, 0xffffff); deck.position.set(-0.06, 0.05, 0); g.add(deck);
  } else if (kind === 'submarine') {
    const b = capsule(0.04, 0.3, 0x263238); b.rotation.z = Math.PI / 2; g.add(b);
    const tower = box(0.06, 0.05, 0.025, 0x263238); tower.position.set(0.03, 0.05, 0); g.add(tower);
  } else if (kind === 'rocket') {
    const b = cyl(0.04, 0.04, 0.32, 0xeceff1, 20); b.position.y = 0.16; g.add(b);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 20), lambert(C.red)); nose.position.y = 0.37; g.add(nose);
    for (let i = 0; i < 4; i++) { const f = box(0.006, 0.07, 0.05, C.red); const a = (i * Math.PI) / 2; f.position.set(Math.cos(a) * 0.045, 0.035, Math.sin(a) * 0.045); f.rotation.y = -a; g.add(f); }
    const band = cyl(0.041, 0.041, 0.02, C.red, 20); band.position.y = 0.26; g.add(band);
  }
  return g;
}

/** Yuvarlak, kenari yumusak parcacik dokusu (kare nokta yerine). */
function dotTexture() {
  if (texCache.dot) return texCache.dot;
  texCache.dot = canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  return texCache.dot;
}

/** Parcacik efekti (duman, toz, kivilcim). emit(pos, vel) ve update(dt). */
export function particles(n = 120, color = 0xdddddd, size = 0.03) {
  // Toplamali karisim + nokta basina renk: omru biten parcacigin rengi 0 olur ve gorunmez.
  const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), life = new Float32Array(n);
  const col = new Float32Array(n * 3);
  const base = new THREE.Color(color);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  let next = 0;
  pts.emit = (p, v) => {
    const i = next++ % n;
    pos.set([p.x, p.y, p.z], i * 3); vel.set([v.x, v.y, v.z], i * 3); life[i] = 1;
  };
  pts.update = (dt) => {
    for (let i = 0; i < n; i++) {
      if (life[i] > 0) {
        life[i] -= dt * 0.7;
        for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt;
      }
      const a = Math.max(life[i], 0) * 0.8;
      col[i * 3] = base.r * a; col[i * 3 + 1] = base.g * a; col[i * 3 + 2] = base.b * a;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };
  pts.frustumCulled = false;
  return pts;
}

/** Gecen sureye gore 0..1 arasi tekrarlayan dongu ve yumusak gecis yardimcilari. */
export const loop = (t, period) => (t % period) / period;
export const ease = (x) => x * x * (3 - 2 * x);
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** Dongu icinde [a,b] araliginda 0->1 yumusak gecis. */
export const seg = (p, a, b) => ease(clamp01((p - a) / (b - a)));
