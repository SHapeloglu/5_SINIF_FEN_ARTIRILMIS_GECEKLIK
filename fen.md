# 5. Sınıf Fen – Artırılmış Gerçeklik

Son güncelleme: 23.10.2026

## Amaç
`SHapeloglu/5_SINIF_FEN_ARTIRILMIS_GECEKLIK` reposundaki Fen kitabında **kırmızı dikdörtgen/elipsle işaretlenen
görsellere** telefon kamerasıyla bakıldığında, görselin üzerinde konuyla ilgili **3D animasyon** çıksın.

- `v1.pdf`: ilk sürüm, sadece s.18 (Dünya'nın katmanları) işaretli.
- `v3.pdf`: **güncel sürüm, 49 sayfada 72 işaret** (67 dikdörtgen, 5 elips). Web sürümü bu PDF'e göre yapıldı.

## Kitap / PDF notları
- İşaretler sayfaya gömülü değil; PDF notu (Square/Circle annotation). `tools/extract_marks.py` bunları bulur.
- Basılı sayfa numarası PDF sayfa numarasından farklıdır (ör. basılı s.18 = PDF s.20).
- İşaret numaraları PDF'teki sıraya göredir (#1 = s.18 … #72 = PDF s.146).
- **Sahne yapılmayan 2 işaret** (karar bekleniyor):
  - **#6 (s.29):** 1,4 mm yüksekliğinde tek metin satırı; büyük ihtimalle yanlışlıkla çizilmiş.
  - **#72 (PDF s.146):** 16×22 cm Türkiye haritası; hangi konuya ait olduğu belli değil.

## Web sürümü (MindAR + three.js) — YAYINDA ✅
- Adres: **https://ar.powerbi.com.tr** (ünite doğrudan açılabilir: `?u=1`, `?u=2`, `?u=3`)
- Kurulum, Apple ID ya da ARCore gerekmez. iPhone'da Safari, Android'de Chrome ile açılır.
- **70 sahne**: Ünite 1 (19), Ünite 2 (24), Ünite 3 (27). Her sahne kendi görselinin üzerinde canlanır.
  - Dokun: parçanın açıklaması • Sürükle: döndür • İki parmak: büyüt/küçült
  - Görsel tanınınca alttaki panelde sahnenin adı ve 5. sınıf düzeyinde açıklaması çıkar.
  - Anatomi modelleri (iskelet, kalp, mide, kaslar) kodla çizilmiş **stilize** modellerdir.
- Dosyalar (`docs/`):
  - `index.html`, `app.js`: giriş ekranı (ünite seçimi), MindAR, dokunma/döndürme/ölçek, bilgi paneli
  - `lib.js`: ortak 3D bileşenler (gezegenler, katmanlı kesit, Ay evreleri, yay/dinamometre, Ay yüzeyi,
    insan figürü, iskelet, kalp, mide, kas dokusu, mikroskop, hücreler, parçacıklar…)
  - `scenes/uniteN.js`: sahneler (her biri `mark`, `page`, `title`, `info`, `build()`)
  - `targets/uniteN.mind`: hedef görseller (ünite başına; sıra = sahne dosyasındaki `mark` sırası)
- three.js **r160** kullanılmalı: MindAR 1.2.5, r162'de kaldırılan `sRGBEncoding`'i kullanıyor.
- Hedef dosyası boyutları: 5,5 / 7,2 / 8,4 MB (gzip ile 2,4 / 2,9 / 3,3 MB).
- Hedef dosyaları değişince `app.js` içindeki `ASSET_VERSION` artırılmalı (tarayıcı önbelleği).

**Testler (bilgisayarda):**
- 70 sahnenin hepsi Node.js'te kuruldu ve 10 sn animasyonu hatasız çalıştı.
- Her sahne kitaptaki görselinin üzerinde başsız Chromium ile çizilip görsel olarak incelendi; bulunan sorunlar düzeltildi.
- Uçtan uca test (sahte kamera = kitap sayfası görüntüsü): s.18, s.61 ve s.100 görselleri tanındı, doğru sahne açıldı.
  Canlı sitede de (https://ar.powerbi.com.tr) tekrarlandı, konsolda hata yok.
- **Gerçek telefonda henüz test edilmedi.**

**Yeni sayfa/işaret eklemek için:**
```bash
pip install pymupdf
python tools/extract_marks.py v3.pdf isaretler --max 480     # işaretleri dışa aktar
# scenes/uniteN.js dosyasına yeni sahne ekle (mark: N, page, title, info, build)
npm install mind-ar@1.2.5 --ignore-scripts
node tools/compile-targets.mjs isaretler docs/scenes/unite1.js docs/targets/unite1.mind
```
`compile-targets.mjs`, `mind-ar` paketinin bulunduğu klasörden çalıştırılmalı (Node ESM `NODE_PATH` kullanmaz).

**Sunucu (Contabo, `95.111.242.96`, Ubuntu 24.04, nginx + certbot):**
- SSH: `ssh -i ~/.ssh/contabo_95_111_242_96_ed25519 root@95.111.242.96`
  (anahtarın aslı `C:\Users\yeliz\.ssh\` altında; WSL'ye 600 izinle kopyalandı)
- Dosyalar: `/var/www/ar.powerbi.com.tr/` (sahibi `www-data`)
- nginx: `/etc/nginx/sites-available/ar.powerbi.com.tr` (+ `sites-enabled` bağlantısı), statik site
- SSL: Let's Encrypt, `certbot --nginx -d ar.powerbi.com.tr`, 21.01.2027'ye kadar geçerli, otomatik yenilenir
- DNS: `ar.powerbi.com.tr` A kaydı → `95.111.242.96` (DNS Mirahosting'de)
- Güncelleme:
  ```bash
  cd docs
  scp -i ~/.ssh/contabo_95_111_242_96_ed25519 -r index.html app.js lib.js hedef.png scenes targets root@95.111.242.96:/var/www/ar.powerbi.com.tr/
  ```
- Not: İlk kurulum sonrası `dataportal` ve `pbimonitor` 404 veriyordu. İnceleme sonucu: nginx'te değişen tek şey
  AR sitesiydi; `dataportal` uygulaması (port 5001) kurulumdan önce zaten kapalıydı (AutoSleep). İstekleri
  uyandırma servisi (port 7999) karşılayıp 404 dönüyor; bu ayrıca kontrol edilmeli.

## Yerel uygulamalar (sadece s.18, v1)

### iOS (ARKit + SceneKit) — derlendi, cihaza kurulamadı
- Proje: `~/projects/iPhone8DunyaKatmanlariAR` (Theos, Objective-C, ARC, arm64, iOS 12+, rootless)
- Paketler (repoda): `DunyaKatmanlariAR.ipa`, `com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb`
- Test cihazı **iPhone SE 2, iOS 26.5.2**, jailbreak'siz. iOS 26 için TrollStore yok; tek yol Sideloadly.
  Sideloadly'de `Login failed (-80046)` (Apple ID girişi; Remote anisette de aynı). Web sürümü bu cihazda
  Safari ile kullanılabildiği için öncelikli değil.

### Android (ARCore + OpenGL ES) — derlendi, test cihazı uygun değil
- Proje: `android/` (Java, minSdk 24, ARCore 1.44.0); Windows'ta `build.bat assembleDebug`
- Test cihazı **Xiaomi Redmi 12 (23053RN02A)** ARCore desteklemiyor; bu cihazda web sürümü kullanılmalı.

## Sıradaki adımlar
1. **Telefonda test:** iPhone SE 2 (Safari) ve Redmi 12 (Chrome) ile https://ar.powerbi.com.tr
   - Görseller tanınıyor mu, ne kadar hızlı? (özellikle az desenli çizimler: #13, #25, #50, #54 gibi)
   - Sahne boyutu uygun mu? (başlangıç ölçeği `START_SCALE = 0.65`, iki parmakla değişir)
   - Akıcı mı? (en ağır sahne #52, ~39 bin üçgen)
2. Tanınmayan görseller için: farklı kırpım ya da daha yüksek çözünürlükle yeniden derleme.
3. #6 ve #72 için karar.
4. (İsteğe bağlı) nginx'te `.mind` dosyaları için gzip: indirme boyutu yaklaşık yarıya iner. Sunucu ayarı olduğu için onay bekliyor.
5. (İsteğe bağlı) Her ünite için kitaba basılacak QR kod (`https://ar.powerbi.com.tr/?u=1` …).
