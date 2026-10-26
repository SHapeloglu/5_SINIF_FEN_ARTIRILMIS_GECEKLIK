// 5. sinif Fen - artirilmis gerceklik (MindAR + three.js).
// Her unite icin ayri hedef dosyasi (targets/uniteN.mind) ve sahne listesi (scenes/uniteN.js) vardir.
// Hedef sirasi sahne listesindeki sirayla aynidir (tools/compile-targets.mjs bu sirayla derler).
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

// accent: dugme/ikon rengi, ink: baslik rengi, fx: ortam parcaciklari (renk, boyut, yukselis hizi)
const UNITS = {
  1: { title: "1. Ünite: Gökyüzündeki Komşularımız ve Biz", mind: 'targets/unite1.mind', scenes: './scenes/unite1.js',
       icon: '🪐', accent: '#5560e8', ink: '#3340c4', fx: { color: 0xffb81f, size: 0.05, rise: 0.012 } },
  2: { title: '2. Ünite: Kuvveti Tanıyalım', mind: 'targets/unite2.mind', scenes: './scenes/unite2.js',
       icon: '🧲', accent: '#f28c1f', ink: '#d9660d', fx: { color: 0xff7a1a, size: 0.045, rise: 0.03 } },
  3: { title: '3. Ünite: Canlıların Yapısına Yolculuk', mind: 'targets/unite3.mind', scenes: './scenes/unite3.js',
       icon: '🔬', accent: '#12a37a', ink: '#0b7a5a', fx: { color: 0x22b5d9, size: 0.055, rise: 0.045 } },
};
// Belirme/kaybolma yayi: kritik altı sönümlü, ~%12 aşım (yaylanarak açılır)
const SPRING_K = 170, SPRING_D = 14.5;
// Görsel kaybolunca sahne bu kadar ms yerinde kalır (el titremesinde sahne yanıp sönmesin)
const HOLD_MS = 450;
const RIPPLE_MS = 550;
const SHADOW_OPACITY = 0.38;
const PARTICLES = 36;
// ?q=high: otomatik kalite dusurmeyi kapatir (sayfa acilisinda okunur; unite secince adres degisir)
const keepFx = new URLSearchParams(location.search).get('q') === 'high';
// Sahneler sayfadan yukari yukselir; telefon sayfaya tepeden bakinca kameraya fazla yaklasmasin diye
// baslangicta kucuk gosterilir. Kullanici iki parmakla 0.25-3 arasinda olcekleyebilir.
const START_SCALE = 0.65;
// Hedef dosyalari degistiginde tarayici onbellegini gecersiz kilmak icin artirilir.
const ASSET_VERSION = 3;

const $ = (s) => document.querySelector(s);

function setHint(text) {
  const h = $('#hint');
  h.textContent = text;
  h.style.display = text ? 'block' : 'none';
}

function showInfo(title, text) {
  const panel = $('#info');
  if (!title) { panel.classList.remove('show'); return; }
  const h2 = panel.querySelector('h2');
  const changed = h2.textContent !== title || !panel.classList.contains('show');
  h2.textContent = title;
  panel.querySelector('p').textContent = text || '';
  panel.classList.add('show');
  if (changed) {
    panel.classList.remove('pop');
    void panel.offsetWidth; // animasyonu yeniden baslat
    panel.classList.add('pop');
  }
}

/** Nesne ve atalari gorunur mu? (raycast gizli ata altindaki cocuklari da verir) */
function isShown(obj) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function radialTexture(stops) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [at, col] of stops) g.addColorStop(at, col);
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Nesneden yukari dogru ilk bilgi tasiyan ataya cik. */
function infoOf(obj) {
  for (let o = obj; o; o = o.parent) if (o.userData.info) return o.userData;
  return null;
}

async function start(unitId) {
  const unit = UNITS[unitId];
  document.querySelectorAll('#units button').forEach((b) => { b.disabled = true; });
  $('#err').textContent = 'Yükleniyor…';
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--accent', unit.accent);
  rootStyle.setProperty('--accent-ink', unit.ink);
  $('#info .ico').textContent = unit.icon;

  let scenes;
  try {
    scenes = (await import(unit.scenes)).default;
  } catch (e) {
    console.error(e);
    $('#err').textContent = 'Ünite yüklenemedi. Sayfayı yenileyip tekrar deneyin.';
    document.querySelectorAll('#units button').forEach((b) => { b.disabled = false; });
    return;
  }

  const container = $('#ar');
  const mindar = new MindARThree({
    container,
    imageTargetSrc: `${unit.mind}?v=${ASSET_VERSION}`,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
    warmupTolerance: 2, // varsayilan 5: gorsel 2 ardisik karede dogrulaninca sahne acilir (daha hizli)
    missTolerance: 8,   // varsayilan 5: kisa takip kayiplarinda sahne kapanmaz
    filterMinCF: 0.0001, // titremeyi azaltir
    filterBeta: 0.001,
  });
  const { renderer, scene, camera } = mindar;

  // Lambert isiklari three r155+ fiziksel birimdedir; pi ile carpim iOS/Android surumundeki parlaklikla eslesir.
  // Hacim icin: gokyuzu/zemin renkli yari-kure isigi + ana isik + soguk dolgu isigi (golgeli yuzler simsiyah kalmasin).
  scene.add(new THREE.AmbientLight(0xffffff, 0.15 * Math.PI));
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x7a6552, 0.33 * Math.PI));
  const sunLight = new THREE.DirectionalLight(0xfff6e8, 0.6 * Math.PI);
  sunLight.position.set(0.3, 0.6, 1);
  scene.add(sunLight);
  const fillLight = new THREE.DirectionalLight(0xbcd4ff, 0.22 * Math.PI);
  fillLight.position.set(-0.8, -0.2, 0.6);
  scene.add(fillLight);

  // Ortak dokular: sayfa uzerine yumusak temas golgesi, dokunma dalgasi, parcacik noktasi
  const shadowTex = radialTexture([[0, 'rgba(0,0,0,0.9)'], [0.55, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]);
  const rippleTex = radialTexture([[0, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0)'], [0.82, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]);
  const dotTex = radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
  const fxColor = new THREE.Color(unit.fx.color);
  const quality = { fx: true }; // yavas cihazda parcacik/golge kapatilir
  const ripples = [];
  const tmpScale = new THREE.Vector3();
  if (keepFx) window.__fen = { THREE, scene, camera, renderer, get states() { return states; }, get userScale() { return userScale; }, ripples };

  let active = null;      // gorunen hedefin durumu
  let userScale = START_SCALE;
  const pages = scenes.map((d) => d.page).filter((p, i, a) => a.indexOf(p) === i).join(', ');
  const idleHint = `Kitapta işaretli bir görseli kameraya gösterin (sayfa ${pages})`;

  const states = scenes.map((def, i) => {
    const anchor = mindar.addAnchor(i);
    // MindAR capasinda gorsel XY duzleminde, z sayfadan disari bakar. Sahnelerde sayfaya dik eksen y'dir.
    const base = new THREE.Group();
    base.rotation.x = Math.PI / 2;
    const holder = new THREE.Group();
    const float = new THREE.Group(); // nefes/yuzme hareketi burada (kullanici donusu turn'de)
    const turn = new THREE.Group();
    base.add(holder);
    holder.add(float);
    float.add(turn);
    anchor.group.add(base);
    const st = {
      def, anchor, holder, float, turn, built: null, fx: null,
      found: false, lostAt: 0, a: 0, v: 0, // a: belirme degeri (yay), v: hizi
    };
    anchor.onTargetFound = () => {
      if (!st.built) {
        try {
          st.built = def.build();
          turn.add(st.built.root);
        } catch (e) {
          console.error('Sahne kurulamadi', def.mark, e);
          return;
        }
        // Sayfaya oturan yumusak golge (holder ile birlikte olceklenir) + ortam parcaciklari
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 1.2),
          new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: SHADOW_OPACITY, depthWrite: false }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.002;
        shadow.renderOrder = -1;
        holder.add(shadow);
        const pos = new Float32Array(PARTICLES * 3), seed = new Float32Array(PARTICLES * 3);
        for (let k = 0; k < PARTICLES; k++) {
          seed[k * 3] = Math.random() * 6.28; seed[k * 3 + 1] = Math.random(); seed[k * 3 + 2] = 0.6 + Math.random() * 0.8;
        }
        const pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(pg, new THREE.PointsMaterial({
          map: dotTex, color: fxColor, size: unit.fx.size, sizeAttenuation: true, transparent: true, opacity: 0.8,
          depthWrite: false, // normal karisim: ekleme (additive) beyaz kitap sayfasinda gorunmez olurdu
        }));
        pts.frustumCulled = false;
        holder.add(pts);
        st.fx = { shadow, pts, pos, seed };
      }
      st.found = true;
      active = st;
      setHint(`s.${def.page} • Dokun: bilgi • Sürükle: döndür • İki parmak: büyüt`);
      showInfo(def.title, def.info);
    };
    anchor.onTargetLost = () => {
      st.found = false;
      st.lostAt = performance.now();
      if (active === st) {
        active = null;
        setHint(idleHint);
      }
    };
    return st;
  });

  try {
    await mindar.start();
  } catch (e) {
    console.error(e);
    document.querySelectorAll('#units button').forEach((b) => { b.disabled = false; });
    $('#err').textContent = location.protocol !== 'https:' && location.hostname !== 'localhost'
      ? 'Kamera yalnızca güvenli (https) bağlantıda açılır.'
      : 'Kamera açılamadı. Tarayıcı ayarlarından kamera iznini verip tekrar deneyin.';
    return;
  }
  $('#start').style.display = 'none';
  $('#back').style.display = 'block';
  setHint(idleHint);

  const clock = new THREE.Clock();
  let spin = 0;                       // surukleme ivmesi (rad/sn)
  const perf = { frames: 0, since: 0, checks: 0 };
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    const now = performance.now();
    let anyShown = false;
    states.forEach((st, i) => {
      if (!st.built) return;
      // Belirme yayi: bulunmusken ya da kayip sonrasi kisa bekleme suresince hedef 1, sonra 0.
      const want = st.found || now - st.lostAt < HOLD_MS ? 1 : 0;
      // Sabit kucuk adimlarla entegre et: yavas karelerde (buyuk dt) yay kararsizlasip patlamasin
      const n = Math.ceil(dt * 120), h = dt / n;
      for (let k = 0; k < n; k++) {
        st.v += (SPRING_K * (want - st.a) - SPRING_D * st.v) * h;
        st.a += st.v * h;
      }
      st.a = Math.max(-0.2, Math.min(1.6, st.a));
      if (want === 0 && st.a < 0.01) {
        st.a = 0; st.v = 0;
        st.anchor.group.visible = false;
        return;
      }
      anyShown = true;
      st.anchor.group.visible = true; // MindAR kayipta gizler; yay sonuna kadar son konumda goster
      st.holder.scale.setScalar(Math.max(userScale * st.a, 1e-4));
      // Nefes ve hafif yuzme
      st.float.scale.setScalar(1 + 0.012 * Math.sin(t * 1.6 + i));
      st.float.position.y = 0.008 * Math.sin(t * 1.1 + i * 1.7);
      if (st.fx) {
        const { shadow, pts, pos, seed } = st.fx;
        const on = quality.fx;
        shadow.visible = on; pts.visible = on;
        if (on) {
          shadow.material.opacity = SHADOW_OPACITY * (1 - 0.15 * Math.sin(t * 1.1 + i * 1.7)); // yuksekte golge acilir
          for (let k = 0; k < PARTICLES; k++) {
            const h = (seed[k * 3 + 1] + t * unit.fx.rise * seed[k * 3 + 2] * 4) % 1;
            pos[k * 3] = Math.cos(seed[k * 3] + t * 0.3 * seed[k * 3 + 2]) * (0.55 + 0.25 * seed[k * 3 + 1]);
            pos[k * 3 + 1] = 0.05 + h * 1.0;
            pos[k * 3 + 2] = Math.sin(seed[k * 3] + t * 0.3 * seed[k * 3 + 2]) * (0.55 + 0.25 * seed[k * 3 + 1]);
          }
          pts.geometry.attributes.position.needsUpdate = true;
          // PointsMaterial.size dunya biriminde ve ust nesne olcegini almaz: sahnenin dunya olcegiyle carp
          pts.material.size = unit.fx.size * st.holder.getWorldScale(tmpScale).x;
          pts.material.opacity = 0.8 * Math.min(1, st.a);
        }
      }
      if (st.built.update) {
        try { st.built.update(t, dt, camera); } catch (err) { console.error(err); st.built.update = null; }
      }
    });
    // Surukleme sonrasi dönüş yavasca durur
    if (active && !pointers.size && Math.abs(spin) > 0.01) {
      active.turn.rotation.y += spin * dt;
      spin *= Math.exp(-3.2 * dt);
    }
    // Dokunma dalgalari
    for (let r = ripples.length - 1; r >= 0; r--) {
      const k = (now - ripples[r].t0) / RIPPLE_MS;
      const sp = ripples[r].sprite;
      if (k >= 1) { sp.parent.remove(sp); sp.material.dispose(); ripples.splice(r, 1); continue; }
      sp.scale.setScalar(0.04 + 0.2 * (1 - (1 - k) ** 3));
      sp.material.opacity = 0.95 * (1 - k);
    }
    renderer.render(scene, camera);

    // Yavas cihaz: 3 sn'lik pencerede ortalama kare hizi 24 fps altindaysa susleri kapat
    if (anyShown && quality.fx && !keepFx) {
      if (!perf.since) { perf.since = now; perf.frames = 0; }
      perf.frames++;
      if (now - perf.since > 3000) {
        if (perf.frames / ((now - perf.since) / 1000) < 24 && ++perf.checks >= 2) quality.fx = false;
        perf.since = 0;
      }
    } else perf.since = 0;
  });

  // Dokunma: tek parmak surukle = dondur, kisa dokunus = bilgi, iki parmak = olcek
  const pointers = new Map();
  let pinchStart = 0, pinchScale = START_SCALE, moved = 0;
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.002;
  raycaster.params.Line.threshold = 0.002;

  container.addEventListener('pointerdown', (ev) => {
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    moved = 0;
    spin = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      pinchScale = userScale;
    }
  });
  container.addEventListener('pointermove', (ev) => {
    const p = pointers.get(ev.pointerId);
    if (!p) return;
    const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    p.x = ev.clientX; p.y = ev.clientY;
    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (active) {
        active.turn.rotation.y += dx * 0.01;
        spin = 0.6 * spin + 0.4 * (dx * 0.01) / Math.max(0.008, (ev.timeStamp - (p.t || ev.timeStamp - 16)) / 1000);
        p.t = ev.timeStamp;
        spin = Math.max(-6, Math.min(6, spin));
      }
    } else if (pointers.size === 2 && pinchStart > 0) {
      moved = Infinity;
      const [a, b] = [...pointers.values()];
      userScale = Math.min(3, Math.max(0.25, pinchScale * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart)));
    }
  });
  const up = (ev) => {
    const wasTap = pointers.size === 1 && moved < 8;
    const last = pointers.get(ev.pointerId);
    if (last && ev.timeStamp - (last.t || 0) > 90) spin = 0; // durup biraktiysa ivme olmasin
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinchStart = 0;
    if (!wasTap || ev.type === 'pointercancel') return;
    if (!active || !active.built) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(active.turn, true);
    // Etiketler (sprite) one alinir; sonra en yakin bilgi tasiyan nesne
    hits.sort((a, b) => (b.object.isSprite ? 1 : 0) - (a.object.isSprite ? 1 : 0) || a.distance - b.distance);
    for (const h of hits) {
      if (!isShown(h.object)) continue;
      const d = infoOf(h.object);
      if (d) {
        showInfo(d.title, d.info);
        if (quality.fx) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: rippleTex, color: new THREE.Color(unit.accent), transparent: true,
            depthTest: false, depthWrite: false,
          }));
          sp.renderOrder = 30;
          sp.position.copy(active.holder.worldToLocal(h.point.clone()));
          active.holder.add(sp);
          ripples.push({ sprite: sp, t0: performance.now() });
        }
        return;
      }
    }
    showInfo(active.def.title, active.def.info);
  };
  container.addEventListener('pointerup', up);
  container.addEventListener('pointercancel', up);
}

// ---------- Giris ekrani ----------

const unitsEl = $('#units');
for (const [id, u] of Object.entries(UNITS)) {
  const b = document.createElement('button');
  b.style.background = u.accent;
  b.innerHTML = '<span class="ico"></span><span class="t"></span>';
  b.querySelector('.ico').textContent = u.icon;
  b.querySelector('.t').textContent = u.title;
  b.addEventListener('click', () => {
    history.replaceState(null, '', `?u=${id}`);
    start(id);
  });
  unitsEl.appendChild(b);
}
$('#info .close').addEventListener('click', (e) => { e.stopPropagation(); showInfo(null); });
$('#back').addEventListener('click', () => { location.href = location.pathname; });

const preset = new URLSearchParams(location.search).get('u');
if (preset && UNITS[preset]) $('#err').textContent = `${UNITS[preset].title} seçildi. Başlamak için dokunun.`;
if (preset && UNITS[preset]) unitsEl.querySelectorAll('button')[Object.keys(UNITS).indexOf(preset)].classList.add('pre');
