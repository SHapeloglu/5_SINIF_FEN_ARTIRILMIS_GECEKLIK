// 1. Unite: Gokyuzundeki Komsularimiz ve Biz
import {
  THREE, C, info, label, callout, line, box, cyl, ball, rod, arrow, spinArrow, orbit, stars, planet, sun, glow,
  planetTexture, sunlitMaterial, phaseMoon, phaseName, cutSphere, terrain, human, vehicle, particles, loop, seg, rng,
} from '../lib.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const EARTH_LAYERS = [
  { title: 'İç çekirdek', r0: 0, r1: 0.2, inner: [1, 0.97, 0.88], outer: [0.98, 0.86, 0.62],
    info: "Dünya'nın merkezindeki en sıcak katmandır. Çok yüksek basınç nedeniyle katı hâldedir; demir ve nikelden oluşur." },
  { title: 'Dış çekirdek', r0: 0.2, r1: 0.55, inner: [1, 0.86, 0.3], outer: [1, 0.58, 0.1],
    info: 'Mantonun altındadır. Çok sıcaktır ve sıvı hâldedir. Büyük ölçüde demir ve nikelden oluşur.' },
  { title: 'Manto', r0: 0.55, r1: 0.91, inner: [0.98, 0.45, 0.08], outer: [0.72, 0.16, 0.05],
    info: 'Yer kabuğunun altındaki en kalın katmandır. Sıcaklığı çok yüksektir; bazı bölümlerinde erimiş kayaçlar (magma) bulunur.' },
  { title: 'Yer kabuğu', r0: 0.91, r1: 1, inner: [0.55, 0.32, 0.16], outer: [0.38, 0.21, 0.11],
    info: "Dünya'nın en dış ve en ince katmanıdır. Üzerinde yaşadığımız karalar ve okyanus tabanları bu katmandadır. Katı hâldedir." },
];

const SUN_LAYERS = [
  { title: 'Çekirdek', r0: 0, r1: 0.25, inner: [1, 1, 0.85], outer: [1, 0.95, 0.5], emissive: true,
    info: "Güneş'in merkezidir. Enerji burada üretilir; sıcaklığı milyonlarca derecedir." },
  { title: 'Işınım katmanı', r0: 0.25, r1: 0.7, inner: [1, 0.85, 0.3], outer: [1, 0.65, 0.1], emissive: true,
    info: 'Çekirdekte üretilen enerji bu katmandan ışınım yoluyla dışarı doğru iletilir.' },
  { title: 'Konveksiyon katmanı', r0: 0.7, r1: 0.96, inner: [1, 0.55, 0.05], outer: [0.95, 0.35, 0.02], emissive: true,
    info: 'Bu katmanda sıcak gazlar yükselip soğuyunca alçalır; enerji böylece yüzeye taşınır.' },
  { title: 'Fotosfer', r0: 0.96, r1: 1, inner: [1, 0.75, 0.2], outer: [1, 0.85, 0.35], emissive: true,
    info: "Güneş'in görünen yüzeyidir. Işık bu katmandan uzaya yayılır." },
];

/** Gunes isigi alan bir Ay/Dunya: mesh + sunPos (dunya koordinatinda, her karede guncellenmeli). */
function litBody(kind, r, sunPos) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 40, 20), sunlitMaterial(planetTexture(kind), sunPos));
}

export default [
  // #1 s.18 Dunya'nin katmanlari
  {
    mark: 1, page: 18, title: "Dünya'nın Katmanları",
    info: "Dünya iç içe katmanlardan oluşur: yer kabuğu, manto, dış çekirdek ve iç çekirdek. Model ölçekli değildir; yer kabuğu görünsün diye kalın çizilmiştir.",
    build() {
      const root = new THREE.Group();
      const e = cutSphere(EARTH_LAYERS, new THREE.MeshLambertMaterial({ map: planetTexture('earth') }));
      e.scale.setScalar(0.45);
      e.position.y = 0.55;
      root.add(e);
      return { root };
    },
  },

  // #2 s.21 Gunes'in katmanlari
  {
    mark: 2, page: 21, title: "Güneş'in Katmanları",
    info: 'Güneş de Dünya gibi küreye benzer ve katmanlardan oluşur. Enerji çekirdekte üretilir, katmanlar boyunca yüzeye taşınır ve ışık olarak yayılır.',
    build() {
      const root = new THREE.Group();
      const s = cutSphere(SUN_LAYERS, new THREE.MeshBasicMaterial({ map: planetTexture('sun') }));
      s.scale.setScalar(0.45);
      s.position.y = 0.55;
      const halo = glow(1.5);
      halo.position.y = 0.55;
      const corona = info(label('Korona', { height: 0.05, dot: '#ffe082' }), 'Korona', "Güneş'in en dış tabakasıdır; Güneş tutulmasında taç gibi görünür.");
      corona.position.set(-0.45, 1.0, 0);
      root.add(halo, s, corona);
      return { root, update(t) { s.children[0].rotation.y = t * 0.1; } };
    },
  },

  // #3 s.23 Uzaklik ve gorunen buyukluk (top etkinligi)
  {
    mark: 3, page: 23, title: 'Uzaktaki Cisim Küçük Görünür',
    info: "Yakındaki küçük top ile uzaktaki büyük top aynı büyüklükte görünebilir. Güneş, Dünya'dan çok büyüktür ama çok uzakta olduğu için gökyüzünde küçük görünür.",
    build() {
      const root = new THREE.Group();
      const eye = info(ball(0.04, 0x1e88e5), 'Gözlemci', 'Gözlem noktası. Görüş çizgileri iki topun da aynı açıyla görüldüğünü gösterir.');
      eye.position.set(-0.6, 0.35, 0);
      const small = info(ball(0.039, 0xc0ca33, 24), 'Küçük top (Ay gibi)', 'Gözlemciye yakın olduğu için büyük görünür.');
      small.position.set(-0.35, 0.35, 0);
      const big = info(ball(0.17, 0xfafafa, 32), 'Büyük top (Güneş gibi)', 'Çok daha büyük olmasına rağmen uzakta olduğu için küçük topla aynı büyüklükte görünür.');
      big.position.set(0.5, 0.35, 0);
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.171, 0.012, 6, 40), new THREE.MeshLambertMaterial({ color: 0x1565c0 }));
      big.add(stripe);
      // Goz -> buyuk topun ust/alt kenari; ayni cizgiler kucuk topa da tam teget gecer
      const lines = new THREE.Group();
      for (const sgn of [-1, 1]) lines.add(line([eye.position, V(0.5, 0.35 + sgn * 0.17, 0)], 0xffeb3b, true));
      const lbl = label('Aynı büyüklükte görünür!', { height: 0.06 });
      lbl.position.set(0, 0.7, 0);
      const sunL = label('Güneş\nDünya’dan 109 kat büyük', { height: 0.05, bg: 'rgba(242,140,31,0.9)' });
      sunL.position.set(0.5, 0.65, 0);
      root.add(eye, small, big, lines, lbl, sunL);
      return { root, update(t) { lines.children.forEach((l) => { l.material.opacity = 0.5 + 0.5 * Math.sin(t * 3); l.material.transparent = true; }); } };
    },
  },

  // #4 s.24 Parker uzay araci
  {
    mark: 4, page: 24, title: 'Parker Uzay Aracı',
    info: "Güneş bir yıldızdır ve Dünya'ya en yakın yıldızdır. Parker uzay aracı Güneş'i yakından incelemek için gönderilmiştir; ısı kalkanı sayesinde yüksek sıcaklığa dayanır.",
    build() {
      const root = new THREE.Group();
      const s = sun(0.2); s.position.y = 0.4; root.add(s);
      info(s.body, 'Güneş', 'Çevresine ısı ve ışık yayan bir yıldızdır.');
      const probe = new THREE.Group();
      const shield = info(cyl(0.07, 0.07, 0.012, 0xeceff1, 24), 'Isı kalkanı', 'Aracı Güneş’in yüksek sıcaklığından korur.');
      shield.rotation.z = Math.PI / 2;
      const bodyP = box(0.04, 0.05, 0.05, 0x455a64); bodyP.position.x = 0.04;
      const ant = rod(V(0.06, 0, 0), V(0.16, 0.03, 0), 0.003, 0x90a4ae);
      const panel = box(0.005, 0.06, 0.03, 0x1a237e); panel.position.set(0.05, 0.05, 0);
      probe.add(shield, info(bodyP, 'Parker uzay aracı', 'Güneş’e en çok yaklaşan uzay aracıdır.'), ant, panel);
      const path = orbit(0.62, 0x80deea, true, 0.32); path.position.set(0.3, 0.4, 0);
      root.add(path, probe);
      return {
        root, update(t) {
          const a = t * 0.6;
          probe.position.set(0.3 + Math.cos(a) * 0.62, 0.4, Math.sin(a) * 0.32);
          probe.lookAt(root.localToWorld(V(0, 0.4, 0)));
          probe.rotateY(Math.PI / 2);
          s.body.rotation.y = t * 0.2;
        },
      };
    },
  },

  // #5 s.24 Galileo ve Gunes lekeleri
  {
    mark: 5, page: 24, title: 'Galileo ve Güneş Lekeleri',
    info: "Galileo, Güneş lekelerinin zamanla aynı yöne kaydığını gözlemledi. Böylece Güneş'in kendi ekseni etrafında döndüğünü ispatladı.",
    build() {
      const root = new THREE.Group();
      const s = sun(0.22); s.position.set(0.25, 0.55, 0); root.add(s);
      info(s.body, 'Güneş', 'Kendi ekseni etrafında döner. Lekeler bu dönme ile birlikte kayar.');
      const rnd = rng(5);
      for (let i = 0; i < 6; i++) {
        const sp = info(ball(0.018 + rnd() * 0.012, 0x3e2723, 10), 'Güneş lekesi', "Güneş yüzeyinde daha soğuk olduğu için koyu görünen bölgelerdir. Lekelerin kayması Güneş'in döndüğünü gösterir.");
        const a = i * 0.5, lat = (rnd() - 0.5) * 0.8;
        sp.position.set(Math.cos(a) * Math.cos(lat) * 0.215, Math.sin(lat) * 0.215, Math.sin(a) * Math.cos(lat) * 0.215);
        sp.scale.y = 0.4;
        sp.lookAt(0, 0, 0);
        s.body.add(sp);
      }
      const spin = spinArrow(0.3); spin.position.set(0.25, 0.55, 0); root.add(spin);
      const tele = new THREE.Group();
      const tube = info(cyl(0.025, 0.035, 0.3, 0x8d6e63), 'Teleskop', 'Galileo gökyüzünü gözlemlemek için teleskop kullanmıştır. Güneş’e asla çıplak gözle veya teleskopla bakılmamalıdır!');
      tube.rotation.z = -1.0; tube.position.set(0, 0.25, 0);
      for (const a of [0, 2.1, 4.2]) tele.add(rod(V(0, 0.18, 0), V(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08), 0.006, 0x5d4037));
      tele.add(tube);
      tele.position.set(-0.45, 0, 0.1);
      const warn = label('Güneş’e asla doğrudan bakma!', { height: 0.045, bg: 'rgba(198,40,40,0.9)' });
      warn.position.set(-0.4, 0.5, 0.1);
      root.add(tele, warn);
      return { root, update(t) { s.body.rotation.y = t * 0.25; } };
    },
  },

  // #7 s.32 Dunya ile Ay arasindaki uzaklik
  {
    mark: 7, page: 32, title: 'Dünya ile Ay Arasındaki Uzaklık',
    info: "Ay, Dünya'ya en yakın gök cismidir. Aralarındaki uzaklık yaklaşık 384.400 km'dir; bu, yan yana yaklaşık 30 Dünya sığacak kadar uzun bir mesafedir.",
    build() {
      const root = new THREE.Group();
      const earth = info(planet('earth', 0.16), 'Dünya', 'Çapı yaklaşık 12.700 km’dir.');
      earth.position.set(-0.4, 0.35, 0);
      const moon = info(planet('moon', 0.045), 'Ay', "Çapı Dünya'nın yaklaşık dörtte biridir.");
      moon.position.set(0.45, 0.35, 0);
      const arr1 = arrow(V(1, 0, 0), 0.6, C.orange, 0.006), arr2 = arrow(V(-1, 0, 0), 0.6, C.orange, 0.006);
      const dist = label('384.400 km', { height: 0.06, bg: 'rgba(242,140,31,0.95)' });
      dist.position.set(0, 0.47, 0);
      const mini = new THREE.Group(); // yan yana 30 kucuk Dunya
      for (let i = 0; i < 30; i++) { const e = ball(0.0135, 0x1e88e5, 10); e.position.x = -0.39 + i * 0.0275 + 0.03; mini.add(e); }
      mini.position.y = 0.2;
      const miniL = label('≈ 30 Dünya yan yana', { height: 0.04 }); miniL.position.set(0, 0.13, 0);
      root.add(earth, moon, arr1, arr2, dist, mini, miniL);
      return {
        root, update(t) {
          earth.rotation.y = t * 0.5;
          const p = loop(t, 6);
          mini.children.forEach((m, i) => { m.visible = i / 30 < seg(p, 0.1, 0.8) + 0.001; });
          arr1.position.set(-0.22, 0.35, 0); arr1.setLength(0.62);
          arr2.position.set(0.4, 0.35, 0); arr2.setLength(0.62);
        },
      };
    },
  },

  // #8 s.32 Ay Dunya'nin dogal uydusudur
  {
    mark: 8, page: 32, title: "Ay, Dünya'nın Doğal Uydusu",
    info: "Ay, Dünya'nın etrafında belirli bir yörüngede dolanır. Ay ışık kaynağı değildir; Güneş'ten gelen ışığı yansıttığı için parlak görünür.",
    build() {
      const root = new THREE.Group();
      const sunPos = new THREE.Vector3();
      const s = sun(0.08); s.position.set(-0.6, 0.6, -0.1); root.add(s);
      info(s.body, 'Güneş', 'Işık kaynağıdır. Ay ve Dünya’nın Güneş’e bakan yarısı aydınlıktır.');
      const earth = info(litBody('earth', 0.17, sunPos), 'Dünya', 'Kendi ekseni etrafında döner.');
      earth.position.y = 0.4;
      const moon = info(litBody('moon', 0.05, sunPos), 'Ay', 'Işık kaynağı değildir; Güneş ışığını yansıtır. Dünya’nın tek doğal uydusudur.');
      const path = orbit(0.42, 0xffffff, true); path.position.y = 0.4;
      const st = stars(200, 0.9);
      root.add(st, earth, path, moon);
      return {
        root, update(t) {
          s.body.getWorldPosition(sunPos);
          earth.rotation.y = t * 0.6;
          const a = t * 0.35;
          moon.position.set(Math.cos(a) * 0.42, 0.4, -Math.sin(a) * 0.42);
          moon.rotation.y = a; // ayni yuzu Dunya'ya bakar
        },
      };
    },
  },

  // #9 s.33 Kraterler
  {
    mark: 9, page: 33, title: 'Ay Yüzeyindeki Kraterler',
    info: "Ay'ın atmosferi çok ince olduğu için gök taşları yanmadan yüzeye çarpar. Çarpmalarla oluşan irili ufaklı çukurlara krater denir.",
    build() {
      const root = new THREE.Group();
      const rnd = rng(9);
      const craters = Array.from({ length: 14 }, () => ({ x: (rnd() - 0.5) * 1.0, z: (rnd() - 0.5) * 0.7, r: 0.03 + rnd() ** 2 * 0.12 }));
      const ground = info(terrain(1.15, 0.85, 110, craters, { color: 0xa8a8a4 }), 'Krater', 'Gök taşlarının Ay yüzeyine çarpmasıyla oluşan çukurlardır.');
      const rock = info(ball(0.025, 0x6d4c41, 10), 'Gök taşı', 'Atmosfer çok ince olduğu için yanmadan yüzeye ulaşır.');
      const flash = glow(0.25, '#ffcc80'); flash.visible = false;
      const dust = particles(80, 0xcfcfcf, 0.02);
      root.add(ground, rock, flash, dust);
      let made = 0, target = { x: 0.25, z: 0.1 };
      return {
        root, update(t, dt) {
          const p = loop(t, 4), cycle = Math.floor(t / 4);
          if (cycle !== made && ground.craters.length < 26) {
            made = cycle;
            target = { x: (rnd() - 0.5) * 0.9, z: (rnd() - 0.5) * 0.6 };
          }
          rock.visible = p < 0.5;
          rock.position.set(target.x + (0.5 - p) * 0.8, 0.1 + (0.5 - p) * 1.6, target.z);
          if (p >= 0.5 && p < 0.52 && !ground.craters.some((c) => c.x === target.x)) {
            ground.addCrater({ x: target.x, z: target.z, r: 0.05 + rnd() * 0.05 });
            for (let i = 0; i < 30; i++) dust.emit(V(target.x, 0.1, target.z), V((rnd() - 0.5) * 0.4, rnd() * 0.4, (rnd() - 0.5) * 0.4));
          }
          flash.visible = p > 0.5 && p < 0.58;
          flash.position.set(target.x, 0.12, target.z);
          dust.update(dt);
        },
      };
    },
  },

  // #10 s.33 Ay'in yuzeyi
  {
    mark: 10, page: 33, title: "Ay'ın Yüzeyi",
    info: "Ay yüzeyinde kaya, taş, kum ve toz bulunur. Koyu görünen bölümler geniş düzlükler, açık renkli bölümler engebeli ve yüksek alanlardır.",
    build() {
      const root = new THREE.Group();
      const rnd = rng(10);
      const craters = Array.from({ length: 10 }, () => ({ x: (rnd() - 0.5) * 1, z: (rnd() - 0.5) * 0.7, r: 0.03 + rnd() * 0.07 }));
      const ground = terrain(1.15, 0.85, 110, craters, { color: 0xbdbdb8, rough: 0.02, seed: 2, maria: [{ x: -0.2, z: 0.05, rx: 0.32, rz: 0.22 }] });
      info(ground, 'Ay yüzeyi', 'Koyu bölümler düzlükler, açık bölümler engebeli yüksek alanlardır.');
      const dark = info(label('Koyu bölge: düzlük', { height: 0.045 }), 'Düzlük', 'Ay’da koyu görünen geniş düzlüklerdir.');
      dark.position.set(-0.2, 0.15, 0.05);
      const light = info(label('Açık bölge: engebeli', { height: 0.045 }), 'Engebeli alan', 'Açık renkli görünen yüksek ve engebeli alanlardır.');
      light.position.set(0.35, 0.2, -0.15);
      const earth = planet('earth', 0.08); earth.position.set(0.3, 0.6, -0.4);
      const temp = label('Gündüz 125 °C\nGece −173 °C', { height: 0.04, bg: 'rgba(30,60,120,0.9)' });
      temp.position.set(-0.35, 0.5, -0.3);
      info(temp, 'Sıcaklık farkı', 'Atmosfer yok denecek kadar ince olduğu için Ay yüzeyi gündüz çok ısınır, gece çok soğur. Bu durum kayaların parçalanmasını hızlandırır.');
      root.add(ground, dark, light, earth, temp);
      return { root, update(t) { earth.rotation.y = t * 0.3; } };
    },
  },

  // #11 s.33 Ay'daki ayak izi
  {
    mark: 11, page: 33, title: "Ay'daki Ayak İzi",
    info: "Ay'da rüzgâr ve yağış gibi hava olayları olmadığı için yüzeydeki ayak izleri milyonlarca yıl bozulmadan kalabilir.",
    build() {
      const root = new THREE.Group();
      const ground = terrain(1.0, 0.8, 140, [], { color: 0x9e9e9a, rough: 0.02, seed: 11 });
      root.add(info(ground, 'Ay toprağı', 'Kaya, taş, kum ve tozdan oluşur.'));
      // Bot tabani: kabartma cizgili kutu
      const boot = new THREE.Group();
      const sole = box(0.16, 0.05, 0.36, 0xeceff1);
      boot.add(info(sole, 'Astronot botu', 'Ay’a ilk ayak izi 1969’da bırakıldı.'));
      for (let i = 0; i < 9; i++) { const r = box(0.17, 0.012, 0.012, 0xb0bec5); r.position.set(0, -0.03, -0.16 + i * 0.04); boot.add(r); }
      const upper = box(0.15, 0.1, 0.2, 0xf5f5f5); upper.position.set(0, 0.07, -0.07); boot.add(upper);
      const strap = box(0.155, 0.02, 0.205, 0x1565c0); strap.position.set(0, 0.1, -0.07); boot.add(strap);
      boot.rotation.y = 0.3;
      root.add(boot);
      const msg = label('Rüzgâr yok → iz kalıcı', { height: 0.05 }); msg.position.set(0, 0.55, 0); root.add(msg);
      let pressed = false;
      return {
        root, update(t) {
          const p = loop(t, 6);
          boot.position.y = 0.11 + (1 - seg(p, 0.1, 0.3)) * 0.3 + seg(p, 0.45, 0.65) * 0.5;
          boot.visible = p < 0.75;
          if (p > 0.3 && !pressed) {
            pressed = true;
            ground.craters.length = 0;
            // Tabandaki her cizgi icin sig, uzun "krater" dizisi
            for (let i = 0; i < 9; i++) for (let k = -1; k <= 1; k++) {
              const zz = -0.16 + i * 0.04, xx = k * 0.05;
              ground.craters.push({ x: xx * Math.cos(0.3) + zz * Math.sin(0.3), z: -xx * Math.sin(0.3) + zz * Math.cos(0.3), r: 0.035, depth: 0.012 });
            }
            ground.update();
          }
          if (p < 0.05 && pressed) { pressed = false; ground.craters.length = 0; ground.update(); }
          msg.visible = p > 0.6;
        },
      };
    },
  },

  // #12 s.37 Ay'in evreleri (yarim ay)
  {
    mark: 12, page: 37, title: "Ay'ın Evreleri",
    info: "Ay'ın Güneş tarafından aydınlatılan yarısının Dünya'dan görünen kısmı gün geçtikçe değişir. Aynı evre yaklaşık 29,5 gün sonra tekrar görülür.",
    build() {
      const root = new THREE.Group();
      const m = phaseMoon(0.28); m.position.y = 0.45;
      info(m, 'Ay', 'Görünen şekil, aydınlık yarının ne kadarını Dünya’dan gördüğümüze bağlıdır.');
      const name = label('', { height: 0.07 }); name.position.y = 0.88;
      const day = label('', { height: 0.05 }); day.position.y = 0.06;
      root.add(m, name, day);
      return {
        root, update(t) {
          const p = loop(t, 16);
          m.setPhase(p);
          name.setText(phaseName(p));
          day.setText(`${Math.round(p * 29.5)}. gün`);
        },
      };
    },
  },

  // #13 s.37 Evre semasi (Gunes, Dunya, Ay'in 8 konumu)
  {
    mark: 13, page: 37, title: "Ay'ın Dünya Etrafındaki Konumları",
    info: "Ay Dünya'nın etrafında dolanırken her zaman Güneş'e bakan yarısı aydınlıktır. Dünya'dan bakınca bu aydınlık yarının görünen kısmı değiştiği için evreler oluşur.",
    build() {
      const root = new THREE.Group();
      const sunPos = new THREE.Vector3();
      const s = sun(0.12); s.position.set(-0.75, 0.3, 0); root.add(s);
      info(s.body, 'Güneş', 'Ay’ın her zaman Güneş’e bakan yarısı aydınlıktır.');
      const earth = info(litBody('earth', 0.09, sunPos), 'Dünya', 'Gözlem yaptığımız yer.');
      earth.position.set(0.15, 0.3, 0);
      const path = orbit(0.33, 0xffffff, true); path.position.set(0.15, 0.3, 0);
      const moon = info(litBody('moon', 0.035, sunPos), 'Ay', 'Dünya etrafında yaklaşık 29,5 günde bir tur atar (evrelerin tekrarı).');
      const view = phaseMoon(0.08); view.position.set(0.15, 0.78, 0);
      const vl = label('', { height: 0.045 }); vl.position.set(0.15, 0.92, 0);
      const vt = label("Dünya'dan görünüş", { height: 0.035, bg: 'rgba(30,60,120,0.9)' }); vt.position.set(0.15, 0.64, 0);
      // 8 sabit konum isareti
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dot = ball(0.01, 0xffffff, 8); dot.position.set(0.15 - Math.cos(a) * 0.33, 0.3, -Math.sin(a) * 0.33); root.add(dot);
      }
      root.add(earth, path, moon, view, vl, vt);
      return {
        root, update(t) {
          s.body.getWorldPosition(sunPos);
          const p = loop(t, 16), a = p * Math.PI * 2;
          // p=0 yeni ay: Ay, Dunya ile Gunes arasinda
          moon.position.set(0.15 - Math.cos(a) * 0.33, 0.3, -Math.sin(a) * 0.33);
          earth.rotation.y = t;
          view.setPhase(p);
          vl.setText(phaseName(p));
        },
      };
    },
  },

  // #14 s.40 Ay'in evreleri tablosu
  {
    mark: 14, page: 40, title: "Bir Ay Boyunca Ay'ın Görünüşü",
    info: 'Ay ışık kaynağı değildir; Güneş ışığını yansıtır. Bazı geceler hilal, bazı geceler yarım daire, bazen de tam daire şeklinde görünür; yeni ay evresinde ise görülmez.',
    build() {
      const root = new THREE.Group();
      const moons = [];
      for (let i = 0; i < 8; i++) {
        const m = phaseMoon(0.06);
        m.position.set(-0.42 + i * 0.12, 0.25, 0);
        m.setPhase(i / 8);
        info(m, phaseName(i / 8), `Yaklaşık ${Math.round((i / 8) * 29.5)}. gün`);
        root.add(m);
        moons.push(m);
      }
      const big = phaseMoon(0.16); big.position.set(0, 0.55, 0);
      info(big, 'Ay', 'Evreler yaklaşık 29,5 günde bir tekrar eder.');
      const name = label('', { height: 0.055 }); name.position.set(0, 0.8, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 6, 30), new THREE.MeshBasicMaterial({ color: 0xffd54f }));
      root.add(big, name, ring);
      return {
        root, update(t) {
          const p = loop(t, 16);
          big.setPhase(p);
          name.setText(`${phaseName(p)} • ${Math.round(p * 29.5)}. gün`);
          const k = Math.round(p * 8) % 8;
          ring.position.copy(moons[k].position);
          ring.lookAt(root.localToWorld(V(0, 0.25, 5)));
        },
      };
    },
  },

  // #15 s.42 Ay
  {
    mark: 15, page: 42, title: 'Ay',
    info: "Ay'ın aydınlık ve karanlık bölgesini ayıran çizgiye terminatör denir. Ay, Dünya'dan her yıl yaklaşık 4 cm uzaklaşmaktadır.",
    build() {
      const root = new THREE.Group();
      const sunPos = new THREE.Vector3();
      const lamp = new THREE.Object3D(); root.add(lamp);
      const moon = info(litBody('moon', 0.3, sunPos), 'Ay', "Dünya'nın tek doğal uydusudur.");
      moon.position.y = 0.45;
      const term = info(label('Terminatör', { height: 0.05, dot: '#ffd54f' }), 'Terminatör', "Ay'ın aydınlık ve karanlık bölgesini ayıran çizgidir.");
      term.position.set(0, 0.85, 0.2);
      const fact = label('Her yıl ~4 cm uzaklaşıyor', { height: 0.04 }); fact.position.set(0, 0.06, 0);
      root.add(moon, term, fact);
      return {
        root, update(t) {
          const a = t * 0.25;
          lamp.position.set(Math.cos(a) * 3, 0.6, Math.sin(a) * 3);
          lamp.getWorldPosition(sunPos);
          moon.rotation.y = t * 0.1;
        },
      };
    },
  },

  // #16 s.46 Gunes'in gun icindeki konumlari
  {
    mark: 16, page: 46, title: "Güneş'in Gün İçindeki Konumları",
    info: "Güneş günün farklı saatlerinde gökyüzünde farklı konumlarda görünür: sabah doğuda alçakta, öğlen en yüksekte, akşam batıda alçakta. Bunun nedeni Dünya'nın dönme hareketidir.",
    build() {
      const root = new THREE.Group();
      const rnd = rng(16);
      const city = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const h = 0.06 + rnd() * 0.18;
        const b = box(0.07, h, 0.07, [0x90caf9, 0xb0bec5, 0x80cbc4, 0xc5e1a5][i % 4]);
        b.position.set(-0.5 + i * 0.075, h / 2, (rnd() - 0.5) * 0.15);
        city.add(b);
      }
      const ground = box(1.15, 0.01, 0.4, 0x7cb342); ground.position.y = -0.005;
      root.add(ground, city);
      const s = sun(0.07); root.add(s);
      info(s.body, 'Güneş', "Güneş hareket etmiyor gibi görünse de konumu değişir; çünkü Dünya kendi ekseni etrafında döner.");
      const arc = [];
      for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40); arc.push(V(-Math.cos(a) * 0.55, 0.1 + Math.sin(a) * 0.6, -0.1)); }
      root.add(line(arc, 0xffe082, true));
      const clock = label('', { height: 0.06 }); clock.position.set(0, 0.9, 0);
      const dirs = [['Doğu', -0.6], ['Batı', 0.6]].map(([t, x]) => { const l = label(t, { height: 0.045 }); l.position.set(x, 0.05, 0.2); root.add(l); return l; });
      root.add(clock);
      void dirs;
      return {
        root, update(t) {
          const p = loop(t, 12), hour = 6 + p * 12, a = Math.PI * p;
          s.position.set(-Math.cos(a) * 0.55, 0.1 + Math.sin(a) * 0.6, -0.1);
          const hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60);
          clock.setText(`${String(hh).padStart(2, '0')}.${String(mm).padStart(2, '0')}`);
          // Sabah ve aksam Gunes daha turuncu, oglen daha sari
          const warm = 1 - Math.sin(a);
          s.body.material.color.setRGB(1, 1 - warm * 0.35, 1 - warm * 0.6);
        },
      };
    },
  },

  // #17 s.47 Gunes'in donmesi; Dunya'nin donme ve dolanma yonu
  {
    mark: 17, page: 47, title: 'Dönme ve Dolanma Yönü',
    info: "Güneş kendi ekseni etrafında döner. Dünya kendi ekseni etrafında 24 saatte döner (dönme hareketi) ve Güneş'in etrafında yaklaşık 365 günde dolanır (dolanma hareketi). Her ikisi de saatin dönme yönünün tersinedir.",
    build() {
      const root = new THREE.Group();
      const s = sun(0.15); s.position.y = 0.35; root.add(s);
      info(s.body, 'Güneş', 'Kendi ekseni etrafında döner.');
      const sSpin = spinArrow(0.2); sSpin.position.y = 0.58; root.add(sSpin);
      const path = orbit(0.5, 0xffffff, true); path.position.y = 0.35; root.add(path);
      const earth = info(planet('earth', 0.06), 'Dünya', 'Dönme hareketi 24 saatte, dolanma hareketi yaklaşık 365 günde tamamlanır.');
      const eSpin = spinArrow(0.09, 0x80deea);
      root.add(earth, eSpin);
      const l1 = label('Dönme: 24 saat', { height: 0.04 }), l2 = label('Dolanma: ~365 gün', { height: 0.04 });
      l2.position.set(0, 0.06, 0.55);
      root.add(l1, l2);
      return {
        root, update(t) {
          s.body.rotation.y = t * 0.3;
          const a = t * 0.3;
          earth.position.set(Math.cos(a) * 0.5, 0.35, -Math.sin(a) * 0.5);
          earth.rotation.y = t * 3;
          eSpin.position.copy(earth.position).add(V(0, 0.1, 0));
          l1.position.copy(earth.position).add(V(0, 0.2, 0));
        },
      };
    },
  },

  // #18 s.47 Gunes, Dunya ve Ay'in hareketleri
  {
    mark: 18, page: 47, title: 'Güneş, Dünya ve Ay’ın Hareketleri',
    info: "Ay hem kendi ekseni etrafında döner hem de Dünya'nın etrafında dolanır; bu iki hareket yaklaşık aynı sürede tamamlanır. Ay, Dünya ile birlikte Güneş'in etrafında da dolanır. Tüm hareketler saatin dönme yönünün tersinedir.",
    build() {
      const root = new THREE.Group();
      const s = sun(0.14); s.position.y = 0.35; root.add(s);
      info(s.body, 'Güneş', 'Kendi ekseni etrafında döner.');
      const path = orbit(0.48, 0xffffff, true); path.position.y = 0.35; root.add(path);
      const sys = new THREE.Group(); root.add(sys);
      const earth = info(planet('earth', 0.055), 'Dünya', 'Güneş etrafında dolanırken Ay’ı da beraberinde götürür.');
      const mPath = orbit(0.13, 0xb0bec5, true);
      const moon = info(planet('moon', 0.018), 'Ay', "Dünya'nın etrafında yaklaşık 27,3 günde dolanır; aynı sürede kendi etrafında da döner. Bu yüzden Ay'ın hep aynı yüzünü görürüz.");
      sys.add(earth, mPath, moon);
      return {
        root, update(t) {
          s.body.rotation.y = t * 0.3;
          const a = t * 0.2;
          sys.position.set(Math.cos(a) * 0.48, 0.35, -Math.sin(a) * 0.48);
          earth.rotation.y = t * 3;
          const b = t * 1.6;
          moon.position.set(Math.cos(b) * 0.13, 0, -Math.sin(b) * 0.13);
          moon.rotation.y = b;
        },
      };
    },
  },

  // #19 s.48 Ulug Bey
  {
    mark: 19, page: 48, title: 'Uluğ Bey ve Semerkant Rasathanesi',
    info: "Uluğ Bey önemli bir matematik ve astronomi bilginidir. Semerkant'ta döneminin en büyük rasathanesini yaptırmış, yıldızların konumlarını içeren bir katalog hazırlamıştır.",
    build() {
      const root = new THREE.Group();
      // Armiller kure: ic ice donen halkalar ve yildizli kure
      const arm = new THREE.Group(); arm.position.y = 0.45;
      const gold = 0xc9a227;
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.008, 8, 64), new THREE.MeshLambertMaterial({ color: gold }));
      const r2 = r1.clone(); r2.rotation.y = Math.PI / 2;
      const r3 = r1.clone(); r3.rotation.x = Math.PI / 2;
      const ecl = r1.clone(); ecl.rotation.x = Math.PI / 2 + 0.41; ecl.scale.setScalar(0.97);
      arm.add(r1, r2, r3, ecl);
      const globe = info(planet('earth', 0.07), 'Dünya', 'Eski gökbilimciler gök cisimlerinin hareketini bu tür aletlerle inceledi.');
      arm.add(globe);
      info(r1, 'Armiller küre', 'Gök cisimlerinin konumlarını ölçmek için kullanılan eski bir gözlem aletidir.');
      const stand = cyl(0.02, 0.06, 0.18, 0x6d4c41); stand.position.y = 0.09;
      const st = stars(150, 0.9, 19);
      // Semerkant rasathanesindeki dev duvar kadrani (Fahri sekstanti)
      const sext = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 40, Math.PI / 3), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
      sext.position.set(-0.45, 0.02, -0.2); sext.rotation.z = Math.PI / 2 - 0.1;
      info(sext, 'Fahri sekstantı', 'Semerkant rasathanesindeki dev ölçüm aleti. Güneş ve yıldızların yüksekliğini ölçmeye yarardı.');
      const lbl = label('Semerkant Rasathanesi', { height: 0.05 }); lbl.position.set(0, 0.9, 0);
      root.add(st, stand, arm, sext, lbl);
      return { root, update(t) { arm.rotation.y = t * 0.3; ecl.rotation.z = t * 0.5; globe.rotation.y = t; st.rotation.y = t * 0.05; } };
    },
  },

  // #20 s.52 Milli Uzay Programi: roket ve astronot
  {
    mark: 20, page: 52, title: 'Milli Uzay Programı: Ay Yolculuğu',
    info: "Ay'a yolculuk roketle başlar. Roket, yer çekimini yenmek için büyük bir itme kuvveti üretir. Yolculuk, Ay'ın Dünya'ya bakan yüzünün tamamının aydınlık göründüğü dolunay gününde başladı.",
    build() {
      const root = new THREE.Group();
      const pad = box(0.3, 0.03, 0.3, 0x546e7a); pad.position.y = 0.015;
      const tower = box(0.03, 0.55, 0.03, 0x90a4ae); tower.position.set(-0.1, 0.28, 0);
      const rocket = vehicle('rocket'); rocket.scale.setScalar(1.3);
      info(rocket.children[0], 'Roket', 'Yakıtı yakarak aşağı doğru gaz püskürtür ve yukarı doğru itme kuvveti kazanır.');
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 16), new THREE.MeshBasicMaterial({ color: 0xffa726, transparent: true, opacity: 0.85 }));
      flame.rotation.x = Math.PI; flame.position.y = -0.08; rocket.add(flame);
      const smoke = particles(160, 0xe0e0e0, 0.05);
      const astro = human({ h: 0.32, shirt: 0xeceff1, pants: 0xeceff1, skin: 0xeceff1, hair: 0xeceff1 });
      astro.position.set(0.32, 0, 0.1);
      const visor = ball(0.03, 0xffb300, 16); visor.position.set(0, 0.025, 0.02); astro.joints.neck.add(visor);
      info(astro.children[0].children[0], 'Astronot', 'Uzay yolculuğu yapan bilim insanı. Uzay giysisi onu soğuktan ve ışınlardan korur.');
      const moon = phaseMoon(0.08); moon.setPhase(0.5); moon.position.set(-0.4, 0.85, -0.3);
      info(moon, 'Dolunay', "Yolculuk, Ay'ın Dünya'ya bakan yüzünün tamamının aydınlık göründüğü gün başladı.");
      const flag = new THREE.Group();
      const pole = cyl(0.004, 0.004, 0.2, 0xbdbdbd, 6); pole.position.y = 0.1;
      const cloth = box(0.09, 0.06, 0.002, C.red); cloth.position.set(0.045, 0.17, 0);
      const crescent = new THREE.Mesh(new THREE.CircleGeometry(0.014, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      crescent.position.set(0.035, 0.17, 0.0015);
      flag.add(pole, cloth, crescent); flag.position.set(0.25, 0.03, -0.12);
      root.add(pad, tower, rocket, smoke, astro, moon, flag);
      const rnd = rng(20);
      return {
        root, update(t, dt) {
          const p = loop(t, 8);
          const lift = seg(p, 0.2, 0.85);
          rocket.position.y = 0.03 + lift * lift * 1.2;
          rocket.visible = p < 0.86;
          flame.visible = p > 0.12 && p < 0.86;
          flame.scale.y = 0.8 + Math.sin(t * 40) * 0.2;
          if (p > 0.12 && p < 0.86) for (let i = 0; i < 3; i++) smoke.emit(V(0, rocket.position.y, 0), V((rnd() - 0.5) * 0.5, 0.05 + rnd() * 0.1, (rnd() - 0.5) * 0.5));
          smoke.update(dt);
          astro.joints.rShoulder.rotation.z = p > 0.2 ? 2.6 + Math.sin(t * 6) * 0.3 : 0.1;
        },
      };
    },
  },
];
