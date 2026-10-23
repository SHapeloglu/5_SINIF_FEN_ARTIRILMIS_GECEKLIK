# 5. Sınıf Fen – Artırılmış Gerçeklik: Dünya'nın Katmanları

Son güncelleme: 23.10.2026

## Amaç
`SHapeloglu/5_SINIF_FEN_ARTIRILMIS_GECEKLIK` reposundaki `v1.pdf` kitabının **18. sayfasındaki** Dünya görseline
telefon kamerasıyla bakıldığında, görselin üzerinde **Dünya'nın katmanlarını gösteren 3D model** çıksın.
Projenin kapsamı: kitapta kırmızı çizgiyle işaretlenen tüm sayfalar (şimdilik sadece s.18 yapıldı).

## Kitap / PDF notları
- Kitabın basılı **18. sayfası**, PDF'te **20. sayfa** (başta 2 numarasız sayfa var).
- Görsel sayfada kırmızı elipsle işaretli. Bu işaret sayfaya gömülü değil, PDF notu (Oval annotation, yazar "yeliz").
- Görselin basılı genişliği **31,1 mm** (88,2 pt). PDF'te 184×184 px olarak gömülü.
- Referans görsel PDF'ten kırmızı elips olmadan çıkarıldı: `DunyaReferans.png` / `hedef.png` (491×492 px).

## Ortak 3D model (üç sürümde aynı)
- Bir çeyreği (sekizde biri) kesik küre. Kesit yüzlerinde 4 katman: yer kabuğu, manto, dış çekirdek, iç çekirdek.
- Yer kabuğu görünsün diye kalın çizildi; model ölçekli değil. Dünya yüzeyi dokusu temsili (kodla çizilmiş).
- Etiketler + gösterge çizgileri, üstte "Dünya'nın Katmanları" başlığı.
- Görsel algılanınca büyüyerek yükselir. Model yarıçapı 4,5 cm.
- Katmana/etikete dokununca 5. sınıf düzeyinde açıklama. Sürükle: döndür. İki parmak: büyüt/küçült.

## Sürümler

### 1. Web (MindAR + three.js) — YAYINDA ✅
- Adres: **https://ar.powerbi.com.tr**
- Kurulum, Apple ID ya da ARCore gerekmez. iPhone'da Safari, Android'de Chrome ile açılır.
- Model sadece görsel kadrajdayken görünür (masada sabit kalmaz).
- Dosyalar: `index.html`, `app.js`, `targets.mind` (MindAR hedefi), `hedef.png`
  - Yerel kopya: repo klonundaki `docs/` (henüz repoya gönderilmedi)
  - Zip: Windows `Masaüstü\ar-powerbi-web.zip`
- `targets.mind`, `mind-ar@1.2.5` derleyicisiyle Node.js'te üretildi (node-canvas yerine ham RGBA piksellerle).
- three.js **r160** kullanılmalı: MindAR 1.2.5, r162'de kaldırılan `sRGBEncoding`'i kullanıyor.
- Geometri ve dokunma hesabı Node.js'te test edildi (6/6). **Gerçek telefonda henüz test edilmedi.**

**Sunucu (Contabo, `95.111.242.96`, Ubuntu 24.04, nginx + certbot):**
- SSH: `ssh -i ~/.ssh/contabo_95_111_242_96_ed25519 root@95.111.242.96`
  (anahtarın aslı `C:\Users\yeliz\.ssh\` altında; WSL'ye 600 izinle kopyalandı)
- Dosyalar: `/var/www/ar.powerbi.com.tr/` (sahibi `www-data`)
- nginx: `/etc/nginx/sites-available/ar.powerbi.com.tr` (+ `sites-enabled` bağlantısı), statik site
- SSL: Let's Encrypt, `certbot --nginx -d ar.powerbi.com.tr`, 21.01.2027'ye kadar geçerli, otomatik yenilenir
- DNS: `ar.powerbi.com.tr` A kaydı → `95.111.242.96` (DNS Mirahosting'de)
- Güncelleme için:
  ```bash
  scp -i ~/.ssh/contabo_95_111_242_96_ed25519 index.html app.js targets.mind hedef.png root@95.111.242.96:/var/www/ar.powerbi.com.tr/
  ```
- Not: Kurulum sonrası `dataportal` ve `pbimonitor` 404 veriyordu. İnceleme sonucu: bugün nginx'te değişen tek
  şey AR sitesi; `dataportal` uygulaması (port 5001) kurulumdan önce zaten kapalıydı (AutoSleep). İstekleri
  uyandırma servisi (port 7999) karşılayıp 404 dönüyor; bu siteleri uyandırması gerekip gerekmediği ayrıca kontrol edilmeli.

### 2. iOS (ARKit + SceneKit) — derlendi, cihaza kurulamadı
- Proje: `~/projects/iPhone8DunyaKatmanlariAR` (Theos, Objective-C, ARC, arm64, iOS 12+, rootless)
  - `ARViewController.m`: ARKit dünya takibi + görüntü algılama, hareketler, bilgi paneli
  - `EarthModel.m`: model geometrisi, renkler, etiketler, açıklama metinleri
- Paketler (repoda da var):
  - `DunyaKatmanlariAR.ipa` (jailbreak'siz cihaz için)
  - `com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb` (rootless jailbreak'li cihaz için)
- Derleme:
  ```bash
  cd ~/projects/iPhone8DunyaKatmanlariAR
  make package FINALPACKAGE=1                     # .deb
  make package FINALPACKAGE=1 PACKAGE_FORMAT=ipa  # .ipa
  ```
- Test cihazı iPhone 8 değil, **iPhone SE 2 (A13), iOS 26.5.2**, jailbreak'siz (IP `192.168.0.20`, SSH kapalı).
  - iOS 26 için TrollStore ve jailbreak yok. Tek yol Sideloadly (Apple ID ile imzalama).
  - Sideloadly'de hata: `Login failed (-80046)`. Remote anisette de aynı hatayı verdi.
    Apple ID tarafında sorun; developer.apple.com'da şartları kabul etmek, Local anisette (Apple sitesinden
    iTunes + iCloud) ya da başka Apple ID denenecek.
  - Web sürümü bu cihazda Safari ile kullanılabildiği için şu an öncelikli değil.
- iPhone 6s (jailbreak'li, rootless, eski IP `192.168.1.7`) şu an ağda bulunamadı.

### 3. Android (ARCore + OpenGL ES) — derlendi, test cihazı uygun değil
- Proje: `C:\Users\yeliz\AndroidStudioProjects\DunyaKatmanlariAR` (Java, minSdk 24, ARCore 1.44.0)
  - `MainActivity.java`: ARCore oturumu, görsel tanıma, hareketler, arayüz
  - `EarthModel.java` / `EarthRenderer.java`: model, etiketler, dokunma testi
  - `BackgroundRenderer.java`, `Mesh.java`, `GlUtil.java`
- Referans görselin ARCore kalite puanı (`arcoreimg`): **80/100** (alt sınır 75).
- Derleme (Windows'ta Android Studio'nun Java'sı ile): `build.bat assembleDebug`
- APK: `Masaüstü\DunyaKatmanlariAR.apk`
- Test cihazı **Xiaomi Redmi 12 (23053RN02A)**, IP `192.168.0.13`. **ARCore desteklemiyor**
  (Google'ın ARCore cihaz listesinde yok). Bu cihazda web sürümü kullanılmalı.

## Sıradaki adımlar
1. **Web sürümünü telefonlarda test et:** iPhone SE 2 (Safari) ve Redmi 12 (Chrome) ile https://ar.powerbi.com.tr
   - Görsel algılanıyor mu, ne kadar hızlı?
   - Model boyutu uygun mu, titriyor mu?
   - Etiketler okunuyor mu, katmana dokununca bilgi çıkıyor mu?
2. Test sonucuna göre ayarla (`app.js`): `MODEL_RADIUS_M`, `filterMinCF` / `filterBeta` (titreme), renkler, etiket yerleri.
3. Web dosyalarını (`docs/`) ve Android projesini repoya ekle.
4. Kitapta işaretlenen diğer sayfalar için yeni hedefler ve modeller ekle (MindAR birden fazla hedefi aynı `.mind` dosyasında destekler).
5. `dataportal` / `pbimonitor` AutoSleep uyanma sorununu ayrıca kontrol et (AR projesiyle ilgisi yok).
