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
- Test cihazı iPhone 8 değil, **iPhone SE 2 (A13), iOS 26.5.2**, jailbreak'siz (IP `192.168.0.20`, SSH kapalı).
  - ARKit tam destekli; ekran iPhone 8 ile aynı (4,7"). Mevcut `.ipa` yeniden derlenmeden kullanılabilir.
  - iOS 26 için **TrollStore ve jailbreak yok**. Tek yol **Sideloadly** (Apple ID ile imzalama).
- Windows'a Sideloadly kuruldu. İlk denemede hata alındı:
  `Login failed (-80046): This action cannot be completed at this time.`
  Bu hata Apple ID girişinden kaynaklanıyor; uygulamayla ilgisi yok.
- iPhone 6s (jailbreak'li, rootless, eski IP `192.168.1.7`) şu an ağda bulunamadı.

## Sıradaki adımlar
1. Sideloadly -80046 hatasını çöz:
   - iPhone SE'de *Ayarlar → en üstteki ad* bölümünde Apple ID e-postasını bul.
   - **developer.apple.com/account** adresinde bu hesapla giriş yap, şartları kabul et.
   - Olmazsa Sideloadly'de *Advanced options → Anisette Authentication* ayarını değiştir.
   - Sideloadly'nin son sürüm olduğundan emin ol (iOS 26 desteği için).
   - Yeni Apple ID'lerde ya da çok denemeden sonra Apple geçici engelleyebilir; birkaç saat bekle ya da başka bir Apple ID dene.
2. Kurulum sonrası iPhone'da:
   - *Ayarlar → Genel → VPN ve Cihaz Yönetimi*'nden sertifikaya güven.
   - *Ayarlar → Gizlilik ve Güvenlik → Geliştirici Modu*'nu aç.
   - Ücretsiz hesapta uygulama 7 günde bir Sideloadly ile yeniden yüklenmeli.
3. İstersen önce 6s'te dene: IP'sini bul, sonra:
   ```bash
   scp packages/com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb root@<IP>:/var/mobile/
   ssh root@<IP> "dpkg -i /var/mobile/com.olap.dunyakatmanlariar_0.1.0_iphoneos-arm64.deb && uicache -a"
   ```
4. Kitabın 18. sayfasıyla test et (iyi ışık, 15–25 cm mesafe). Şunları kontrol et:
   - Görsel algılanıyor mu?
   - Model boyutu uygun mu?
   - Etiketler okunuyor mu?
   - Katmana dokununca bilgi çıkıyor mu?
5. Test sonucuna göre gerekirse ayarla: `kModelRadiusMeters` (model boyutu), renkler, etiket yerleri, açıklama metinleri.
