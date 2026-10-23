# 5. Sınıf Fen – Artırılmış Gerçeklik: Dünya'nın Katmanları

Son güncelleme: 23.10.2026

## Amaç
`SHapeloglu/5_SINIF_FEN_ARTIRILMIS_GECEKLIK` reposundaki `v1.pdf` kitabının **18. sayfasındaki** Dünya görseline
iPhone 8 kamerasıyla bakıldığında, görselin üzerinde **Dünya'nın katmanlarını gösteren 3D model** çıksın.

## Kitap / PDF notları
- Kitabın basılı **18. sayfası**, PDF'te **20. sayfa** (başta 2 numarasız sayfa var).
- Görsel sayfada kırmızı elipsle işaretli. Bu işaret sayfaya gömülü değil, PDF notu (Oval annotation, yazar "yeliz").
- Görselin basılı genişliği **31,1 mm** (88,2 pt). PDF'te 184×184 px olarak gömülü.

## Yapılanlar
1. **Referans görsel:** PDF'ten kırmızı elips olmadan çıkarıldı → `Resources/DunyaReferans.png` (491×492 px).
2. **Uygulama:** `~/projects/iPhone8DunyaKatmanlariAR` (Theos, Objective-C, ARC, arm64, iOS 12+, rootless)
   - `ARViewController.m`: ARKit dünya takibi + görüntü algılama, dokunma/sürükleme/iki parmak hareketleri, bilgi paneli
   - `EarthModel.m`: kesik çeyrekli 3D Dünya modeli (kodla üretiliyor), katman renkleri, etiketler, açıklama metinleri
   - Katmanlar: yer kabuğu, manto, dış çekirdek, iç çekirdek. Yer kabuğu görünsün diye kalın çizildi; model ölçekli değil.
   - Dünya yüzeyi dokusu temsili (kodla çizilmiş kara ve bulutlar).
   - Model yarıçapı 4,5 cm. Görsel algılanınca büyüyerek yükseliyor.
3. **Derleme:** uyarısız derlendi.
   - `packages/com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb` (jailbreak'li cihaz için)
   - `packages/com.olap.dunyakatmanlariar_0.1.0.ipa` (jailbreak'siz cihaz için)
   - `.ipa` dosyası Windows masaüstüne de kopyalandı: `Masaüstü\DunyaKatmanlariAR.ipa`

Derleme komutları:
```bash
cd ~/projects/iPhone8DunyaKatmanlariAR
make package FINALPACKAGE=1                     # .deb
make package FINALPACKAGE=1 PACKAGE_FORMAT=ipa  # .ipa
```

## Kaldığımız yer
- **Uygulama henüz hiçbir cihazda test edilmedi.**
- iPhone 8 (`192.168.0.20`) **jailbreak'siz**. Ağda görünüyor ama SSH kapalı, yani ağ üzerinden yükleme yapılamıyor.
- iPhone 6s (jailbreak'li, rootless, eski IP `192.168.1.7`) şu an ağda bulunamadı.

## Sıradaki adımlar
1. iPhone 8'in iOS sürümünü öğren (*Ayarlar → Genel → Hakkında*).
   - **iOS 14.0 – 16.6.1:** TrollStore (TrollInstallerX) ile `.ipa` dosyasını süresiz kur.
   - **Diğer sürümler:** Windows'ta Sideloadly + iTunes ile Apple ID kullanarak kur.
     - Ücretsiz hesapta uygulama 7 günde bir yeniden yüklenmeli.
     - Telefonda *VPN ve Cihaz Yönetimi*'nden sertifikaya güven.
     - iOS 16 ve üstünde *Geliştirici Modu*'nu aç.
2. İstersen önce 6s'te dene: IP'sini bul, sonra:
   ```bash
   scp packages/com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb root@<IP>:/var/mobile/
   ssh root@<IP> "dpkg -i /var/mobile/com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb && uicache -a"
   ```
3. Kitabın 18. sayfasıyla test et (iyi ışık, 15–25 cm mesafe). Şunları kontrol et:
   - Görsel algılanıyor mu?
   - Model boyutu uygun mu?
   - Etiketler okunuyor mu?
   - Katmana dokununca bilgi çıkıyor mu?
4. Test sonucuna göre gerekirse ayarla: `kModelRadiusMeters` (model boyutu), renkler, etiket yerleri, açıklama metinleri.
