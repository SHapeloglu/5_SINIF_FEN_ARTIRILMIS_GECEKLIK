// 5. sinif Fen - artirilmis gerceklik (MindAR + three.js).
// Her unite icin ayri hedef dosyasi (targets/uniteN.mind) ve sahne listesi (scenes/uniteN.js) vardir.
// Hedef sirasi sahne listesindeki sirayla aynidir (tools/compile-targets.mjs bu sirayla derler).
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

const UNITS = {
  1: { title: "1. Ünite: Gökyüzündeki Komşularımız ve Biz", mind: 'targets/unite1.mind', scenes: './scenes/unite1.js' },
  2: { title: '2. Ünite: Kuvveti Tanıyalım', mind: 'targets/unite2.mind', scenes: './scenes/unite2.js' },
  3: { title: '3. Ünite: Canlıların Yapısına Yolculuk', mind: 'targets/unite3.mind', scenes: './scenes/unite3.js' },
};
const GROW_MS = 700;
// Sahneler sayfadan yukari yukselir; telefon sayfaya tepeden bakinca kameraya fazla yaklasmasin diye
// baslangicta kucuk gosterilir. Kullanici iki parmakla 0.25-3 arasinda olcekleyebilir.
const START_SCALE = 0.65;
// Hedef dosyalari degistiginde tarayici onbellegini gecersiz kilmak icin artirilir.
const ASSET_VERSION = 2;

const $ = (s) => document.querySelector(s);

function setHint(text) {
  const h = $('#hint');
  h.textContent = text;
  h.style.display = text ? 'block' : 'none';
}

function showInfo(title, text) {
  const panel = $('#info');
  if (!title) { panel.style.display = 'none'; return; }
  panel.querySelector('h2').textContent = title;
  panel.querySelector('p').textContent = text || '';
  if (panel.style.display !== 'block') {
    panel.style.opacity = '0';
    panel.style.display = 'block';
    requestAnimationFrame(() => { panel.style.opacity = '1'; });
  }
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
    filterMinCF: 0.0001, // titremeyi azaltir
    filterBeta: 0.001,
  });
  const { renderer, scene, camera } = mindar;

  // Lambert isiklari three r155+ fiziksel birimdedir; pi ile carpim iOS/Android surumundeki parlaklikla eslesir.
  scene.add(new THREE.AmbientLight(0xffffff, 0.45 * Math.PI));
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI);
  sunLight.position.set(0.3, 0.6, 1);
  scene.add(sunLight);

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
    const turn = new THREE.Group();
    base.add(holder);
    holder.add(turn);
    anchor.group.add(base);
    const st = { def, anchor, holder, turn, built: null, foundAt: -1 };
    anchor.onTargetFound = () => {
      if (!st.built) {
        try {
          st.built = def.build();
          turn.add(st.built.root);
        } catch (e) {
          console.error('Sahne kurulamadi', def.mark, e);
          return;
        }
      }
      if (st.foundAt < 0) st.foundAt = performance.now();
      active = st;
      setHint(`s.${def.page} • Dokun: bilgi • Sürükle: döndür • İki parmak: büyüt`);
      showInfo(def.title, def.info);
    };
    anchor.onTargetLost = () => {
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
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    const now = performance.now();
    for (const st of states) {
      if (!st.built || !st.anchor.group.visible) continue;
      // Buyuyerek belirme (ease-out), sonra kullanici olcegi
      const g = Math.min(1, (now - st.foundAt) / GROW_MS);
      const e = 1 - (1 - g) ** 3;
      st.holder.scale.setScalar(Math.max(userScale * e, 1e-4));
      if (st.built.update) {
        try { st.built.update(t, dt, camera); } catch (err) { console.error(err); st.built.update = null; }
      }
    }
    renderer.render(scene, camera);
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
      if (active) active.turn.rotation.y += dx * 0.01;
    } else if (pointers.size === 2 && pinchStart > 0) {
      moved = Infinity;
      const [a, b] = [...pointers.values()];
      userScale = Math.min(3, Math.max(0.25, pinchScale * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart)));
    }
  });
  const up = (ev) => {
    const wasTap = pointers.size === 1 && moved < 8;
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
      if (!h.object.visible) continue;
      const d = infoOf(h.object);
      if (d) { showInfo(d.title, d.info); return; }
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
  b.textContent = u.title;
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
