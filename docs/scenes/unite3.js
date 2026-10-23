// 3. Unite: Canlıların Yapısına Yolculuk
import {
  THREE, C, info, label, callout, line, box, cyl, ball, capsule, rod, arrow, microscope, cell, skeleton, human,
  heart, stomach, muscleTissue, table, loop, seg, ease, rng, lambert, basic,
} from '../lib.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CARTILAGE = 0xb3e5fc;

/** Mikroskop goruntusu: yuvarlak "bakis alani" icinde hucreler. kind: 'onion' | 'cheek' */
function viewDisk(kind, r = 0.18) {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.CircleGeometry(r, 48), basic(kind === 'onion' ? 0xfff8e1 : 0xfce4ec));
  const rim = new THREE.Mesh(new THREE.RingGeometry(r, r * 1.08, 48), basic(0x212121));
  g.add(bg, rim);
  const rnd = rng(kind.length * 3);
  if (kind === 'onion') {
    for (let row = -3; row <= 3; row++) for (let col = -2; col <= 2; col++) {
      const x = col * r * 0.42 + (row % 2) * r * 0.21, y = row * r * 0.26;
      if (Math.hypot(x, y) > r * 0.92) continue;
      const c = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.4, r * 0.24), basic(0xf0e3b2));
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(c.geometry), new THREE.LineBasicMaterial({ color: 0x8d6e63 }));
      c.position.set(x, y, 0.001); edge.position.copy(c.position);
      const n = new THREE.Mesh(new THREE.CircleGeometry(r * 0.04, 12), basic(0x6a1b9a)); n.position.set(x + (rnd() - 0.5) * r * 0.2, y, 0.002);
      g.add(info(c, 'Soğan zarı hücresi', 'Bitki hücresidir; köşeli görünür çünkü hücre duvarı (çeper) vardır.'), edge, n);
    }
  } else {
    for (let i = 0; i < 9; i++) {
      const x = (rnd() - 0.5) * r * 1.4, y = (rnd() - 0.5) * r * 1.4;
      if (Math.hypot(x, y) > r * 0.8) continue;
      const c = new THREE.Mesh(new THREE.CircleGeometry(r * (0.14 + rnd() * 0.06), 7), basic(0xf8bbd0));
      c.scale.set(1, 0.8 + rnd() * 0.3, 1); c.rotation.z = rnd() * 3; c.position.set(x, y, 0.001);
      const n = new THREE.Mesh(new THREE.CircleGeometry(r * 0.035, 12), basic(0x6a1b9a)); n.position.set(x, y, 0.002);
      g.add(info(c, 'Yanak iç yüzeyi hücresi', 'Hayvan hücresidir; hücre duvarı olmadığı için yuvarlak ve düzensiz görünür.'), n);
    }
  }
  return g;
}

/** Bukulebilen stilize kol: ust kol kemigi + on kol; flex(a) dirsegi buker. */
function arm({ muscles = true, scale = 1 } = {}) {
  const g = new THREE.Group();
  const upper = new THREE.Group(); g.add(upper);
  const hum = info(capsule(0.025 * scale, 0.32 * scale, C.bone), 'Pazu kemiği', 'Üst koldaki uzun kemiktir.');
  hum.rotation.z = Math.PI / 2; hum.position.x = 0.18 * scale; upper.add(hum);
  const elbow = new THREE.Group(); elbow.position.x = 0.36 * scale; upper.add(elbow);
  const joint = info(ball(0.04 * scale, CARTILAGE, 20, { transparent: true, opacity: 0.8 }), 'Dirsek eklemi', 'Oynar eklemdir. Eklem yüzeylerindeki kıkırdak kemiklerin sürtünmesini önler.');
  elbow.add(joint);
  const fore = new THREE.Group(); elbow.add(fore);
  for (const dz of [-0.018, 0.018]) { const b = info(capsule(0.016 * scale, 0.3 * scale, C.bone), 'Ön kol kemikleri', 'Ön kolda iki uzun kemik bulunur.'); b.rotation.z = Math.PI / 2; b.position.set(0.17 * scale, 0, dz * scale); fore.add(b); }
  const hand = ball(0.04 * scale, C.skin, 14); hand.position.x = 0.36 * scale; hand.scale.set(1.3, 0.6, 1); fore.add(hand);
  let biceps = null;
  if (muscles) {
    biceps = info(ball(0.04 * scale, C.muscle, 20), 'Pazu kası (çizgili kas)', 'Kasılınca kısalır ve kalınlaşır, ön kolu yukarı çeker. Kaslar kemiklere bağlanarak hareketi sağlar.');
    biceps.position.set(0.18 * scale, 0.04 * scale, 0); biceps.scale.set(3.4, 1, 1);
    const triceps = info(ball(0.035 * scale, 0xa93226, 20), 'Arka kol kası (çizgili kas)', 'Pazu kası kasılırken gevşer; kol açılırken kasılır.');
    triceps.position.set(0.18 * scale, -0.035 * scale, 0); triceps.scale.set(3.8, 0.9, 0.9);
    const tendon = rod(V(0.33 * scale, 0.04 * scale, 0), V(0.42 * scale, 0.02 * scale, 0), 0.006 * scale, 0xeceff1);
    upper.add(biceps, triceps, tendon);
  }
  g.joint = joint; g.biceps = biceps; g.fore = fore; g.elbow = elbow;
  g.flex = (a) => {
    elbow.rotation.z = a;
    if (biceps) biceps.scale.set(3.4 - a * 0.6, 1 + a * 0.4, 1 + a * 0.4);
  };
  return g;
}

/** Kafatasi (yassi kemikler) + dikis cizgileri. */
function skull(s = 0.2, sutures = false) {
  const g = new THREE.Group();
  const cr = info(ball(s * 0.5, C.bone, 32), 'Kafatası', 'Yassı kemiklerden oluşur ve beyni korur.');
  cr.scale.set(0.85, 0.9, 1.05);
  const face = box(s * 0.6, s * 0.35, s * 0.4, C.bone); face.position.set(0, -s * 0.28, s * 0.2);
  const jaw = box(s * 0.5, s * 0.12, s * 0.35, C.bone); jaw.position.set(0, -s * 0.48, s * 0.2);
  info(jaw, 'Alt çene', 'Kafatasının hareket edebilen tek kemiğidir.');
  const eyeM = basic(0x3e2723);
  for (const x of [-0.12, 0.12]) { const e = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 12, 8), eyeM); e.position.set(x * s, -s * 0.18, s * 0.38); g.add(e); }
  g.add(cr, face, jaw);
  if (sutures) {
    const mat = new THREE.LineBasicMaterial({ color: 0xc62828 });
    const mk = (pts) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); g.add(l); return l; };
    const coronal = [], sag = [];
    for (let i = 0; i <= 30; i++) {
      const a = -Math.PI / 2 + (i / 30) * Math.PI;
      coronal.push(V(Math.sin(a) * s * 0.43, Math.cos(a) * s * 0.455 + Math.sin(i * 1.7) * s * 0.01, s * 0.12));
      sag.push(V(Math.sin(i * 1.9) * s * 0.01, Math.cos(a) * s * 0.455, Math.sin(a) * s * 0.53));
    }
    const l1 = mk(coronal), l2 = mk(sag);
    g.sutures = [l1, l2];
  }
  return g;
}

/** Kemik ici renkli hedef nokta (eklem isaretleri icin). */
function marker(n, color = 0xff5252) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 20), basic(color));
  const l = label(String(n), { height: 0.04, bg: 'rgba(255,255,255,0.95)', fg: '#c62828' });
  l.position.set(0.06, 0.03, 0);
  g.add(ring, l);
  g.ring = ring;
  return g;
}

export default [
  // #45 s.100 Mikroskobun bolumleri
  {
    mark: 45, page: 100, title: 'Mikroskobun Bölümleri',
    info: 'Mikroskopta oküler, objektif, tabla, ışık kaynağı, taşıma kolu ile kaba ve ince ayar vidaları bulunur. Görüntü kaba ve ince ayar vidalarıyla netleştirilir. Objektif değiştirilirken lama temas ettirilmemelidir.',
    build() {
      const root = new THREE.Group();
      const m = microscope(0.85); m.position.z = 0.05; root.add(m);
      return { root, update(t) { m.focus(0.5 + 0.5 * Math.sin(t)); } };
    },
  },

  // #46 s.100 Ornek hazirlanisi (lam ve lamel)
  {
    mark: 46, page: 100, title: 'Örnek Hazırlanışı: Lam ve Lamel',
    info: 'İncelenecek örnek lamın üzerine konur, üzerine bir damla su damlatılır. Lamel, hava kabarcığı kalmaması için bir kenarından eğik tutularak yavaşça örneğin üzerine kapatılır.',
    build() {
      const root = new THREE.Group();
      const glass = (w, d, h, op) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: 0xb3e5fc, transparent: true, opacity: op }));
      const lam = info(glass(0.6, 0.2, 0.02, 0.55), 'Lam', 'İncelenecek örneğin konduğu ince cam levhadır.'); lam.position.y = 0.04;
      const sample = info(box(0.08, 0.002, 0.06, 0xfff59d), 'Örnek', 'Örneğin ince olması ışığın geçmesini ve hücrelerin görülmesini sağlar.'); sample.position.y = 0.052;
      const drop = info(ball(0.025, 0x4fc3f7, 16, { transparent: true, opacity: 0.7 }), 'Su damlası', 'Örneğin kurumasını önler.'); drop.scale.y = 0.4;
      const pivot = new THREE.Group(); pivot.position.set(-0.08, 0.053, 0);
      const lamel = info(glass(0.16, 0.16, 0.006, 0.45), 'Lamel', 'Örneğin üzerini kapatan çok ince ve küçük cam levhadır.'); lamel.position.x = 0.08; pivot.add(lamel);
      const needle = rod(V(0, 0, 0), V(-0.25, 0.12, 0), 0.004, 0x9e9e9e);
      const tbl = box(0.8, 0.03, 0.4, 0xeceff1); tbl.position.y = 0.015;
      root.add(tbl, lam, sample, drop, pivot);
      pivot.add(needle);
      const step = label('', { height: 0.045 }); step.position.set(0, 0.45, 0); root.add(step);
      return {
        root, update(t) {
          const p = loop(t, 8);
          drop.position.set(0, 0.35 - seg(p, 0.05, 0.25) * 0.29, 0); drop.visible = p < 0.3;
          drop.scale.set(1 + seg(p, 0.22, 0.3), 0.4, 1 + seg(p, 0.22, 0.3));
          pivot.rotation.z = (1 - seg(p, 0.4, 0.75)) * 0.9;
          pivot.position.y = 0.053 + (p < 0.35 ? 0.15 * (1 - seg(p, 0.3, 0.4)) : 0);
          step.setText(p < 0.3 ? '1. Örneğe bir damla su' : p < 0.8 ? '2. Lameli eğik tutup kapat' : '3. Mikroskopta incele');
        },
      };
    },
  },

  // #47 s.101 Sogan zari hucresi incelemesi
  {
    mark: 47, page: 101, title: 'Soğan Zarı Hücrelerini İnceleyelim',
    info: 'Soğan zarından alınan ince örnek lamın üzerine konur, lamel ile kapatılır ve mikroskopta incelenir. Hücreler köşeli ve düzenli dizilmiş görünür; bunun nedeni bitki hücrelerindeki hücre duvarıdır.',
    build() {
      const root = new THREE.Group();
      const m = microscope(0.7, { labels: false }); m.position.set(-0.2, 0, 0); root.add(m);
      const onion = info(ball(0.08, 0xd7a86e, 20), 'Soğan', 'Soğanın etli yaprakları arasındaki ince zardan örnek alınır.'); onion.scale.y = 0.85; onion.position.set(0.3, 0.07, 0.15);
      const view = viewDisk('onion', 0.2); view.position.set(0.3, 0.55, 0);
      const zoom = line([V(-0.2, 0.62, -0.07), V(0.12, 0.55, 0)], 0xffffff, true);
      const vl = label('Mikroskop görüntüsü', { height: 0.04 }); vl.position.set(0.3, 0.82, 0);
      root.add(onion, view, zoom, vl);
      return {
        root, update(t, dt, camera) {
          const f = seg(loop(t, 5), 0, 0.5);
          m.focus(f);
          view.scale.setScalar(0.6 + 0.4 * f);
          if (camera) view.quaternion.copy(camera.quaternion).premultiply(root.getWorldQuaternion(new THREE.Quaternion()).invert());
        },
      };
    },
  },

  // #48 s.102 Yanak ici hucre incelemesi
  {
    mark: 48, page: 102, title: 'Yanak İçi Hücrelerini İnceleyelim',
    info: 'Ahşap çubukla (abeslang) yanak içi hafifçe kazınarak alınan örnek lama sürülür, lamel ile kapatılıp mikroskopta incelenir. Hayvan hücreleri yuvarlak ve düzensiz görünür; hücre duvarları yoktur.',
    build() {
      const root = new THREE.Group();
      const m = microscope(0.7, { labels: false }); m.position.set(-0.2, 0, 0); root.add(m);
      const stick = info(box(0.2, 0.004, 0.025, 0xd7ccc8), 'Abeslang', 'Yanak içinden hücre örneği almak için kullanılan ahşap çubuktur.'); stick.position.set(0.3, 0.01, 0.2); stick.rotation.y = 0.4;
      const view = viewDisk('cheek', 0.2); view.position.set(0.3, 0.55, 0);
      const zoom = line([V(-0.2, 0.62, -0.07), V(0.12, 0.55, 0)], 0xffffff, true);
      const vl = label('Mikroskop görüntüsü', { height: 0.04 }); vl.position.set(0.3, 0.82, 0);
      root.add(stick, view, zoom, vl);
      return {
        root, update(t, dt, camera) {
          const f = seg(loop(t, 5), 0, 0.5);
          m.focus(f);
          view.scale.setScalar(0.6 + 0.4 * f);
          if (camera) view.quaternion.copy(camera.quaternion).premultiply(root.getWorldQuaternion(new THREE.Quaternion()).invert());
        },
      };
    },
  },

  // #49 s.105 Bitki ve hayvan hucresi (organeller)
  {
    mark: 49, page: 105, title: 'Bitki ve Hayvan Hücresi',
    info: 'Bitki ve hayvan hücrelerinde hücre zarı, sitoplazma, çekirdek, mitokondri, ribozom, endoplazmik retikulum ve golgi aygıtı ortak bulunur. Hücre duvarı ve kloroplast yalnızca bitki hücresinde; sentrozom ise hayvan hücresinde bulunur.',
    build() {
      const root = new THREE.Group();
      const p = cell('plant', 0.5); p.position.set(-0.28, 0.35, 0);
      const a = cell('animal', 0.5); a.position.set(0.3, 0.33, 0);
      const lp = label('Bitki hücresi', { height: 0.05, bg: 'rgba(46,125,50,0.95)' }); lp.position.set(-0.28, 0.72, 0);
      const la = label('Hayvan hücresi', { height: 0.05, bg: 'rgba(173,20,87,0.95)' }); la.position.set(0.3, 0.72, 0);
      const tip = label('Bir organele dokun', { height: 0.035 }); tip.position.set(0, 0.06, 0.2);
      root.add(p, a, lp, la, tip);
      return { root, update(t) { p.rotation.y = Math.sin(t * 0.4) * 0.6; a.rotation.y = t * 0.3; } };
    },
  },

  // #50 s.109 Hucrenin temel kisimlari
  {
    mark: 50, page: 109, title: 'Hücrenin Temel Kısımları',
    info: 'Bitki ve hayvan hücrelerinde şekilsel farklılıklar olsa da hücrenin temel kısımları olan hücre zarı, sitoplazma ve çekirdek her iki hücrede de bulunur.',
    build() {
      const root = new THREE.Group();
      const p = cell('plant', 0.45, { detail: false }); p.position.set(-0.3, 0.3, 0);
      const a = cell('animal', 0.45, { detail: false }); a.position.set(0.3, 0.3, 0);
      const cyto = info(label('Sitoplazma', { height: 0.045 }), 'Sitoplazma', 'Hücre zarı ile çekirdek arasını dolduran sıvıdır; organeller bu sıvıda bulunur.'); cyto.position.set(0, 0.3, 0);
      const mem = info(label('Hücre zarı', { height: 0.045 }), 'Hücre zarı', 'Hücreyi çevreler ve madde alışverişini kontrol eder.'); mem.position.set(0, 0.55, 0);
      const nuc = info(label('Çekirdek', { height: 0.045 }), 'Çekirdek', 'Hücrenin yönetim merkezidir.'); nuc.position.set(0, 0.05, 0);
      root.add(p, a, cyto, mem, nuc,
        line([V(-0.08, 0.55, 0), V(-0.12, 0.47, 0)]), line([V(0.08, 0.55, 0), V(0.14, 0.47, 0)]),
        line([V(-0.08, 0.05, 0), V(-0.17, 0.27, 0)]), line([V(0.08, 0.05, 0), V(0.27, 0.27, 0)]));
      const lp = label('Bitki hücresi', { height: 0.045, bg: 'rgba(46,125,50,0.95)' }); lp.position.set(-0.3, 0.65, 0);
      const la = label('Hayvan hücresi', { height: 0.045, bg: 'rgba(173,20,87,0.95)' }); la.position.set(0.3, 0.65, 0);
      root.add(lp, la);
      return { root, update(t) { p.rotation.y = Math.sin(t * 0.5) * 0.4; a.rotation.y = Math.sin(t * 0.5 + 1) * 0.4; } };
    },
  },

  // #51 s.112 Tugla - duvar - oda - ev - koy benzetmesi
  {
    mark: 51, page: 112, title: 'Hücreden Organizmaya: Bina Benzetmesi',
    info: 'Bir bina tuğlalardan oluştuğu gibi organizmalar da hücrelerden oluşur. Tuğla hücreyi, duvar dokuyu, oda organı, ev sistemi, köy ise organizmayı temsil eder.',
    build() {
      const root = new THREE.Group();
      const stages = [];
      const add = (obj, x, name, i) => { obj.position.x = x; obj.children.forEach((c) => info(c, name, i)); root.add(obj); const l = label(name.replace(' = ', '\n= '), { height: 0.035 }); l.position.set(x, 0.42, 0); root.add(l); stages.push(obj); };
      const brick = () => box(0.05, 0.025, 0.025, 0xc0582b);
      const b1 = new THREE.Group(); b1.add(brick()); b1.children[0].position.y = 0.0125;
      add(b1, -0.48, 'Tuğla = Hücre', 'En küçük yapı birimi.');
      const wall = new THREE.Group();
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { const b = brick(); b.position.set((c - 1) * 0.052 + (r % 2) * 0.026, 0.0125 + r * 0.026, 0); wall.add(b); }
      add(wall, -0.27, 'Duvar = Doku', 'Benzer hücreler bir araya gelerek dokuyu oluşturur.');
      const room = new THREE.Group();
      for (const [x, z, ry] of [[0, -0.06, 0], [0, 0.06, 0], [-0.07, 0, Math.PI / 2], [0.07, 0, Math.PI / 2]]) { const w = box(0.14, 0.1, 0.012, 0xc0582b); w.position.set(x, 0.05, z); w.rotation.y = ry; room.add(w); }
      add(room, -0.04, 'Oda = Organ', 'Dokular bir araya gelerek organı oluşturur.');
      const house = new THREE.Group();
      const hb = box(0.14, 0.1, 0.12, 0xfafafa); hb.position.y = 0.05;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 4), lambert(0xd32f2f)); roof.position.y = 0.14; roof.rotation.y = Math.PI / 4;
      house.add(hb, roof);
      add(house, 0.18, 'Ev = Sistem', 'Organlar bir araya gelerek sistemi oluşturur.');
      const village = new THREE.Group();
      const rnd = rng(51);
      for (let i = 0; i < 6; i++) { const h = house.clone(); h.scale.setScalar(0.45); h.position.set((i % 3 - 1) * 0.07, 0, (Math.floor(i / 3) - 0.5) * 0.08); village.add(h); }
      const field = box(0.24, 0.006, 0.2, 0x7cb342); village.add(field);
      void rnd;
      add(village, 0.42, 'Köy = Organizma', 'Sistemler bir araya gelerek organizmayı oluşturur.');
      for (let i = 0; i < 4; i++) { const a = arrow(V(1, 0, 0), 0.05, C.orange, 0.005); a.position.set(-0.42 + i * 0.225 + (i > 1 ? 0.02 : 0), 0.06, 0.12); root.add(a); }
      return {
        root, update(t) {
          const p = loop(t, 10);
          // 1.6: sayfa genis oldugu icin asamalar buyutulerek gosterilir
          stages.forEach((s, i) => { const k = seg(p, i * 0.15, i * 0.15 + 0.12); s.scale.setScalar(Math.max(0.001, k * 1.6)); });
        },
      };
    },
  },

  // #52 s.113 Kas hucresinden organizmaya
  {
    mark: 52, page: 113, title: 'Hücreden Organizmaya',
    info: 'Kas hücreleri bir araya gelerek kas dokusunu, dokular kolu (organ), organlar destek ve hareket sistemini, sistemler de organizmayı oluşturur. İnsan trilyonlarca hücreden oluşur.',
    build() {
      const root = new THREE.Group();
      const items = [];
      const put = (obj, x, name, i) => { obj.position.x = x; obj.traverse((c) => { if (c.isMesh) info(c, name, i); }); root.add(obj); const l = label(name.replace('Destek ve hareket sistemi', 'Destek ve hareket\nsistemi'), { height: 0.032 }); l.position.set(x, 0.72, 0); root.add(l); items.push(obj); };
      const c1 = new THREE.Group(); const mc = ball(0.04, 0xe57373, 16); mc.position.y = 0.25; c1.add(mc);
      put(c1, -0.5, 'Kas hücresi', 'Canlıların en küçük yapı birimi hücredir.');
      const tis = muscleTissue('striated', 0.16, 0.08); tis.position.y = 0.25; const c2 = new THREE.Group(); c2.add(tis);
      put(c2, -0.28, 'Kas dokusu', 'Aynı görevi yapan hücreler dokuyu oluşturur.');
      const ar = arm({ scale: 0.45 }); ar.position.set(-0.08, 0.25, 0); ar.flex(0.8); const c3 = new THREE.Group(); c3.add(ar);
      put(c3, 0, 'Kol', 'Dokular bir araya gelerek organları oluşturur.');
      const sk = skeleton({ h: 0.42 }); const c4 = new THREE.Group(); c4.add(sk);
      put(c4, 0.22, 'Destek ve hareket sistemi', 'Kemikler, kaslar ve eklemler birlikte çalışır.');
      const hm = human({ h: 0.42, shirt: 0x212121, pants: 0x1a237e }); const c5 = new THREE.Group(); c5.add(hm);
      put(c5, 0.45, 'Organizma', 'Sistemler bir araya gelerek organizmayı oluşturur.');
      for (let i = 0; i < 4; i++) { const a = arrow(V(1, 0, 0), 0.05, 0x4fc3f7, 0.005); a.position.set(-0.43 + i * 0.22, 0.25, 0.1); root.add(a); }
      return {
        root, update(t) {
          const p = loop(t, 10);
          // 1.5: sayfa genis oldugu icin asamalar buyutulerek gosterilir (taban y=0 sabit kalir)
          items.forEach((s, i) => { s.scale.setScalar(Math.max(0.001, seg(p, i * 0.14, i * 0.14 + 0.1) * 1.5)); });
          ar.flex(0.5 + 0.4 * Math.sin(t * 2));
        },
      };
    },
  },

  // #53 s.118 Destek ve hareket sistemi
  {
    mark: 53, page: 118, title: 'Destek ve Hareket Sistemi',
    info: 'Destek ve hareket sistemi iskelet (kemikler, kıkırdaklar, eklemler) ve kaslardan oluşur. İskelet vücuda destek olur ve iç organları korur; kaslar kemiklere bağlanarak hareketi sağlar.',
    build() {
      const root = new THREE.Group();
      const sk = skeleton({ h: 0.85 }); sk.position.x = -0.22;
      const body = human({ h: 0.85, shirt: C.muscle, pants: 0xa93226, skin: 0xd35454, hair: 0x7b1f1f });
      body.position.x = 0.22;
      body.traverse((c) => { if (c.isMesh) info(c, 'Kaslar', 'Kaslar iskeletin etrafını sarar; kasılıp gevşeyerek hareketi sağlar.'); });
      const l1 = label('İskelet sistemi', { height: 0.045 }); l1.position.set(-0.22, 0.95, 0);
      const l2 = label('Kas sistemi', { height: 0.045 }); l2.position.set(0.22, 0.95, 0);
      root.add(sk, body, l1, l2);
      return {
        root, update(t) {
          const w = Math.sin(t * 3) * 0.5;
          for (const f of [sk, body]) {
            f.joints.lHip.rotation.x = w; f.joints.rHip.rotation.x = -w;
            f.joints.lKnee.rotation.x = Math.max(0, -w) * 0.8; f.joints.rKnee.rotation.x = Math.max(0, w) * 0.8;
            f.joints.lShoulder.rotation.x = -w * 0.6; f.joints.rShoulder.rotation.x = w * 0.6;
          }
        },
      };
    },
  },

  // #54 s.119 Kemik, kas ve eklem kartlari
  {
    mark: 54, page: 119, title: 'Destek ve Hareket Sisteminin Yapıları',
    info: 'Destek ve hareket sisteminde kemikler, kıkırdaklar, eklemler ve kaslar bulunur. Kaslar çizgili kas, düz kas ve kalp kası olarak üçe ayrılır.',
    build() {
      const root = new THREE.Group();
      const femur = new THREE.Group();
      const head = ball(0.035, C.bone, 12); head.position.y = 0.13;
      femur.add(capsule(0.02, 0.22, C.bone), head);
      const shortB = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = box(0.04, 0.035, 0.04, C.bone); b.position.set((i % 2) * 0.045, Math.floor(i / 2) * 0.04, 0); shortB.add(b); }
      const elbowJ = arm({ scale: 0.3, muscles: false }); elbowJ.flex(1.2);
      const st = stomach(0.22);
      const ht = heart(0.13);
      const armM = arm({ scale: 0.3 }); armM.flex(1);
      const items = [
        [femur, 'Kemik (uzun)', 'Boyu eninden fazla olan kemiklerdir.'],
        [shortB, 'Kemik (kısa)', 'Boyu ve eni birbirine yakın kemiklerdir.'],
        [elbowJ, 'Eklem', 'Kemiklerin birbirine bağlandığı yerlerdir.'],
        [st, 'Düz kas', 'Mide, bağırsak gibi iç organların yapısında bulunur; isteğimiz dışında çalışır.'],
        [ht, 'Kalp kası', 'Sadece kalpte bulunur; hayat boyu durmadan çalışır.'],
        [armM, 'Çizgili kas', 'İskeletin etrafını sarar; isteğimizle çalışır.'],
      ];
      items.forEach(([o, n, i], k) => {
        const x = -0.5 + k * 0.2;
        o.position.set(x - (o === elbowJ || o === armM ? 0.06 : 0), 0.25, 0);
        o.traverse((c) => { if (c.isMesh) info(c, n, i); });
        const card = box(0.17, 0.3, 0.01, 0xfafafa); card.position.set(x, 0.2, -0.06);
        const l = label(n, { height: 0.03 }); l.position.set(x, 0.42, 0);
        root.add(o, card, l);
      });
      return { root, update(t) { ht.beat(t); st.churn(t); armM.flex(0.6 + 0.5 * Math.sin(t * 2)); elbowJ.flex(0.8 + 0.6 * Math.sin(t * 1.5)); } };
    },
  },

  // #55 s.121 Iskelet ve kemik adlari
  {
    mark: 55, page: 121, title: 'Vücudumuzdaki Bazı Kemikler',
    info: 'Vücudumuzda kafatası, omurga, kaburga, kürek, pazu, ön kol, el bilek ve parmak, leğen, uyluk, kaval, baldır ve ayak bilek kemikleri gibi pek çok kemik bulunur. Bir kemiğe dokunarak adını öğrenebilirsin.',
    build() {
      const root = new THREE.Group();
      const sk = skeleton({ h: 0.95 }); root.add(sk);
      const s = 0.95 / 1.8;
      const C2 = (t, a, b) => { const c = callout(t, V(a[0] * s, a[1] * s, a[2] * s), V(b[0], b[1], 0.05), { height: 0.035 }); root.add(c); return c; };
      C2('Kafatası', [0, 1.75, 0], [-0.3, 0.95]); C2('Kaburga', [0.1, 1.45, 0.08], [0.33, 0.8]);
      C2('Pazu kemiği', [0.22, 1.42, 0], [0.38, 0.72]); C2('Omurga', [0, 1.2, -0.05], [-0.33, 0.66]);
      C2('Leğen kemiği', [0.1, 0.98, 0], [0.38, 0.52]); C2('Ön kol', [-0.22, 0.98, 0], [-0.36, 0.5]);
      C2('Uyluk kemiği', [0.1, 0.7, 0], [0.36, 0.36]); C2('Kaval kemiği', [-0.1, 0.3, 0], [-0.33, 0.2]);
      return {
        root, update(t) {
          sk.rotation.y = Math.sin(t * 0.4) * 0.5;
          sk.joints.lShoulder.rotation.z = -0.15; sk.joints.rShoulder.rotation.z = 0.15;
        },
      };
    },
  },

  // #56 s.122 Uzun ve kisa kemikler
  {
    mark: 56, page: 122, title: 'Uzun ve Kısa Kemikler',
    info: 'Uzun kemiklerin boyu eninden fazladır: uyluk, kaval, baldır, pazu, ön kol ve parmak kemikleri. Vücuttaki en uzun kemik uyluk kemiğidir. Kısa kemiklerin boyu ve eni birbirine yakındır: el ve ayak bilek kemikleri.',
    build() {
      const root = new THREE.Group();
      const longs = [['Uyluk kemiği', 0.42, 0.024], ['Pazu kemiği', 0.32, 0.02], ['Parmak kemikleri', 0.1, 0.01]];
      longs.forEach(([n, len, r], i) => {
        const g = new THREE.Group();
        const shaft = capsule(r, len, C.bone); g.add(shaft);
        for (const y of [len / 2, -len / 2]) { const k = ball(r * 1.8, C.bone, 14); k.position.y = y; g.add(k); }
        g.position.set(-0.45 + i * 0.15, 0.08 + len / 2 + 0.03, 0);
        g.traverse((c) => { if (c.isMesh) info(c, n, 'Uzun kemik: boyu eninden fazladır.'); });
        root.add(g);
        const l = label(n, { height: 0.032 }); l.position.set(-0.45 + i * 0.15, 0.04, 0.08); root.add(l);
      });
      const wrist = new THREE.Group(); const rnd = rng(56);
      for (let i = 0; i < 8; i++) { const b = ball(0.03, C.bone, 12); b.scale.set(1 + rnd() * 0.3, 0.8 + rnd() * 0.3, 0.9); b.position.set((i % 4) * 0.055, Math.floor(i / 4) * 0.055, 0); wrist.add(info(b, 'El bilek kemikleri', 'Kısa kemiklerdir: boyu ve eni birbirine yakındır.')); }
      wrist.position.set(0.12, 0.25, 0);
      const ankle = new THREE.Group();
      for (let i = 0; i < 7; i++) { const b = box(0.045 + rnd() * 0.02, 0.04, 0.045, C.bone); b.position.set((i % 4) * 0.06, Math.floor(i / 4) * 0.05, 0); ankle.add(info(b, 'Ayak bilek kemikleri', 'Kısa kemiklerdir.')); }
      ankle.position.set(0.12, 0.08, 0.05);
      const lL = label('Uzun kemikler', { height: 0.045, bg: 'rgba(242,140,31,0.95)' }); lL.position.set(-0.3, 0.62, 0);
      const lS = label('Kısa kemikler', { height: 0.045, bg: 'rgba(242,140,31,0.95)' }); lS.position.set(0.25, 0.45, 0);
      const ruler = box(0.01, 0.42, 0.01, 0x1565c0); ruler.position.set(-0.52, 0.32, 0);
      root.add(wrist, ankle, lL, lS, ruler);
      return { root, update(t) { wrist.rotation.y = Math.sin(t * 0.7) * 0.4; ankle.rotation.y = -Math.sin(t * 0.7) * 0.4; } };
    },
  },

  // #57 s.122 Yassi kemikler
  {
    mark: 57, page: 122, title: 'Yassı Kemikler',
    info: 'Yassı kemikler levha şeklinde ve geniş yüzeylidir. Kafatası kemikleri, kürek kemiği, kaburgalar ve leğen kemiği yassı kemiklere örnektir. Kafatası beyni, kaburgalar kalbi ve akciğerleri korur.',
    build() {
      const root = new THREE.Group();
      const sk = skull(0.22); sk.position.set(-0.42, 0.2, 0);
      const pelvis = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 10, 24), lambert(C.bone)); ring.rotation.x = Math.PI / 2.5;
      for (const s of [-1, 1]) { const wing = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10, 0, Math.PI), lambert(C.bone, { side: THREE.DoubleSide })); wing.position.set(s * 0.07, 0.05, 0); wing.rotation.y = s * 1.2; wing.scale.set(1, 1, 0.3); pelvis.add(info(wing, 'Leğen kemiği', 'Yassı kemiktir; gövdeyi taşır.')); }
      pelvis.add(info(ring, 'Leğen kemiği', 'Yassı kemiktir; gövdeyi taşır.'));
      pelvis.position.set(-0.13, 0.15, 0);
      const scap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.17, 3), lambert(C.bone)); scap.scale.z = 0.15; scap.rotation.z = Math.PI; scap.position.set(0.13, 0.18, 0);
      info(scap, 'Kürek kemiği', 'Sırtta bulunan üçgen biçimli yassı kemiktir.');
      const ribs = new THREE.Group();
      for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.075 - Math.abs(i - 3) * 0.007, 0.007, 6, 24), lambert(C.bone)); r.rotation.x = Math.PI / 2 + 0.3; r.scale.set(1, 0.7, 1); r.position.y = i * 0.03; ribs.add(info(r, 'Kaburga kemikleri', 'Yassı kemiklerdir; göğüs kafesini oluşturur.')); }
      const sp = box(0.015, 0.22, 0.015, C.bone); sp.position.set(0, 0.09, -0.05); ribs.add(sp);
      ribs.position.set(0.4, 0.08, 0);
      const names = [['Kafatası', -0.42], ['Leğen', -0.13], ['Kürek', 0.13], ['Kaburga', 0.4]];
      for (const [n, x] of names) { const l = label(n, { height: 0.035 }); l.position.set(x, 0.42, 0); root.add(l); }
      root.add(sk, pelvis, scap, ribs);
      return { root, update(t) { for (const o of [sk, pelvis, scap, ribs]) o.rotation.y = Math.sin(t * 0.6) * 0.5; } };
    },
  },

  // #58 s.124 Kikirdak
  {
    mark: 58, page: 124, title: 'Kıkırdak',
    info: 'Kıkırdak, kemiklere göre daha yumuşak ve esnek bir yapıdır. Burun, soluk borusu, kulak kepçesi gibi yapılarda ve uzun kemiklerin uç kısmında bulunur; kemiklerin birbirine sürtünmesini önler.',
    build() {
      const root = new THREE.Group();
      const cm = (o) => { o.traverse((c) => { if (c.isMesh) info(c, c.userData.title || 'Kıkırdak', c.userData.info || 'Esnek yapıdadır.'); }); return o; };
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 4), lambert(C.skin)); nose.rotation.x = -0.3; nose.position.set(-0.42, 0.15, 0);
      info(nose, 'Burun', 'Burnun ucu kıkırdaktan yapılmıştır; bu yüzden esnektir.');
      const bone = new THREE.Group();
      const sh = capsule(0.018, 0.25, C.bone); const k = ball(0.035, C.bone, 16); k.position.y = 0.15;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(CARTILAGE)); cap.position.y = 0.155;
      bone.add(info(sh, 'Uzun kemik', 'Kemik sert ve dayanıklıdır.'), k, info(cap, 'Eklem kıkırdağı', 'Uzun kemiklerin uç kısmında bulunur; kemiklerin birbirine sürtünmesini önler.'));
      bone.position.set(-0.15, 0.2, 0);
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.022, 10, 24, Math.PI * 1.6), lambert(0xf4b896)); ear.position.set(0.12, 0.17, 0); ear.rotation.z = 0.8; ear.scale.set(0.8, 1.2, 0.6);
      info(ear, 'Kulak kepçesi', 'Kıkırdaktan yapılmıştır; bükülüp eski hâline döner.');
      const trachea = new THREE.Group();
      for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 6, 20, Math.PI * 1.6), lambert(CARTILAGE)); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI * 0.7; r.position.y = i * 0.028; trachea.add(info(r, 'Soluk borusu', 'Kıkırdak halkalar soluk borusunun kapanmasını önler.')); }
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.24, 16, 1, true), lambert(0xef9a9a, { side: THREE.DoubleSide })); tube.position.y = 0.11; trachea.add(tube);
      trachea.position.set(0.4, 0.04, 0);
      cm(trachea);
      const names = [['Burun', -0.42], ['Kemik ucu', -0.15], ['Kulak', 0.12], ['Soluk borusu', 0.4]];
      for (const [n, x] of names) { const l = label(n, { height: 0.034 }); l.position.set(x, 0.45, 0); root.add(l); }
      root.add(nose, bone, ear, trachea);
      return { root, update(t) { ear.scale.y = 1.2 + Math.sin(t * 3) * 0.12; nose.rotation.z = Math.sin(t * 3) * 0.12; } };
    },
  },

  // #59 s.125 Oynar ve yari oynar eklemler
  {
    mark: 59, page: 125, title: 'Oynar ve Yarı Oynar Eklemler',
    info: 'Oynar eklemler bağladıkları kemiklerin kolayca hareket etmesini sağlar; kol ve bacaklardaki eklemler buna örnektir. Yarı oynar eklemler kemiklerin oynar eklemlere göre daha az hareket etmesini sağlar; omurgadaki bazı eklemler buna örnektir.',
    build() {
      const root = new THREE.Group();
      const a = arm({ scale: 0.7 }); a.position.set(-0.5, 0.45, 0);
      const leg = new THREE.Group();
      const thigh = capsule(0.022, 0.25, C.bone); thigh.position.y = -0.14; leg.add(info(thigh, 'Uyluk kemiği', 'Uzun kemik.'));
      const knee = new THREE.Group(); knee.position.y = -0.29; leg.add(knee);
      knee.add(info(ball(0.035, CARTILAGE, 16, { transparent: true, opacity: 0.85 }), 'Diz eklemi', 'Oynar eklemdir; bacağın bükülmesini sağlar.'));
      const shin = capsule(0.02, 0.25, C.bone); shin.position.y = -0.15; knee.add(info(shin, 'Kaval kemiği', 'Uzun kemik.'));
      leg.position.set(0.05, 0.62, 0);
      const spine = new THREE.Group(); spine.position.set(0.35, 0.08, 0);
      const verts = [];
      for (let i = 0; i < 9; i++) {
        const p = new THREE.Group(); (i ? verts[i - 1] : spine).add(p); p.position.y = i ? 0.06 : 0;
        p.add(info(cyl(0.035, 0.035, 0.04, C.bone, 14), 'Omur', 'Omurgayı oluşturan kemiklerdir.'));
        const disc = info(cyl(0.032, 0.032, 0.014, CARTILAGE, 14), 'Yarı oynar eklem', 'Omurlar arasındaki eklemler kemiklerin az hareket etmesine izin verir.'); disc.position.y = 0.03; p.add(disc);
        verts.push(p);
      }
      const l1 = label('Oynar eklem', { height: 0.04, bg: 'rgba(46,125,50,0.95)' }); l1.position.set(-0.2, 0.75, 0);
      const l2 = label('Yarı oynar eklem', { height: 0.04, bg: 'rgba(242,140,31,0.95)' }); l2.position.set(0.35, 0.7, 0);
      root.add(a, leg, spine, l1, l2);
      return {
        root, update(t) {
          a.flex(0.9 + 0.8 * Math.sin(t * 1.6));
          knee.rotation.z = -(0.7 + 0.7 * Math.sin(t * 1.6 + 1));
          verts.forEach((v, i) => { v.rotation.z = i ? Math.sin(t * 1.2) * 0.06 : 0; });
        },
      };
    },
  },

  // #60 s.125 Oynamaz eklem (kafatasi)
  {
    mark: 60, page: 125, title: 'Oynamaz Eklemler',
    info: 'Oynamaz eklemlerin birbirine bağladığı kemikler hareket etmez. Kafatası kemikleri arasındaki eklemler (dikiş yerleri) oynamaz eklemlere örnektir.',
    build() {
      const root = new THREE.Group();
      const sk = skull(0.5, true); sk.position.y = 0.4;
      sk.sutures.forEach((l) => info(l, 'Oynamaz eklem', 'Kafatası kemikleri dikiş gibi birbirine kenetlenmiştir; hareket etmez.'));
      const l = label('Oynamaz eklem', { height: 0.05, bg: 'rgba(198,40,40,0.95)' }); l.position.set(0, 0.8, 0);
      root.add(sk, l);
      return { root, update(t) { sk.rotation.y = t * 0.4; sk.sutures.forEach((s) => { s.material.color.setHSL(0, 0.8, 0.4 + 0.2 * Math.sin(t * 4)); }); } };
    },
  },

  // #61 s.126 Iskelet kuklasi
  {
    mark: 61, page: 126, title: 'İskelet Kuklası',
    info: 'İskelet parçaları iplerle birleştirilerek kukla yapılabilir. İplerle çekilen kol ve bacaklar eklem yerlerinden hareket eder; tıpkı kaslarımızın kemiklerimizi hareket ettirmesi gibi.',
    build() {
      const root = new THREE.Group();
      const sk = skeleton({ h: 0.6 }); sk.position.y = 0.12;
      const bar = box(0.5, 0.02, 0.03, 0x795548); bar.position.y = 0.95;
      const strings = [];
      const ends = [['neck', 0], ['lElbow', -0.2], ['rElbow', 0.2], ['lKnee', -0.1], ['rKnee', 0.1]];
      for (const [, x] of ends) { const l = line([V(x, 0.95, 0), V(x, 0.5, 0)], 0xffffff); root.add(l); strings.push(l); }
      root.add(sk, bar);
      const tmp = new THREE.Vector3();
      return {
        root, update(t) {
          const w = Math.sin(t * 3);
          sk.joints.lShoulder.rotation.z = -0.3 - Math.max(0, w) * 1.4;
          sk.joints.rShoulder.rotation.z = 0.3 + Math.max(0, -w) * 1.4;
          sk.joints.lHip.rotation.x = Math.max(0, -w) * -0.8; sk.joints.lKnee.rotation.x = Math.max(0, -w) * 1.0;
          sk.joints.rHip.rotation.x = Math.max(0, w) * -0.8; sk.joints.rKnee.rotation.x = Math.max(0, w) * 1.0;
          sk.position.y = 0.12 + Math.abs(w) * 0.03;
          bar.rotation.z = w * 0.15;
          root.updateMatrixWorld(true);
          ends.forEach(([j, x], i) => {
            sk.joints[j].getWorldPosition(tmp); root.worldToLocal(tmp);
            strings[i].geometry.setFromPoints([V(x * Math.cos(w * 0.15), 0.95 + x * Math.sin(w * 0.15), 0), tmp.clone()]);
          });
        },
      };
    },
  },

  // #62 s.127 Cizgili kas
  {
    mark: 62, page: 127, title: 'Çizgili Kas',
    info: 'Çizgili kaslar iskeletin etrafını sarar. Kol, bacak ve parmaklardaki kaslar çizgili kastır. Yürüme, koşma, yazma gibi isteğimizle yaptığımız hareketleri sağlar.',
    build() {
      const root = new THREE.Group();
      const tis = muscleTissue('striated', 0.45, 0.2); tis.position.set(-0.28, 0.3, 0);
      tis.traverse((c) => { if (c.isMesh) info(c, 'Çizgili kas dokusu', 'Mikroskopta enine çizgiler ve çok sayıda çekirdek görülür.'); });
      const a = arm({ scale: 0.7 }); a.position.set(0.05, 0.25, 0);
      const ar = arrow(V(1, 0, 0), 0.08, 0x4fc3f7, 0.006); ar.position.set(-0.03, 0.3, 0);
      const l1 = label('Çizgili kas dokusu', { height: 0.035 }); l1.position.set(-0.28, 0.5, 0);
      const l2 = label('Koldaki çizgili kaslar', { height: 0.035 }); l2.position.set(0.3, 0.6, 0);
      root.add(tis, a, ar, l1, l2);
      return { root, update(t) { const f = 0.6 + 0.6 * Math.sin(t * 2); a.flex(f); tis.scale.x = 1 - f * 0.08; } };
    },
  },

  // #63 s.127 Duz kas
  {
    mark: 63, page: 127, title: 'Düz Kas',
    info: 'Düz kaslar mide, bağırsak gibi iç organların yapısında bulunur. İsteğimiz dışında, yavaş ve düzenli kasılırlar; örneğin midede besinlerin karışmasını sağlarlar.',
    build() {
      const root = new THREE.Group();
      const tis = muscleTissue('smooth', 0.45, 0.22); tis.position.set(-0.28, 0.3, 0);
      tis.traverse((c) => { if (c.isMesh) info(c, 'Düz kas dokusu', 'İğ biçimli, tek çekirdekli hücrelerden oluşur; enine çizgi yoktur.'); });
      const st = info(stomach(0.4), 'Mide', 'Duvarındaki düz kaslar kasılıp gevşeyerek besinleri karıştırır.'); st.position.set(0.3, 0.32, 0);
      const ar = arrow(V(1, 0, 0), 0.08, 0x4fc3f7, 0.006); ar.position.set(-0.02, 0.3, 0);
      const l1 = label('Düz kas dokusu', { height: 0.035 }); l1.position.set(-0.28, 0.5, 0);
      const l2 = label('Mide', { height: 0.035 }); l2.position.set(0.3, 0.62, 0);
      root.add(tis, st, ar, l1, l2);
      return { root, update(t) { st.churn(t); tis.scale.y = 1 + Math.sin(t * 1.2) * 0.06; } };
    },
  },

  // #64 s.127 Kalp kasi
  {
    mark: 64, page: 127, title: 'Kalp Kası',
    info: 'Kalp kası sadece kalpte bulunur ve kalbin çalışmasını sağlar. Kalp, anne karnındaki dönemden başlayarak yaşam sona erene kadar sürekli çalışır.',
    build() {
      const root = new THREE.Group();
      const tis = muscleTissue('cardiac', 0.45, 0.22); tis.position.set(-0.28, 0.3, 0);
      tis.traverse((c) => { if (c.isMesh) info(c, 'Kalp kası dokusu', 'Enine çizgili ve dallanmış hücrelerden oluşur.'); });
      const h = heart(0.3); h.position.set(0.3, 0.32, 0);
      h.traverse((c) => { if (c.isMesh) info(c, 'Kalp', 'Kalp kası sayesinde durmadan kasılıp gevşer ve kanı vücuda pompalar.'); });
      const ar = arrow(V(1, 0, 0), 0.08, 0x4fc3f7, 0.006); ar.position.set(-0.02, 0.3, 0);
      const bpm = label('', { height: 0.04, bg: 'rgba(198,40,40,0.95)' }); bpm.position.set(0.3, 0.62, 0);
      const l1 = label('Kalp kası dokusu', { height: 0.035 }); l1.position.set(-0.28, 0.5, 0);
      root.add(tis, h, ar, bpm, l1);
      return { root, update(t) { h.beat(t); bpm.setText(`♥ ${70 + Math.round(Math.sin(t * 0.3) * 3)} atım/dk`); } };
    },
  },

  // #65 s.128 Iskelette numarali eklemler
  {
    mark: 65, page: 128, title: 'Eklem Çeşitleri',
    info: 'Eklemler hareket yeteneklerine göre oynar, yarı oynar ve oynamaz eklem olarak sınıflandırılır. Numaralı noktalara dokunarak hangi eklem çeşidi olduğunu öğrenebilirsin.',
    build() {
      const root = new THREE.Group();
      const sk = skeleton({ h: 0.95 }); root.add(sk);
      const s = 0.95 / 1.8;
      const J = [
        [1, [0, 1.75, 0.06], 'Oynamaz eklem', 'Kafatası kemikleri arasındaki eklemler hareket etmez.', 0xc62828],
        [2, [0.21, 1.54, 0.03], 'Oynar eklem', 'Omuz eklemi kolun her yöne hareketini sağlar.', 0x2e7d32],
        [3, [0, 1.3, -0.02], 'Yarı oynar eklem', 'Omurlar arasındaki eklemler az hareket eder.', 0xef6c00],
        [4, [-0.21, 1.25, 0.03], 'Oynar eklem', 'Dirsek eklemi kolun bükülmesini sağlar.', 0x2e7d32],
        [5, [0.21, 0.98, 0.03], 'Oynar eklem', 'El bileği eklemi elin hareketini sağlar.', 0x2e7d32],
        [6, [-0.1, 0.52, 0.05], 'Oynar eklem', 'Diz eklemi bacağın bükülmesini sağlar.', 0x2e7d32],
        [7, [0.1, 0.1, 0.05], 'Oynar eklem', 'Ayak bileği eklemi ayağın hareketini sağlar.', 0x2e7d32],
      ];
      const marks = J.map(([n, p, title, text, col]) => {
        const m = marker(n, col);
        m.position.set(p[0] * s, p[1] * s, p[2] * s);
        info(m.ring, `${n}: ${title}`, text);
        m.children[1].userData = { title: `${n}: ${title}`, info: text };
        root.add(m);
        return m;
      });
      const legend = label('Yeşil: oynar • Turuncu: yarı oynar • Kırmızı: oynamaz', { height: 0.03 }); legend.position.set(0, 1.0, 0);
      root.add(legend);
      return {
        root, update(t, dt, camera) {
          marks.forEach((m, i) => { m.ring.scale.setScalar(1 + 0.25 * Math.sin(t * 4 + i)); if (camera) m.ring.quaternion.copy(camera.quaternion).premultiply(root.getWorldQuaternion(new THREE.Quaternion()).invert()); });
        },
      };
    },
  },

  // #66 s.128 Kol: A (kas), B (eklem), C (kemik)
  {
    mark: 66, page: 128, title: 'Kolun Hareketi',
    info: 'Kolda A ile gösterilen yapı kas (pazu kası), B eklem (dirsek eklemi), C kemiktir (ön kol kemiği). Pazu kası kasılınca kısalır ve ön kol kemiğini çeker; ön kol dirsek ekleminden bükülür.',
    build() {
      const root = new THREE.Group();
      const a = arm({ scale: 1.2 }); a.position.set(-0.4, 0.3, 0);
      const lA = info(label('A', { height: 0.06 }), 'A: Kas', 'Pazu kası kasılınca kısalıp kalınlaşır ve ön kolu yukarı çeker.');
      const lB = info(label('B', { height: 0.06 }), 'B: Eklem', 'Dirsek eklemi kemiklerin birbirine bağlandığı ve hareket ettiği yerdir.');
      const lC = info(label('C', { height: 0.06 }), 'C: Kemik', 'Ön kol kemiği kas tarafından çekilerek hareket eder.');
      root.add(a, lA, lB, lC);
      const tmp = new THREE.Vector3();
      return {
        root, update(t) {
          a.flex(0.9 + 0.8 * Math.sin(t * 1.5));
          root.updateMatrixWorld(true);
          a.biceps.getWorldPosition(tmp); root.worldToLocal(tmp); lA.position.copy(tmp).add(V(0, 0.13, 0));
          a.joint.getWorldPosition(tmp); root.worldToLocal(tmp); lB.position.copy(tmp).add(V(0.02, -0.1, 0.05));
          a.fore.localToWorld(tmp.set(0.2, 0, 0)); root.worldToLocal(tmp); lC.position.copy(tmp).add(V(0, 0.08, 0));
        },
      };
    },
  },

  // #67 s.131 Kirik kemik
  {
    mark: 67, page: 131, title: 'Kırık Kemik',
    info: 'Kemikler sağlam olsa da düşme ve şiddetli çarpmalarda kırılabilir. Kırıklar röntgenle tespit edilir ve alçıya alınır. Alçıda hareketsiz kalan kemik zamanla kaynar ve iyileşir.',
    build() {
      const root = new THREE.Group();
      const xray = box(0.75, 0.5, 0.01, 0x0d1b3e); xray.position.set(0, 0.3, -0.08);
      const bones = new THREE.Group(); bones.position.set(-0.3, 0.3, 0);
      const glowMat = (c) => new THREE.MeshBasicMaterial({ color: c });
      const b1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.28, 4, 10), glowMat(0x90caf9)); b1.rotation.z = Math.PI / 2; b1.position.set(0.14, 0.02, 0);
      const b2a = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.14, 4, 10), glowMat(0x90caf9)); b2a.rotation.z = Math.PI / 2; b2a.position.set(0.07, -0.03, 0);
      const b2b = b2a.clone(); b2b.position.set(0.24, -0.03, 0);
      info(b2a, 'Kırık kemik', 'Ön kol kemiği kırılmış. Röntgende kırık çizgisi görülür.'); info(b2b, 'Kırık kemik', 'Kırılan kemik alçıda hareketsiz kalınca kaynar.');
      info(b1, 'Ön kol kemiği', 'Sağlam kemik.');
      const crack = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0.6 })); crack.position.set(0.155, -0.03, 0.01);
      const hand = new THREE.Group();
      for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.08, 4, 8), glowMat(0x90caf9)); f.rotation.z = Math.PI / 2 + (i - 2) * 0.15; f.position.set(0.39, (i - 2) * 0.022, 0); hand.add(f); }
      bones.add(b1, b2a, b2b, crack, hand);
      const cast = info(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 20), lambert(0xfafafa, { transparent: true, opacity: 0.9 })), 'Alçı', 'Kırık kemiğin hareket etmesini önler; kemik böylece kaynar.');
      cast.rotation.z = Math.PI / 2; cast.position.set(0.15, 0, 0); bones.add(cast);
      const st = label('', { height: 0.045 }); st.position.set(0, 0.65, 0);
      root.add(info(xray, 'Röntgen filmi', 'Kemik kırıkları röntgen cihazıyla tespit edilir.'), bones, st);
      return {
        root, update(t) {
          const p = loop(t, 9);
          const gap = 0.012 * (1 - seg(p, 0.55, 0.85));
          b2a.position.x = 0.07 - gap; b2b.position.x = 0.24 + gap;
          crack.visible = p < 0.8; crack.material.opacity = 0.3 + 0.3 * Math.sin(t * 6);
          cast.visible = p > 0.3 && p < 0.9; cast.material.opacity = 0.9 * seg(p, 0.3, 0.4) * (1 - seg(p, 0.85, 0.9));
          st.setText(p < 0.3 ? '1. Röntgen: kırık tespit edildi' : p < 0.85 ? '2. Alçı: kemik kaynıyor' : '3. Kemik iyileşti');
        },
      };
    },
  },

  // #68 s.131 Dengeli beslenme
  {
    mark: 68, page: 131, title: 'Kemik ve Kas Sağlığı için Beslenme',
    info: 'Destek ve hareket sisteminin sağlığı için dengeli ve düzenli beslenmek gerekir. Kalsiyum, D vitamini ve protein bakımından zengin besinler (süt, peynir, yumurta, balık, et, sebzeler) kemik ve kasları güçlendirir.',
    build() {
      const root = new THREE.Group();
      const plate = cyl(0.42, 0.38, 0.03, 0xeceff1, 48); plate.position.y = 0.015;
      const carousel = new THREE.Group(); carousel.position.y = 0.03;
      const foods = [
        ['Süt', () => { const g = new THREE.Group(); const b = cyl(0.04, 0.045, 0.15, 0xfafafa, 16); b.position.y = 0.075; const c = cyl(0.02, 0.02, 0.02, 0x1e88e5, 10); c.position.y = 0.16; g.add(b, c); return g; }, 'Kalsiyum ve protein kaynağıdır.'],
        ['Peynir', () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 3), lambert(0xffe082)); m.position.y = 0.025; return m; }, 'Kalsiyum bakımından zengindir.'],
        ['Yumurta', () => { const m = ball(0.04, 0xfff3e0, 16); m.scale.y = 1.3; m.position.y = 0.05; return m; }, 'Protein ve D vitamini içerir.'],
        ['Balık', () => { const m = ball(0.04, 0x90a4ae, 16); m.scale.set(2.2, 0.8, 0.8); m.position.y = 0.04; const tail = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 3), lambert(0x90a4ae)); tail.rotation.z = Math.PI / 2; tail.position.set(-0.1, 0.04, 0); const g = new THREE.Group(); g.add(m, tail); return g; }, 'Protein ve D vitamini kaynağıdır.'],
        ['Et', () => { const m = ball(0.05, 0xc62828, 16); m.scale.set(1.5, 0.5, 1); m.position.y = 0.03; return m; }, 'Kaslar için gerekli proteini sağlar.'],
        ['Brokoli', () => { const g = new THREE.Group(); const s = cyl(0.012, 0.015, 0.06, 0x7cb342, 8); s.position.y = 0.03; const h = ball(0.045, 0x2e7d32, 10); h.position.y = 0.08; g.add(s, h); return g; }, 'Kalsiyum ve vitamin içerir.'],
        ['Kabak', () => { const m = ball(0.055, 0xef6c00, 16); m.scale.y = 0.8; m.position.y = 0.045; return m; }, 'Vitamin ve mineral kaynağıdır.'],
      ];
      foods.forEach(([n, mk, i], k) => {
        const a = (k / foods.length) * Math.PI * 2;
        const o = mk(); o.position.x += Math.cos(a) * 0.27; o.position.z += Math.sin(a) * 0.27;
        o.traverse((c) => { if (c.isMesh) info(c, n, i); });
        if (o.isMesh) info(o, n, i);
        carousel.add(o);
        const l = label(n, { height: 0.03 }); l.position.set(Math.cos(a) * 0.27, 0.22, Math.sin(a) * 0.27); carousel.add(l);
      });
      const tags = label('Kalsiyum • D vitamini • Protein', { height: 0.04, bg: 'rgba(46,125,50,0.95)' }); tags.position.set(0, 0.42, 0);
      root.add(plate, carousel, tags);
      return { root, update(t) { carousel.rotation.y = t * 0.3; } };
    },
  },

  // #69 s.132 Dogru oturus
  {
    mark: 69, page: 132, title: 'Doğru Oturuş',
    info: 'Televizyon, bilgisayar veya telefon karşısında uzun süre hareketsiz kalmak kas ve kemik hastalıklarına yol açabilir. Ders çalışırken ve otururken sırt dik tutulmalı, belirli aralıklarla hareket edilmelidir.',
    build() { return postureScene('sit'); },
  },

  // #70 s.132 Dogru yuk kaldirma ve tasima
  {
    mark: 70, page: 132, title: 'Doğru Yük Kaldırma ve Taşıma',
    info: 'Yerden bir eşya alırken bel değil dizler bükülmeli, sırt dik tutulmalıdır. Yük taşırken ağırlık iki kola eşit dağıtılmalıdır.',
    build() { return postureScene('lift'); },
  },

  // #71 s.138 Iki mikroskop
  {
    mark: 71, page: 138, title: 'Hangi Hücre? I. ve II. Mikroskop',
    info: 'Mikroskoplarda farklı canlılardan alınan hücreler inceleniyor. Hücre duvarı ve kloroplast görülen hücre bitki hücresidir; sentrozom görülen ve hücre duvarı olmayan hücre hayvan hücresidir.',
    build() {
      const root = new THREE.Group();
      const m1 = microscope(0.5, { labels: false }); m1.position.set(-0.3, 0, -0.1);
      const m2 = microscope(0.5, { labels: false }); m2.position.set(0.3, 0, -0.1);
      const c1 = cell('plant', 0.25); c1.position.set(-0.3, 0.72, 0);
      const c2 = cell('animal', 0.25); c2.position.set(0.3, 0.72, 0);
      const l1 = label('I. Mikroskop: Bitki hücresi', { height: 0.035, bg: 'rgba(46,125,50,0.95)' }); l1.position.set(-0.3, 0.92, 0);
      const l2 = label('II. Mikroskop: Hayvan hücresi', { height: 0.035, bg: 'rgba(173,20,87,0.95)' }); l2.position.set(0.3, 0.92, 0);
      root.add(m1, m2, c1, c2, l1, l2);
      return { root, update(t) { c1.rotation.y = t * 0.4; c2.rotation.y = -t * 0.4; m1.focus(0.5 + 0.5 * Math.sin(t)); m2.focus(0.5 + 0.5 * Math.cos(t)); } };
    },
  },
];

/** Dogru / yanlis durus karsilastirmasi. kind: 'sit' | 'lift' */
function postureScene(kind) {
  const root = new THREE.Group();
  const mk = (good, x) => {
    const g = new THREE.Group(); g.position.x = x;
    const p = human({ h: 0.5, shirt: 0x1e88e5, pants: 0x283593 });
    p.traverse((c) => { if (c.isMesh) info(c, good ? 'Doğru duruş' : 'Yanlış duruş', good ? 'Sırt dik, yük dizler bükülerek kaldırılır.' : 'Bel bükülür; zamanla bel ve sırt ağrılarına yol açabilir.'); });
    g.add(p);
    const sign = label(good ? '✓ Doğru' : '✗ Yanlış', { height: 0.05, bg: good ? 'rgba(46,125,50,0.95)' : 'rgba(198,40,40,0.95)' });
    sign.position.y = 0.65; g.add(sign);
    let extra = null;
    if (kind === 'sit') {
      const desk = table(0.3, 0.2, 0.26, 0x8d6e63); desk.position.z = 0.17; g.add(desk);
      const chair = new THREE.Group(); const seat = box(0.16, 0.02, 0.16, 0x5d4037); seat.position.y = 0.22; const back = box(0.16, 0.22, 0.02, 0x5d4037); back.position.set(0, 0.33, -0.08); chair.add(seat, back); g.add(chair);
      const book = box(0.12, 0.01, 0.09, 0xfafafa); book.position.set(0, 0.275, 0.13); g.add(book);
      p.position.y = -0.05;
    } else {
      extra = crate(0.09); g.add(extra);
    }
    root.add(g);
    return { p, good, extra };
  };
  const A = mk(false, -0.28), B = mk(true, 0.28);
  return {
    root, update(t) {
      for (const { p, good, extra } of [A, B]) {
        const J = p.joints;
        if (kind === 'sit') {
          J.lHip.rotation.x = J.rHip.rotation.x = -1.5;
          J.lKnee.rotation.x = J.rKnee.rotation.x = 1.5;
          J.spine.rotation.x = good ? 0.05 : 0.6 + Math.sin(t) * 0.05;
          J.neck.rotation.x = good ? 0.2 : 0.5;
          J.lShoulder.rotation.x = J.rShoulder.rotation.x = -0.9;
        } else {
          const q = 0.5 - 0.5 * Math.cos(t * 1.4); // 0 ayakta, 1 egilmis
          if (good) {
            J.lHip.rotation.x = J.rHip.rotation.x = -1.4 * q; J.lKnee.rotation.x = J.rKnee.rotation.x = 2.0 * q;
            J.spine.rotation.x = 0.25 * q; p.position.y = -0.17 * q;
          } else {
            J.lHip.rotation.x = J.rHip.rotation.x = -0.15 * q; J.lKnee.rotation.x = J.rKnee.rotation.x = 0.1 * q;
            J.spine.rotation.x = 1.4 * q; p.position.y = -0.01 * q;
          }
          J.lShoulder.rotation.x = J.rShoulder.rotation.x = -0.3 * q;
          extra.position.set(0, 0.045 + (1 - q) * 0.2, 0.14);
        }
      }
    },
  };
}

function crate(s = 0.1) {
  const m = box(s, s, s, 0xffb300);
  info(m, 'Yük', 'Yük kaldırırken dizler bükülmeli, sırt dik tutulmalıdır.');
  return m;
}
