// 2. Unite: Kuvveti Tanıyalım
import {
  THREE, C, info, label, callout, line, box, cyl, ball, rod, arrow, planet, planetTexture, glow, stars,
  dynamometer, spring, floor, table, human, vehicle, particles, loop, seg, ease, rng, lambert,
} from '../lib.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Ust ucu y=top'ta asili dinamometre icin basit sehpa. */
function stand(x, top, w = 0.3) {
  const g = new THREE.Group();
  const post = box(0.02, top, 0.02, 0x795548); post.position.set(x - w / 2, top / 2, -0.05);
  const beam = box(w, 0.02, 0.02, 0x795548); beam.position.set(x, top, -0.05);
  const foot = box(0.12, 0.015, 0.12, 0x5d4037); foot.position.set(x - w / 2, 0.008, -0.05);
  g.add(post, beam, foot);
  return g;
}

/** Su sisesi. */
function bottle(h = 0.14) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.22, h * 0.22, h * 0.75, 20),
    new THREE.MeshLambertMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.65 }));
  body.position.y = -h * 0.55;
  const neck = cyl(h * 0.08, h * 0.2, h * 0.15, 0x4fc3f7, 16); neck.position.y = -h * 0.1;
  const capM = cyl(h * 0.08, h * 0.08, h * 0.05, 0x1565c0, 12);
  g.add(body, neck, capM);
  return g;
}

/** Asili dinamometre + yuk; okuma etiketi. */
function hangingScale(x, top, { maxN = 10, len = 0.45, color = 0x1e88e5, thick = 1 } = {}) {
  const d = dynamometer({ len, maxN, color, thick });
  d.position.set(x, top - 0.03, 0);
  const reading = label('0 N', { height: 0.045, bg: 'rgba(21,101,192,0.95)' });
  reading.position.set(x + 0.12, top - len * 0.4, 0);
  info(d.children[1], 'Dinamometre', 'Kuvvetin büyüklüğünü ölçen alettir. Kuvvet birimi Newton (N)’dur.');
  return { d, reading };
}

/** Basit cift kefeli terazi. tilt(a) kollari eger; leftPan/rightPan uzerine nesne eklenir. */
function balance(w = 0.6) {
  const g = new THREE.Group();
  const base = box(w * 0.4, 0.03, 0.12, 0xd84315); base.position.y = 0.015;
  const post = box(0.03, 0.22, 0.03, 0xd84315); post.position.y = 0.13;
  const beam = new THREE.Group(); beam.position.y = 0.25;
  beam.add(box(w, 0.02, 0.03, 0xe64a19));
  const pans = [-1, 1].map((s) => {
    const p = new THREE.Group(); p.position.x = (s * w) / 2;
    const plate = cyl(0.1, 0.08, 0.015, 0xbf360c, 24); plate.position.y = -0.1;
    p.add(plate, rod(V(0, 0, 0), V(0, -0.1, 0), 0.003, 0x5d4037));
    beam.add(p);
    return p;
  });
  const needle = box(0.008, 0.08, 0.008, 0x212121); needle.position.y = 0.05; beam.add(needle);
  g.add(base, post, beam);
  info(base, 'Eşit kollu terazi', 'Kütle ölçümünde kullanılır. Kütle, cismin her yerde değişmeyen madde miktarıdır.');
  g.tilt = (a) => { beam.rotation.z = a; pans.forEach((p) => { p.rotation.z = -a; }); };
  g.leftPan = new THREE.Group(); g.leftPan.position.y = -0.09; pans[0].add(g.leftPan);
  g.rightPan = new THREE.Group(); g.rightPan.position.y = -0.09; pans[1].add(g.rightPan);
  return g;
}

/** Yuk (kup). */
function crate(s = 0.1, color = 0xa1887f) {
  const m = box(s, s, s, color);
  const tape = box(s * 1.01, s * 0.12, s * 1.01, 0x795548); m.add(tape);
  return m;
}

/** Itme / cekme animasyonu icin yuzey seridi + kayan cisim. */
function slideLane(kind, z, title, text) {
  const g = new THREE.Group();
  const f = info(floor(kind, 1.0, 0.22), title, text);
  f.position.z = z;
  g.add(f);
  return g;
}

export default [
  // #21 s.61 Dinamometrenin kisimlari
  {
    mark: 21, page: 61, title: 'Dinamometrenin Kısımları',
    info: 'Kuvvetin büyüklüğü dinamometre ile ölçülür. Dinamometrede sarmal yay ve gösterge bulunur. Yay ne kadar çok uzarsa ölçülen kuvvet o kadar büyüktür. Kuvvetin birimi Newton (N)’dur.',
    build() {
      const root = new THREE.Group();
      root.add(stand(0, 0.8));
      const { d, reading } = hangingScale(0, 0.8, { len: 0.5 });
      const block = info(crate(0.13, 0xff8a65), 'Cisim', 'Dinamometreye asılan cisim, yer çekimi nedeniyle yayı aşağı doğru çeker.');
      root.add(d, reading, block);
      const c1 = callout('Sarmal yay', V(0.02, 0.6, 0), V(-0.3, 0.62, 0), { height: 0.045 });
      const c2 = callout('Gösterge', V(0.03, 0.4, 0.05), V(-0.3, 0.38, 0), { height: 0.045 });
      info(c1.label, 'Sarmal yay', 'Kuvvet uygulandığında uzayan, kuvvet kalkınca eski hâline dönen yaydır.');
      info(c2.label, 'Gösterge', 'Yayın uzama miktarını kuvvet değeri olarak gösteren bölmeli kısımdır.');
      root.add(c1, c2);
      return {
        root, update(t) {
          const p = loop(t, 6), f = seg(p, 0.15, 0.45) * (1 - seg(p, 0.85, 1)) * 0.6;
          d.setForce(f);
          block.position.set(0, d.position.y + d.hook.position.y - 0.1, 0);
          block.visible = p > 0.1;
          reading.setText(`${Math.round(f * 10)} N`);
        },
      };
    },
  },

  // #22 s.61 Bir ve iki su sisesi
  {
    mark: 22, page: 61, title: 'Ölçülen Kuvvet Artınca Yay Daha Çok Uzar',
    info: 'Dinamometreye bir su şişesi yerine iki su şişesi asıldığında yay daha çok uzar ve ölçülen kuvvet artar. Ölçüm yaparken dinamometrenin ölçüm sınırına dikkat edilmelidir.',
    build() {
      const root = new THREE.Group();
      root.add(stand(0, 0.9, 0.6));
      const a = hangingScale(-0.15, 0.9, { len: 0.42 });
      const b = hangingScale(0.15, 0.9, { len: 0.42 });
      const b1 = bottle(), b2 = bottle(), b3 = bottle();
      info(b1.children[0], '1 şişe', 'Bir şişe yayı belirli bir miktar uzatır.');
      info(b2.children[0], '2 şişe', 'İki şişe yayı yaklaşık iki kat uzatır.');
      root.add(a.d, a.reading, b.d, b.reading, b1, b2, b3);
      const l1 = label('1. durum', { height: 0.04 }); l1.position.set(-0.15, 0.06, 0.1);
      const l2 = label('2. durum', { height: 0.04 }); l2.position.set(0.15, 0.06, 0.1);
      root.add(l1, l2);
      return {
        root, update(t) {
          const p = seg(loop(t, 5), 0.1, 0.5);
          a.d.setForce(0.4 * p); b.d.setForce(0.8 * p);
          const ya = a.d.position.y + a.d.hook.position.y - 0.03, yb = b.d.position.y + b.d.hook.position.y - 0.03;
          b1.position.set(-0.15, ya, 0); b2.position.set(0.15, yb, 0); b3.position.set(0.15, yb - 0.16, 0);
          a.reading.setText(`${Math.round(4 * p)} N`); b.reading.setText(`${Math.round(8 * p)} N`);
        },
      };
    },
  },

  // #23 s.62 Ayni poset, farkli yaylar
  {
    mark: 23, page: 62, title: 'Aynı Yük, Farklı Yaylar',
    info: 'Aynı poset farklı yaylı iki dinamometreyle ölçüldüğünde okunan değer aynıdır; ancak yayların uzama miktarı farklı olabilir. İnce yay daha çok uzar, kalın yay daha az uzar.',
    build() {
      const root = new THREE.Group();
      root.add(stand(0, 0.95, 0.6));
      const a = hangingScale(-0.15, 0.95, { len: 0.42, color: 0xef5350, thick: 0.7 });
      const b = hangingScale(0.15, 0.95, { len: 0.42, color: 0x42a5f5, thick: 1.8, maxN: 20 });
      const bags = [-0.15, 0.15].map((x) => {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.08), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
        const book = box(0.09, 0.11, 0.03, 0x81c784); bag.add(book);
        info(bag, 'Poşet', 'İki dinamometreye de aynı poset asılmıştır.');
        root.add(bag);
        return bag;
      });
      root.add(a.d, a.reading, b.d, b.reading);
      const la = label('İnce yay: çok uzar', { height: 0.035 }); la.position.set(-0.3, 0.12, 0.1);
      const lb = label('Kalın yay: az uzar', { height: 0.035 }); lb.position.set(0.3, 0.12, 0.1);
      root.add(la, lb);
      return {
        root, update(t) {
          const p = seg(loop(t, 5), 0.1, 0.5);
          a.d.setForce(0.6 * p); b.d.setForce(0.3 * p);
          [a, b].forEach((s, i) => { bags[i].position.set(i ? 0.15 : -0.15, s.d.position.y + s.d.hook.position.y - 0.1, 0); });
          a.reading.setText(`${Math.round(6 * p)} N`); b.reading.setText(`${Math.round(6 * p)} N`);
        },
      };
    },
  },

  // #24 s.63 El kantari
  {
    mark: 24, page: 63, title: 'El Kantarı',
    info: 'Pazar yerlerinde kullanılan el kantarı bir çeşit dinamometredir. Kancaya yük asıldığında içindeki yay uzar ve ibre döner.',
    build() {
      const root = new THREE.Group();
      const body = new THREE.Group(); body.position.set(0, 0.55, 0); body.rotation.x = Math.PI / 2;
      const dial = cyl(0.17, 0.17, 0.05, 0xeceff1, 40);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 8, 40), lambert(0x37474f)); rim.rotation.x = Math.PI / 2;
      body.add(info(dial, 'El kantarı', 'Yayın uzaması ibreyi döndürür; ibrenin gösterdiği değer okunur.'), rim);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const tick = box(0.004, 0.01, i % 5 === 0 ? 0.03 : 0.015, 0x212121);
        tick.position.set(Math.sin(a) * 0.14, 0.026, -Math.cos(a) * 0.14); tick.rotation.y = -a; body.add(tick);
      }
      const needle = new THREE.Group(); needle.position.y = 0.03;
      const nm = box(0.006, 0.006, 0.13, 0x1565c0); nm.position.z = -0.065; needle.add(nm, ball(0.015, 0xffd600, 12));
      body.add(needle);
      root.add(body);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 20, Math.PI), lambert(0x212121)); handle.position.set(0, 0.74, 0);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20, Math.PI * 1.4), lambert(0x9e9e9e)); hook.rotation.z = Math.PI * 0.8;
      const chain = rod(V(0, 0.38, 0), V(0, 0.3, 0), 0.004, 0x9e9e9e);
      const bag = info(box(0.14, 0.12, 0.08, 0x8d6e63), 'Yük', 'Pazarda tartılan ürün.');
      const reading = label('0 kg', { height: 0.05 }); reading.position.set(0.25, 0.7, 0);
      root.add(handle, chain, hook, bag, reading);
      return {
        root, update(t) {
          const p = seg(loop(t, 5), 0.15, 0.5) * (1 - seg(loop(t, 5), 0.85, 1));
          needle.rotation.y = -p * Math.PI * 1.2;
          hook.position.set(0, 0.28 - p * 0.03, 0);
          bag.position.set(0, 0.18 - p * 0.03, 0);
          bag.visible = loop(t, 5) > 0.1;
          reading.setText(`${(p * 3).toFixed(1)} kg`);
        },
      };
    },
  },

  // #25 s.63 Yay kalinligi ve cinsi
  {
    mark: 25, page: 63, title: 'Yayın Kalınlığı ve Cinsi',
    info: 'Aynı maddeden yapılmış ince ve kalın yaylara aynı yük (10 N) asılırsa ince yay daha çok uzar; ince yaylı dinamometre daha hassastır. Yayın yapıldığı madde de ölçülebilecek kuvvet aralığını belirler.',
    build() {
      const root = new THREE.Group();
      const top = 0.85;
      const beam = box(1.1, 0.03, 0.06, 0x5d4037); beam.position.y = top;
      root.add(beam);
      const specs = [
        { x: -0.42, wire: 0.004, color: 0x90a4ae, k: 1.0, t: 'İnce yay', i: 'Aynı yükle daha çok uzar; daha hassas ölçüm yapar.' },
        { x: -0.16, wire: 0.009, color: 0x90a4ae, k: 0.45, t: 'Kalın yay', i: 'Aynı yükle daha az uzar; daha büyük kuvvetleri ölçebilir.' },
        { x: 0.16, wire: 0.006, color: 0xb87333, k: 0.8, t: 'Bakır yay', i: 'Yayın yapıldığı madde değişince uzama miktarı da değişir.' },
        { x: 0.42, wire: 0.006, color: 0x546e7a, k: 0.5, t: 'Çelik yay', i: 'Farklı maddeden yapılmış yaylar aynı yükle farklı uzar.' },
      ];
      const parts = specs.map((s) => {
        const sp = spring(0.035, 12, s.wire, s.color); sp.position.set(s.x, top - 0.015, 0);
        const w = info(ball(0.045, 0x29b6f6, 20), '10 N', 'Her yaya aynı ağırlıkta (10 N) cisim asılmıştır.');
        const l = info(label(s.t, { height: 0.035 }), s.t, s.i); l.position.set(s.x, top + 0.07, 0);
        info(sp, s.t, s.i);
        root.add(sp, w, l);
        return { sp, w, s };
      });
      const l1 = label('Aynı madde', { height: 0.035, bg: 'rgba(46,125,50,0.9)' }); l1.position.set(-0.29, 0.06, 0.1);
      const l2 = label('Aynı kalınlık, farklı madde', { height: 0.035, bg: 'rgba(46,125,50,0.9)' }); l2.position.set(0.29, 0.06, 0.1);
      root.add(l1, l2);
      return {
        root, update(t) {
          const p = seg(loop(t, 5), 0.1, 0.5);
          for (const { sp, w, s } of parts) {
            const L = 0.18 + p * 0.35 * s.k;
            sp.scale.y = L;
            w.position.set(s.x, top - 0.015 - L - 0.045, 0);
          }
        },
      };
    },
  },

  // #26 s.65 Olcebilecegi kuvvet ve bolme sayisi
  {
    mark: 26, page: 65, title: 'Bir Bölme Kaç Newton?',
    info: 'Dinamometrenin üzerinde yazan en büyük kuvvet değeri bölme sayısına bölünerek bir bölmenin değeri bulunur. 50 N’luk ve 10 bölmeli dinamometrede bir bölme 50 ÷ 10 = 5 N’dur.',
    build() {
      const root = new THREE.Group();
      root.add(stand(0, 0.95));
      const { d, reading } = hangingScale(0, 0.95, { len: 0.55, maxN: 10, color: 0x29b6f6 });
      const tag = label('50 N', { height: 0.05, bg: 'rgba(2,119,189,0.95)' }); tag.position.set(-0.13, 0.75, 0.05);
      const block = info(crate(0.13, 0xbf6b4a), 'Cisim', 'Göstergedeki bölme sayısı sayılarak ağırlığı bulunur.');
      const calc = label('1 bölme = 50 N ÷ 10 = 5 N', { height: 0.045 }); calc.position.set(0, 0.06, 0.15);
      root.add(d, reading, tag, block, calc);
      return {
        root, update(t) {
          const p = seg(loop(t, 6), 0.1, 0.5), div = Math.round(p * 6);
          d.setForce(div / 10);
          block.position.set(0, d.position.y + d.hook.position.y - 0.1, 0);
          reading.setText(`${div} bölme = ${div * 5} N`);
        },
      };
    },
  },

  // #27 s.70 Karat: keciboynuzu cekirdegi ve pirlanta
  {
    mark: 27, page: 70, title: 'Karat ve Keçiboynuzu Çekirdeği',
    info: 'Karat adı, keçiboynuzunun Arapça karşılığı “karrat”tan gelir. Hassas teraziler yokken elmas tüccarları kütleyi keçiboynuzu çekirdekleriyle ölçerdi. Bugün 1 karat 0,2 gramdır.',
    build() {
      const root = new THREE.Group();
      const b = balance(0.6);
      root.add(b);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), new THREE.MeshLambertMaterial({ color: 0xe1f5fe, transparent: true, opacity: 0.85 }));
      gem.scale.y = 1.3; gem.position.y = 0.04;
      b.leftPan.add(info(gem, 'Pırlanta', 'Değerli taşların kütlesi karat ile ölçülür.'));
      const seeds = [];
      for (let i = 0; i < 4; i++) {
        const s = ball(0.014, 0x4e342e, 10); s.scale.set(1.3, 0.7, 1); s.position.set((i % 2 - 0.5) * 0.035, 0.012 + Math.floor(i / 2) * 0.02, 0);
        b.rightPan.add(info(s, 'Keçiboynuzu çekirdeği', 'Çekirdeklerin kütleleri birbirine çok yakındır; bu yüzden kütle birimi olarak kullanılmıştır.'));
        seeds.push(s);
      }
      const l = label('', { height: 0.045 }); l.position.set(0, 0.55, 0);
      root.add(l);
      return {
        root, update(t) {
          const p = loop(t, 8), n = Math.min(4, Math.floor(p * 6));
          seeds.forEach((s, i) => { s.visible = i < n; });
          const target = (4 - n) * 0.06;
          b.tilt(target * ease(Math.min(1, (p * 6) % 1 + 0.2)));
          l.setText(n === 4 ? 'Dengede: 4 çekirdek = 4 karat ≈ 0,8 g' : `${n} çekirdek`);
        },
      };
    },
  },

  // #28 s.71 Kutle ve agirlik olcumu
  {
    mark: 28, page: 71, title: 'Kütle ve Ağırlık',
    info: 'Kütle eşit kollu terazi ile ölçülür ve birimi kilogram (kg) veya gram (g)’dır. Ağırlık bir kuvvettir; dinamometre ile ölçülür ve birimi Newton (N)’dur.',
    build() {
      const root = new THREE.Group();
      root.add(stand(-0.3, 0.85));
      const { d, reading } = hangingScale(-0.3, 0.85, { len: 0.4 });
      const bag1 = info(box(0.1, 0.12, 0.07, 0xe0e0e0), 'Ağırlık ölçümü', 'Dinamometre ağırlığı (N) ölçer. Ağırlık bulunulan yere göre değişebilir.');
      const b = balance(0.5); b.position.x = 0.22;
      const bag2 = box(0.1, 0.12, 0.07, 0xe0e0e0); bag2.position.y = 0.06; b.leftPan.add(bag2);
      const weights = cyl(0.03, 0.03, 0.06, 0x616161, 16); weights.position.y = 0.03; b.rightPan.add(weights);
      info(bag2, 'Kütle ölçümü', 'Eşit kollu terazi kütleyi (kg) ölçer. Kütle her yerde aynıdır.');
      const lm = label('Kütle: 1 kg', { height: 0.045, bg: 'rgba(216,67,21,0.95)' }); lm.position.set(0.22, 0.45, 0);
      root.add(d, reading, bag1, b, lm);
      return {
        root, update(t) {
          const p = seg(loop(t, 6), 0.1, 0.45);
          d.setForce(p);
          bag1.position.set(-0.3, d.position.y + d.hook.position.y - 0.08, 0);
          reading.setText(`Ağırlık: ${Math.round(p * 10)} N`);
          b.tilt(0.25 * (1 - p));
        },
      };
    },
  },

  // #29 s.72 Yer cekimi kuvvetinin yonu
  {
    mark: 29, page: 72, title: 'Yer Çekimi Kuvvetinin Yönü',
    info: "Dünya, üzerindeki cisimleri kendine doğru çeker; buna yer çekimi kuvveti denir. Yönü her zaman Dünya'nın merkezine doğrudur. Bu yüzden Dünya'nın neresinde olursa olsun yukarı atılan cisim yere düşer.",
    build() {
      const root = new THREE.Group();
      const c = V(0, 0.5, 0);
      const earth = info(planet('earth', 0.2), 'Dünya', 'Cisimleri merkezine doğru çeker.'); earth.position.copy(c);
      root.add(earth, stars(150, 0.9, 29));
      const balls = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dir = V(Math.cos(a), Math.sin(a), 0);
        const ar = arrow(dir.clone().negate(), 0.12, C.white, 0.008);
        ar.position.copy(c).addScaledVector(dir, 0.38);
        const bl = info(ball(0.018, [C.red, C.yellow, 0x66bb6a, 0xab47bc][i % 4], 10), 'Cisim', 'Bulunduğu yer neresi olursa olsun Dünya’nın merkezine doğru düşer.');
        root.add(ar, bl);
        balls.push({ bl, dir });
      }
      return {
        root, update(t) {
          earth.rotation.y = t * 0.3;
          const p = loop(t, 3);
          for (const { bl, dir } of balls) bl.position.copy(c).addScaledVector(dir, 0.45 - ease(p) * 0.24);
        },
      };
    },
  },

  // #30 s.72 Yukseklik arttikca yer cekimi azalir (A-B, K-L)
  {
    mark: 30, page: 72, title: 'Yükseldikçe Yer Çekimi Azalır',
    info: "Yer çekimi kuvveti Dünya'nın yüzeyinden uzaklaştıkça azalır, yüzeye yaklaştıkça artar. A noktasındaki yer çekimi B'dekinden, K noktasındaki yer çekimi L'dekinden fazladır.",
    build() {
      const root = new THREE.Group();
      const sea = box(0.5, 0.02, 0.4, 0x0288d1); sea.position.set(-0.28, 0.01, 0);
      const cliff = box(0.18, 0.45, 0.4, 0x558b2f); cliff.position.set(-0.4, 0.225, 0);
      const grass = box(0.18, 0.02, 0.4, 0x7cb342); grass.position.set(-0.4, 0.46, 0);
      root.add(sea, cliff, grass);
      const pts = [
        { n: 'A', p: V(-0.2, 0.03, 0.1), f: 0.2, i: 'Deniz seviyesinde, yüzeye en yakın nokta. Yer çekimi daha fazla.' },
        { n: 'B', p: V(-0.4, 0.48, 0.1), f: 0.12, i: 'Daha yüksekte; yer çekimi A noktasına göre daha az.' },
      ];
      const pad = box(0.14, 0.02, 0.14, 0x616161); pad.position.set(0.3, 0.01, 0); root.add(pad);
      const rocket = vehicle('rocket'); rocket.position.set(0.3, 0.02, 0); root.add(rocket);
      info(rocket.children[0], 'Uzay aracı', 'Yükseldikçe üzerine etki eden yer çekimi kuvveti azalır.');
      const K = { n: 'K', f: 0.18, i: 'Uzay aracının alttaki konumu; yer çekimi daha fazla.' };
      const L = { n: 'L', f: 0.1, i: 'Uzay aracının üstteki konumu; yer çekimi daha az.' };
      for (const q of pts) {
        const d = ball(0.015, C.red, 10); d.position.copy(q.p);
        const a = arrow(V(0, -1, 0), q.f, C.yellow, 0.008); a.position.copy(q.p);
        const l = info(label(q.n, { height: 0.05 }), `${q.n} noktası`, q.i); l.position.copy(q.p).add(V(0.06, 0.05, 0));
        root.add(d, a, l);
      }
      const ak = arrow(V(0, -1, 0), K.f, C.yellow, 0.008), al = arrow(V(0, -1, 0), L.f, C.yellow, 0.008);
      const lk = info(label('K', { height: 0.05 }), 'K noktası', K.i), ll = info(label('L', { height: 0.05 }), 'L noktası', L.i);
      root.add(ak, al, lk, ll);
      return {
        root, update(t) {
          const p = loop(t, 8), y = 0.02 + ease(seg(p, 0.1, 0.9)) * 0.5;
          rocket.position.y = y;
          rocket.visible = p < 0.95;
          ak.position.set(0.3, y + 0.1, 0); ak.setLength(0.2 - (y - 0.02) * 0.16);
          lk.position.set(0.38, y + 0.15, 0);
          al.position.set(0.3, y + 0.42, 0); al.setLength(0.2 - (y + 0.4) * 0.16);
          ll.position.set(0.38, y + 0.47, 0);
          al.visible = ll.visible = ak.visible = lk.visible = p < 0.95;
        },
      };
    },
  },

  // #31 s.72 Dunya'nin sekli
  {
    mark: 31, page: 72, title: "Dünya'nın Şekli",
    info: "Dünya tam bir küre değildir; kutuplardan basık, Ekvator'dan şişkindir. Merkezden Ekvator'a uzaklık yaklaşık 6.378 km, kutba uzaklık ise yaklaşık 6.357 km'dir.",
    build() {
      const root = new THREE.Group();
      const e = info(planet('earth', 0.3, 64), 'Dünya', 'Kutuplardan basık, Ekvator’dan şişkindir (fark modelde abartılmıştır).');
      e.position.y = 0.45;
      root.add(e);
      const c = V(0, 0.45, 0);
      const req = arrow(V(1, 0, 0), 0.33, C.orange, 0.008); req.position.copy(c);
      const rpo = arrow(V(0, 1, 0), 0.27, C.orange, 0.008); rpo.position.copy(c);
      const l1 = info(label('6.378 km', { height: 0.05 }), 'Ekvator yarıçapı', 'Merkezden Ekvator’a uzaklık yaklaşık 6.378 km’dir.'); l1.position.set(0.25, 0.5, 0.15);
      const l2 = info(label('6.357 km', { height: 0.05 }), 'Kutup yarıçapı', 'Merkezden kutba uzaklık yaklaşık 6.357 km’dir.'); l2.position.set(-0.12, 0.85, 0.1);
      const eq = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.004, 6, 64), new THREE.MeshBasicMaterial({ color: 0xffeb3b })); eq.rotation.x = Math.PI / 2; eq.position.copy(c);
      const note = label('Basıklık abartılmıştır', { height: 0.035 }); note.position.set(0, 0.06, 0.2);
      root.add(req, rpo, l1, l2, eq, note);
      return {
        root, update(t) {
          const k = seg(loop(t, 6), 0.1, 0.5) * (1 - seg(loop(t, 6), 0.8, 1));
          e.scale.set(1 + k * 0.12, 1 - k * 0.1, 1 + k * 0.12);
          e.rotation.y = t * 0.3;
        },
      };
    },
  },

  // #32 s.72 Kutup noktalari ve Ekvator
  {
    mark: 32, page: 72, title: 'Kutup Noktaları ve Ekvator',
    info: "Dünya'nın en kuzey ve en güney noktaları kutup noktalarıdır. Bu iki noktaya eşit uzaklıktaki, Dünya'yı tam ortadan ikiye ayıran hayali çizgiye Ekvator denir. Ekvator Dünya'yı Kuzey ve Güney Yarım Küre olarak ikiye ayırır.",
    build() {
      const root = new THREE.Group();
      const c = V(0, 0.48, 0);
      const e = info(planet('earth', 0.28), 'Dünya', 'Kendi ekseni etrafında döner.'); e.position.copy(c);
      const north = new THREE.Mesh(new THREE.SphereGeometry(0.283, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x42a5f5, transparent: true, opacity: 0.18, depthWrite: false }));
      north.position.copy(c);
      const south = new THREE.Mesh(new THREE.SphereGeometry(0.283, 48, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffa726, transparent: true, opacity: 0.18, depthWrite: false }));
      south.position.copy(c);
      info(north, 'Kuzey Yarım Küre', 'Ekvator’un kuzeyinde kalan yarı. Türkiye Kuzey Yarım Küre’dedir.');
      info(south, 'Güney Yarım Küre', 'Ekvator’un güneyinde kalan yarı.');
      const eq = info(new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.006, 6, 64), new THREE.MeshBasicMaterial({ color: 0xffeb3b })), 'Ekvator', 'Dünya’yı iki eşit yarım küreye ayıran hayali çizgidir.');
      eq.rotation.x = Math.PI / 2; eq.position.copy(c);
      const axis = rod(V(0, 0.12, 0), V(0, 0.84, 0), 0.004, 0xffffff);
      const lN = info(label('Kuzey Kutup Noktası', { height: 0.04 }), 'Kuzey Kutup Noktası', 'Dünya’nın en kuzeydeki noktasıdır.'); lN.position.set(0, 0.9, 0);
      const lS = info(label('Güney Kutup Noktası', { height: 0.04 }), 'Güney Kutup Noktası', 'Dünya’nın en güneydeki noktasıdır.'); lS.position.set(0, 0.07, 0);
      const lE = label('Ekvator', { height: 0.04, bg: 'rgba(249,168,37,0.95)' }); lE.position.set(0.42, 0.48, 0);
      root.add(e, north, south, eq, axis, lN, lS, lE);
      return { root, update(t) { e.rotation.y = t * 0.4; } };
    },
  },

  // #33 s.73 Dag: A, B, C, D konumlari
  {
    mark: 33, page: 73, title: 'Ağırlık Konuma Göre Değişir',
    info: 'Ağırlık, cismin bulunduğu konuma göre değişir; çünkü cisme etki eden yer çekimi kuvveti değişir. Dağın tepesine (D) çıkıldıkça yer çekimi ve dolayısıyla ağırlık azalır; kütle ise değişmez.',
    build() {
      const root = new THREE.Group();
      const sea = box(1.1, 0.02, 0.6, 0x0288d1); sea.position.y = 0.01;
      const mtn = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.75, 7, 1), lambert(0x8d6e63)); mtn.position.set(0.1, 0.39, -0.05);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.17, 7), lambert(0xfafafa)); snow.position.set(0.1, 0.68, -0.05);
      root.add(sea, mtn, snow);
      const P = [['A', V(-0.25, 0.03, 0.1), 0.2], ['B', V(-0.08, 0.27, 0.1), 0.17], ['C', V(0.03, 0.47, 0.08), 0.14], ['D', V(0.1, 0.77, -0.05), 0.11]];
      const climber = info(box(0.05, 0.05, 0.05, 0xffb300), 'Cisim (5 kg)', 'Kütlesi her noktada aynıdır; ağırlığı yükseldikçe azalır.');
      const w = label('', { height: 0.045 });
      const ar = arrow(V(0, -1, 0), 0.2, C.yellow, 0.008);
      for (const [n, p, f] of P) {
        const l = info(label(n, { height: 0.05 }), `${n} noktası`, `Yükseklik arttıkça yer çekimi azalır. ${n} noktasındaki ağırlık okun boyuyla gösterilmiştir.`);
        l.position.copy(p).add(V(-0.07, 0.03, 0));
        const d = ball(0.012, C.red, 8); d.position.copy(p); root.add(l, d); void f;
      }
      root.add(climber, w, ar);
      return {
        root, update(t) {
          const q = (loop(t, 8) * 4) | 0, f = loop(t, 2);
          const [, p, len] = P[q], [, pn] = P[Math.min(3, q + 1)];
          const pos = p.clone().lerp(pn, seg(f, 0.6, 1));
          climber.position.copy(pos).add(V(0, 0.03, 0));
          ar.position.copy(pos).add(V(0.06, 0.03, 0)); ar.setLength(len);
          w.position.copy(pos).add(V(0.22, 0.05, 0));
          w.setText(`${P[q][0]}: ağırlık ${['en fazla', 'biraz az', 'daha az', 'en az'][q]}`);
        },
      };
    },
  },

  // #34 s.73 Kutuplarda ve Ekvator'da agirlik
  {
    mark: 34, page: 73, title: "Kutuplarda ve Ekvator'da Ağırlık",
    info: "Bir cismin ağırlığı kutuplarda Ekvator'a göre daha fazladır; çünkü kutuplar Dünya'nın merkezine daha yakındır ve yer çekimi kuvveti daha büyüktür. Cismin kütlesi ise her yerde aynıdır.",
    build() {
      const root = new THREE.Group();
      const c = V(0, 0.47, 0);
      const e = info(planet('earth', 0.27), 'Dünya', 'Kutuplardan basık olduğu için kutuplar merkeze daha yakındır.'); e.position.copy(c); e.scale.set(1.08, 0.94, 1.08);
      root.add(e);
      const P = [
        ['A', V(0, 1, 0), 0.2, 'Kuzey kutbu: merkeze yakın, ağırlık fazla.'],
        ['B', V(1, 0, 0), 0.13, 'Ekvator: merkeze uzak, ağırlık az.'],
        ['C', V(0, -1, 0), 0.2, 'Güney kutbu: merkeze yakın, ağırlık fazla.'],
        ['D', V(-1, 0, 0), 0.13, 'Ekvator: merkeze uzak, ağırlık az.'],
      ];
      const arrows = [];
      for (const [n, d, f, i] of P) {
        const r = d.y ? 0.27 * 0.94 : 0.27 * 1.08;
        const p = c.clone().addScaledVector(d, r + 0.01);
        const b = info(box(0.035, 0.035, 0.035, 0xffb300), `${n}: ${d.y ? 'Kutup' : 'Ekvator'}`, i); b.position.copy(p).addScaledVector(d, 0.02);
        b.lookAt(c.clone().applyMatrix4(root.matrixWorld));
        const a = arrow(d.clone().negate(), f, C.red, 0.007); a.position.copy(p).addScaledVector(d, 0.04 + f);
        const l = label(n, { height: 0.05 }); l.position.copy(p).addScaledVector(d, 0.1 + f);
        root.add(b, a, l); arrows.push(a);
      }
      const note = label('Kutuplarda ağırlık > Ekvator’da ağırlık', { height: 0.04 }); note.position.set(0, 0.04, 0.2);
      root.add(note);
      return { root, update(t) { e.rotation.y = t * 0.3; arrows.forEach((a, i) => { a.scale.setScalar(1 + 0.08 * Math.sin(t * 4 + i)); }); } };
    },
  },

  // #35 s.74 Dunya'da ve Ay'da agirlik
  {
    mark: 35, page: 74, title: "Dünya'da ve Ay'da Ağırlık",
    info: "Dünya, Ay'a göre cisimlere yaklaşık 6 kat daha fazla çekim kuvveti uygular. 60 kg kütleli bir cismin ağırlığı Dünya'da yaklaşık 600 N, Ay'da yaklaşık 100 N ölçülür. Kütle ise iki yerde de 60 kg'dır.",
    build() {
      const root = new THREE.Group();
      const g1 = floor('grass', 0.5, 0.4); g1.position.x = -0.28;
      const moonG = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.4), new THREE.MeshLambertMaterial({ map: planetTexture('moon') })); moonG.position.set(0.28, -0.01, 0);
      root.add(info(g1, 'Dünya yüzeyi', 'Yer çekimi Ay’dakinin yaklaşık 6 katıdır.'), info(moonG, 'Ay yüzeyi', 'Çekim kuvveti Dünya’dakinin yaklaşık altıda biridir.'));
      const scales = [-0.28, 0.28].map((x, i) => {
        root.add(stand(x, 0.85, 0.28));
        const s = hangingScale(x, 0.85, { len: 0.4, maxN: 12 });
        const cr = info(crate(0.12), 'Koli (60 kg)', i ? 'Ay’da ağırlığı yaklaşık 100 N.' : 'Dünya’da ağırlığı yaklaşık 600 N.');
        root.add(s.d, s.reading, cr);
        return { ...s, cr, x, max: i ? 100 : 600 };
      });
      const t1 = label('Dünya', { height: 0.05 }); t1.position.set(-0.28, 0.95, 0);
      const t2 = label('Ay', { height: 0.05 }); t2.position.set(0.28, 0.95, 0);
      const m = label('Kütle her yerde 60 kg', { height: 0.04, bg: 'rgba(216,67,21,0.95)' }); m.position.set(0, 0.04, 0.24);
      root.add(t1, t2, m);
      return {
        root, update(t) {
          const p = seg(loop(t, 6), 0.1, 0.5);
          for (const s of scales) {
            s.d.setForce((p * s.max) / 600 * 0.95);
            s.cr.position.set(s.x, s.d.position.y + s.d.hook.position.y - 0.08, 0);
            s.reading.setText(`${Math.round(p * s.max)} N`);
          }
        },
      };
    },
  },

  // #36 s.81 Hava direnci: duz ve buruşuk kagit
  {
    mark: 36, page: 81, title: 'Hava Direnci',
    info: 'Aynı kütledeki düz fon kartonu ile buruşturulmuş karton aynı yükseklikten bırakıldığında buruşuk olan yere daha çabuk ulaşır. Düz kartonun yüzeyi geniş olduğu için havanın direnci daha büyüktür.',
    build() {
      const root = new THREE.Group();
      const flat = info(box(0.22, 0.004, 0.3, 0xfff59d), 'Düz karton', 'Geniş yüzeyli olduğu için hava direnci büyüktür; yavaş düşer.');
      const crumpled = info(new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), lambert(0xfff59d, { flatShading: true })), 'Buruşuk karton', 'Yüzeyi küçüldüğü için hava direnci azdır; daha çabuk düşer.');
      const bottleG = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 24, 1, true), new THREE.MeshLambertMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      b.position.y = 0.2;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.36, 24), new THREE.MeshLambertMaterial({ color: 0x29b6f6, transparent: true, opacity: 0.45, depthWrite: false })); water.position.y = 0.18;
      const eraser = info(box(0.04, 0.02, 0.025, 0xeceff1), 'Silgi', 'Su da hareket eden cisimlere direnç uygular. Silgi suda havaya göre daha yavaş düşer.');
      bottleG.add(b, water, eraser); bottleG.position.set(0.42, 0, 0);
      info(water, 'Su direnci', 'Su, içinde hareket eden cisme hareket yönüne zıt bir direnç uygular.');
      const watch = label('', { height: 0.045 }); watch.position.set(-0.15, 0.95, 0);
      const ar1 = arrow(V(0, 1, 0), 0.12, C.blue, 0.007), ar2 = arrow(V(0, 1, 0), 0.04, C.blue, 0.007);
      root.add(flat, crumpled, bottleG, watch, ar1, ar2, floor('wood', 0.7, 0.4));
      const lab = label('Hava direnci', { height: 0.035, bg: 'rgba(21,101,192,0.95)' }); lab.position.set(-0.35, 0.5, 0.15); root.add(lab);
      return {
        root, update(t) {
          const p = loop(t, 5), T = p * 5;
          const yc = Math.max(0.06, 0.85 - 0.5 * 1.2 * T * T);
          const yf = Math.max(0.01, 0.85 - 0.25 * T);
          crumpled.position.set(-0.05, yc, 0); crumpled.rotation.set(T * 2, T, 0);
          flat.position.set(-0.32, yf, 0); flat.rotation.set(Math.sin(T * 4) * 0.25, 0, Math.cos(T * 3) * 0.2);
          ar1.position.set(-0.32, yf + 0.01, 0); ar1.visible = yf > 0.02;
          ar2.position.set(-0.05, yc + 0.06, 0); ar2.visible = yc > 0.07;
          eraser.position.y = Math.max(0.03, 0.38 - 0.08 * T);
          watch.setText(`Süre: ${T.toFixed(1)} s`);
        },
      };
    },
  },

  // #37 s.83 Hali ve mermer yuzey
  {
    mark: 37, page: 83, title: 'Halı ve Mermer Yüzey',
    info: 'Halı yüzey üzerinde zor hareket ettirilen bir masa, mermer yüzey üzerinde daha kolay hareket ettirilir. Hareketi zorlaştıran kuvvet sürtünme kuvvetidir; pürüzlü yüzeylerde daha büyüktür.',
    build() { return pushScene('carpet', 'marble', 'Halı yüzey', 'Mermer yüzey', 'Pürüzlü yüzey: sürtünme fazla, masa az kayar.', 'Pürüzsüz yüzey: sürtünme az, masa daha çok kayar.'); },
  },

  // #38 s.85 Cilali ve cilasiz tahta
  {
    mark: 38, page: 85, title: 'Cilalı ve Cilasız Tahta',
    info: 'Tahta yüzeyleri cilalamak yüzeyin pürüzlülüğünü ve sürtünme kuvvetini azaltır. Aynı masa, cilalanmış tahta zeminde cilasız zemine göre daha kolay hareket eder.',
    build() { return pushScene('wood', 'polished', 'Cilasız tahta', 'Cilalı tahta', 'Pürüzlü yüzey; sürtünme kuvveti büyük.', 'Cila pürüzleri azaltır; sürtünme kuvveti küçük.'); },
  },

  // #39 s.86 Cam, K ve L yuzeyleri
  {
    mark: 39, page: 86, title: 'Farklı Yüzeylerde Sürtünme',
    info: 'Aynı cisim cam, K ve L yüzeylerinde özdeş dinamometrelerle çekilmiştir. Dinamometrenin gösterdiği değer ne kadar büyükse o yüzeydeki sürtünme kuvveti o kadar büyüktür. En pürüzsüz yüzey olan camda sürtünme en azdır.',
    build() {
      const root = new THREE.Group();
      const lanes = [['glass', 'Cam yüzey', 2], ['marble', 'K yüzeyi', 4], ['wood', 'L yüzeyi', 6]].map(([k, n, f], i) => {
        const z = (i - 1) * 0.26;
        const fl = info(floor(k, 0.9, 0.2), n, `Bu yüzeyde cismi sabit hızla çekmek için ${f} N kuvvet gerekir.`); fl.position.z = z;
        const blk = info(crate(0.09, 0x6d4c41), 'Cisim', 'Üç yüzeyde de aynı cisim kullanılmıştır.');
        const d = dynamometer({ len: 0.3, maxN: 10, r: 0.035 }); d.rotation.z = -Math.PI / 2;
        const rd = label('', { height: 0.04, bg: 'rgba(21,101,192,0.95)' });
        const nm = label(n, { height: 0.04 }); nm.position.set(-0.52, 0.06, z);
        root.add(fl, blk, d, rd, nm);
        return { z, blk, d, rd, f };
      });
      return {
        root, update(t) {
          const p = loop(t, 6), x = -0.35 + seg(p, 0.1, 0.9) * 0.3;
          for (const L of lanes) {
            L.blk.position.set(x, 0.045, L.z);
            L.d.setForce(seg(p, 0.05, 0.15) * L.f / 10);
            L.d.position.set(x + 0.06 - L.d.hook.position.y + 0.03, 0.05, L.z);
            L.rd.position.set(x + 0.25, 0.14, L.z);
            L.rd.setText(`${Math.round(seg(p, 0.05, 0.15) * L.f)} N`);
          }
        },
      };
    },
  },

  // #40 s.87 Surtunmenin olumlu etkileri
  {
    mark: 40, page: 87, title: 'Sürtünmenin Olumlu Etkileri',
    info: 'Ahşap sanatçısının oyma spatulasıyla ahşaba şekil verebilmesi, ressamın fırçayla tuvale resim yapabilmesi sürtünme kuvveti sayesindedir.',
    build() {
      const root = new THREE.Group();
      const wood = info(box(0.4, 0.06, 0.25, 0xa1887f), 'Ahşap', 'Spatula ile ahşap arasındaki sürtünme sayesinde ahşap oyulur.');
      wood.position.set(-0.28, 0.03, 0);
      const tool = new THREE.Group();
      const blade = box(0.025, 0.05, 0.004, 0xb0bec5); blade.position.y = -0.1;
      tool.add(cyl(0.012, 0.012, 0.15, 0x5d4037, 8), blade);
      tool.rotation.z = 0.7;
      const chips = particles(80, 0xd7ccc8, 0.02);
      const canvas = info(box(0.32, 0.24, 0.015, 0xfafafa), 'Tuval', 'Fırça ile tuval arasındaki sürtünme sayesinde boya tuvale geçer.');
      canvas.position.set(0.3, 0.2, 0); canvas.rotation.x = -0.2;
      const easel = rod(V(0.3, 0, -0.1), V(0.3, 0.35, -0.03), 0.008, 0x6d4c41);
      const brush = new THREE.Group();
      const tip = cyl(0.01, 0.003, 0.03, 0x1565c0, 8); tip.position.y = -0.085;
      brush.add(cyl(0.006, 0.006, 0.14, 0x8d6e63, 8), tip);
      const strokes = new THREE.Group(); canvas.add(strokes);
      const groove = new THREE.Group(); wood.add(groove);
      root.add(wood, tool, chips, canvas, easel, brush);
      const l1 = label('Oyma', { height: 0.04 }); l1.position.set(-0.28, 0.25, 0);
      const l2 = label('Resim', { height: 0.04 }); l2.position.set(0.3, 0.4, 0);
      root.add(l1, l2);
      const rnd = rng(40);
      let last = -1;
      return {
        root, update(t, dt) {
          const p = loop(t, 6), x = -0.45 + p * 0.34;
          tool.position.set(x, 0.12, 0.02);
          if (rnd() < 0.6) chips.emit(V(x + 0.04, 0.07, 0.02), V(0.1 + rnd() * 0.2, 0.2 + rnd() * 0.2, (rnd() - 0.5) * 0.2));
          chips.update(dt);
          const bx = -0.13 + p * 0.26, by = Math.sin(p * Math.PI * 3) * 0.06;
          brush.position.set(0.3 + bx, 0.2 + by, 0.07);
          brush.rotation.z = -0.4;
          const step = Math.floor(p * 40);
          if (step !== last) {
            last = step;
            if (step === 0) { strokes.clear(); groove.clear(); }
            const dab = new THREE.Mesh(new THREE.CircleGeometry(0.015, 10), new THREE.MeshBasicMaterial({ color: 0x1e88e5 }));
            dab.position.set(bx, by - 0.02, 0.009); strokes.add(dab);
            const g = box(0.012, 0.01, 0.02, 0x6d4c41); g.position.set(x + 0.28 - 0.04, 0.03, 0.02); groove.add(g);
          }
        },
      };
    },
  },

  // #41 s.87 Surtunmenin olumsuz etkileri (asinma)
  {
    mark: 41, page: 87, title: 'Sürtünmenin Olumsuz Etkileri',
    info: 'Gitar yüzeyinin zamanla eskimesi, makine parçalarının aşınması ve sık açılıp kapanan kitabın yıpranması sürtünmenin olumsuz etkileridir. Birbirine temas eden yüzeyler sürtünerek aşınır.',
    build() {
      const root = new THREE.Group();
      const gear = (r, n, color) => {
        const g = new THREE.Group();
        g.add(cyl(r, r, 0.04, color, 32));
        for (let i = 0; i < n; i++) { const tooth = box(0.03, 0.04, r * 0.35, color); const a = (i / n) * Math.PI * 2; tooth.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); tooth.rotation.y = a; g.add(tooth); }
        g.rotation.x = Math.PI / 2;
        return g;
      };
      const g1 = gear(0.14, 12, 0x78909c), g2 = gear(0.09, 8, 0x90a4ae);
      g1.position.set(-0.1, 0.35, 0); g2.position.set(0.15, 0.35, 0);
      info(g1.children[0], 'Dişli çark', 'Birbirine sürtünen dişliler zamanla aşınır. Yağlama aşınmayı azaltır.');
      info(g2.children[0], 'Dişli çark', 'Sürtünme ısı açığa çıkarır ve parçaları yıpratır.');
      const sparks = particles(100, 0xffb300, 0.015);
      const book = new THREE.Group();
      const cover = info(box(0.2, 0.012, 0.27, 0x6d4c41), 'Yıpranmış kitap', 'Çok sık açılıp kapanan kitabın kapağı ve sayfaları sürtünmeyle yıpranır.');
      const pages = box(0.19, 0.04, 0.26, 0xfff8e1); pages.position.y = 0.025;
      const cover2 = box(0.2, 0.012, 0.27, 0x6d4c41); cover2.position.y = 0.05;
      const hinge = new THREE.Group(); hinge.position.set(-0.1, 0.05, 0); hinge.add(cover2); cover2.position.set(0.1, 0, 0);
      book.add(cover, pages, hinge); book.position.set(0.3, 0.01, 0.25);
      const wear = label('Aşınma', { height: 0.04, bg: 'rgba(198,40,40,0.9)' }); wear.position.set(0.03, 0.55, 0);
      root.add(g1, g2, sparks, book, wear);
      const rnd = rng(41);
      return {
        root, update(t, dt) {
          g1.rotation.y = t; g2.rotation.y = -t * 1.5 + 0.2;
          if (rnd() < 0.5) sparks.emit(V(0.06, 0.35, 0.03), V((rnd() - 0.5) * 0.3, rnd() * 0.3, 0.2 + rnd() * 0.2));
          sparks.update(dt);
          hinge.rotation.z = (0.5 - 0.5 * Math.cos(t * 2)) * 2.4;
        },
      };
    },
  },

  // #42 s.87 Surtunmeyi artirma ve azaltma
  {
    mark: 42, page: 87, title: 'Sürtünmeyi Artırmak ve Azaltmak',
    info: 'Karlı ve buzlu zeminde lastiğe zincir takılması sürtünmeyi artırır; aracın kaymasını önler. Kapı menteşesinin yağlanması ise sürtünmeyi azaltır; kapı kolay açılır ve gıcırdamaz.',
    build() {
      const root = new THREE.Group();
      const snow = info(floor('snow', 0.6, 0.35), 'Karlı zemin', 'Kaygan zeminde sürtünme azdır; tekerlek kayar.'); snow.position.x = -0.25;
      const wheel = (chains) => {
        const g = new THREE.Group();
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 12, 32), lambert(0x212121));
        const rim = cyl(0.06, 0.06, 0.05, 0x9e9e9e, 20); rim.rotation.x = Math.PI / 2;
        g.add(tire, rim);
        if (chains) for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 4, 12), lambert(0xb0bec5)); const a = (i / 10) * Math.PI * 2; c.position.set(Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0); c.rotation.y = Math.PI / 2; c.rotation.x = a; g.add(c); }
        return g;
      };
      const w1 = wheel(false), w2 = wheel(true);
      info(w1.children[0], 'Zincirsiz lastik', 'Karda yerinde patinaj yapar.');
      info(w2.children[0], 'Zincirli lastik', 'Zincir sürtünmeyi artırır; araç kaymadan ilerler.');
      const l1 = label('Zincirsiz', { height: 0.035 }), l2 = label('Zincirli', { height: 0.035 });
      const door = new THREE.Group(); door.position.set(0.25, 0, -0.05);
      const frame = box(0.03, 0.4, 0.03, 0x5d4037); frame.position.set(0, 0.2, 0);
      const leafP = new THREE.Group(); leafP.position.set(0.015, 0, 0);
      const leaf = info(box(0.22, 0.38, 0.02, 0x8d6e63), 'Kapı', 'Menteşe yağlanınca sürtünme azalır ve kapı kolayca açılır.'); leaf.position.set(0.11, 0.2, 0); leafP.add(leaf);
      const hingeM = info(cyl(0.012, 0.012, 0.05, 0xffd54f, 10), 'Menteşe', 'Yağ, birbirine sürtünen yüzeyler arasında ince bir tabaka oluşturarak sürtünmeyi azaltır.'); hingeM.position.set(0.015, 0.3, 0.012);
      const oil = new THREE.Group();
      const can = cyl(0.03, 0.035, 0.07, 0xd32f2f, 14); can.rotation.z = 1.2;
      const spout = rod(V(0, 0, 0), V(-0.07, 0.03, 0), 0.004, 0x9e9e9e);
      oil.add(can, spout); oil.position.set(0.1, 0.33, 0.06);
      const drops = particles(40, 0xffc107, 0.012);
      door.add(frame, leafP, hingeM, oil, drops);
      root.add(snow, w1, w2, l1, l2, door);
      const rnd = rng(42);
      return {
        root, update(t, dt) {
          const p = loop(t, 6);
          w1.position.set(-0.4, 0.115, -0.08); w1.rotation.z = -t * 8;
          w2.position.set(-0.4 + p * 0.35, 0.115, 0.08); w2.rotation.z = -p * 0.35 / 0.115;
          l1.position.set(-0.4, 0.27, -0.08); l2.position.copy(w2.position).add(V(0, 0.16, 0));
          if (rnd() < 0.3) drops.emit(V(0.03, 0.33, 0.03), V(-0.05, -0.1, 0)); drops.update(dt);
          leafP.rotation.y = -(0.5 - 0.5 * Math.cos(t * 1.5)) * 1.3;
        },
      };
    },
  },

  // #43 s.88 Hava ve su direncini azaltan sekiller
  {
    mark: 43, page: 88, title: 'Direnci Azaltan Şekiller',
    info: 'Otomobil, hızlı tren, savaş uçağı, gemi ve denizaltı gibi araçlar sivri ve akıcı (aerodinamik) şekilde tasarlanır. Böylece hava ve su direnci azalır, araçlar daha hızlı ve az yakıtla hareket eder.',
    build() {
      const root = new THREE.Group();
      const items = [
        ['car', 'Otomobil', 'Hava direncini azaltmak için akıcı şekilde tasarlanır.', -0.3, 0.12, 0.15],
        ['jet', 'Millî Muharip Uçak (KAAN)', 'Sivri burnu ve ince gövdesi hava direncini azaltır.', 0.25, 0.45, 0],
        ['train', 'Hızlı tren', 'Sivri ön kısım yüksek hızda hava direncini azaltır.', -0.25, 0.4, -0.15],
        ['ship', 'Gemi', 'Gövdesinin ön kısmı suyu yararak su direncini azaltır.', 0.3, 0.06, 0.2],
        ['submarine', 'Denizaltı', 'Puro şeklindeki gövdesi su altında direnci azaltır.', 0.3, 0.2, -0.2],
      ];
      const water = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), new THREE.MeshLambertMaterial({ color: 0x0288d1, transparent: true, opacity: 0.35, depthWrite: false }));
      water.position.set(0.3, 0.05, 0);
      root.add(info(water, 'Su', 'Su, içinde hareket eden cisimlere direnç uygular.'));
      const flows = [];
      for (const [k, n, i, x, y, z] of items) {
        const v = vehicle(k); v.position.set(x, y, z);
        v.children.forEach((c) => info(c, n, i));
        root.add(v);
        for (let s = -1; s <= 1; s += 2) {
          const pts = [];
          for (let q = 0; q <= 20; q++) { const u = q / 20 - 0.5; pts.push(V(x - u * 0.4, y + s * (0.05 + 0.03 * Math.cos(u * Math.PI) ** 2) * 0.9, z)); }
          const l = line(pts, 0xffffff, true); root.add(l); flows.push(l);
        }
      }
      return { root, update(t) { flows.forEach((l) => { l.material.dashOffset = -t * 0.2; }); } };
    },
  },

  // #44 s.88 Parasut ve flap
  {
    mark: 44, page: 88, title: 'Hava Direncini Artırmak',
    info: 'Bazen hava direncinin artırılması istenir. Paraşütçü paraşütünü açtığında hava direnci artar ve yere güvenle iner. Uçaklar iniş sırasında kanatlarındaki flapları açarak hava direncini artırır ve yavaşlar.',
    build() {
      const root = new THREE.Group();
      const chute = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), lambert(0x43a047, { side: THREE.DoubleSide }));
      info(chute, 'Paraşüt', 'Geniş yüzeyi sayesinde hava direnci artar; düşüş yavaşlar.');
      const person = human({ h: 0.14, shirt: 0x37474f, pants: 0x37474f });
      const lines = new THREE.Group();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; lines.add(line([V(Math.cos(a) * 0.15, 0.03, Math.sin(a) * 0.15), V(0, -0.17, 0)], 0xffffff)); }
      const jumper = new THREE.Group(); jumper.add(chute, lines, person); person.position.y = -0.31;
      const plane = vehicle('jet'); plane.scale.setScalar(1.4); plane.position.set(0.25, 0.3, 0);
      const flap = info(box(0.08, 0.008, 0.2, 0xff7043), 'Flap', 'İnişte açılan flaplar kanat yüzeyini büyütür; hava direnci artar, uçak yavaşlar.');
      flap.position.set(-0.05, -0.01, 0); plane.add(flap);
      const air = [];
      for (let i = 0; i < 5; i++) { const a = arrow(V(0, 1, 0), 0.08, 0x81d4fa, 0.005); jumper.add(a); a.position.set((i - 2) * 0.06, 0.06, 0); air.push(a); }
      const l = label('Hava direnci ↑', { height: 0.04, bg: 'rgba(2,119,189,0.95)' }); l.position.set(-0.25, 0.95, 0);
      root.add(jumper, plane, l, floor('grass', 1, 0.4));
      return {
        root, update(t) {
          const p = loop(t, 8);
          jumper.position.set(-0.25, 0.85 - p * 0.45, 0);
          jumper.rotation.z = Math.sin(t * 1.5) * 0.08;
          flap.rotation.z = seg(loop(t, 4), 0.2, 0.5) * 0.7 * (1 - seg(loop(t, 4), 0.8, 1));
          plane.position.y = 0.32 + Math.sin(t) * 0.02;
          air.forEach((a, i) => { a.position.y = 0.06 + ((t * 0.3 + i * 0.2) % 0.3) - 0.35; });
        },
      };
    },
  },
];

/** Masa itme sahnesi: iki yuzeyde ayni itmeyle farkli kayma mesafesi. */
function pushScene(k1, k2, n1, n2, i1, i2) {
  const root = new THREE.Group();
  const lanes = [[k1, n1, i1, -0.16, 0.3], [k2, n2, i2, 0.16, 0.75]].map(([k, n, i, z, slide]) => {
    const f = info(floor(k, 1.05, 0.28), n, i); f.position.z = z;
    const tb = table(0.22, 0.14, 0.14, 0x5d4037);
    tb.children.forEach((c) => info(c, 'Masa', 'Aynı masaya aynı kuvvet uygulanmıştır.'));
    const kid = human({ h: 0.26, shirt: 0x43a047, pants: 0x455a64 });
    kid.rotation.y = Math.PI / 2;
    const lb = label(n, { height: 0.04 }); lb.position.set(-0.45, 0.32, z);
    const fr = arrow(V(-1, 0, 0), 0.1, C.red, 0.006);
    root.add(f, tb, kid, lb, fr);
    return { z, slide, tb, kid, fr };
  });
  const fl = label('Sürtünme kuvveti', { height: 0.035, bg: 'rgba(198,40,40,0.9)' }); fl.position.set(0.1, 0.4, 0); root.add(fl);
  return {
    root, update(t) {
      const p = loop(t, 6);
      for (const L of lanes) {
        const push = seg(p, 0.1, 0.4), coast = seg(p, 0.4, 0.75);
        const x = -0.25 + push * 0.2 + coast * (L.slide - 0.2) * 0.7;
        L.tb.position.set(x, 0, L.z);
        const kx = Math.min(x - 0.17, -0.25 + push * 0.2 - 0.17);
        L.kid.position.set(kx, 0, L.z);
        L.kid.joints.spine.rotation.x = 0.4;
        L.kid.joints.lShoulder.rotation.x = L.kid.joints.rShoulder.rotation.x = -1.3;
        L.kid.joints.lHip.rotation.x = Math.sin(t * 8) * 0.4 * (p < 0.4 ? 1 : 0);
        L.kid.joints.rHip.rotation.x = -Math.sin(t * 8) * 0.4 * (p < 0.4 ? 1 : 0);
        L.fr.position.set(x - 0.08, 0.02, L.z + 0.1);
        L.fr.setLength(L.slide < 0.5 ? 0.12 : 0.05);
        L.fr.visible = p > 0.1 && p < 0.75;
      }
    },
  };
}
