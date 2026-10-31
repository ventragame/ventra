# Ventra Kids | P0–P2 Kapanış ve İki Cihaz Kabul Planı
**1 Kasım 2026 — Aktif, henüz tamamlandı değil**

## P0 — Güvenlik ve veri koruması
- [x] Senkronizasyon sırasında bulutta sıfır satır güncellenen çocuk silme işleminin başarı raporlaması engellendi.
- [x] Başarısız bulut yazmalarında yerel tombstone kayıtları korunuyor; idempotent deneme testi eklendi.
- [x] `npm audit --json` raporu GitHub Actions artifact olarak hazırlanıyor. Rapordaki şiddet ve paket zinciri ayrıca incelenmeden güvenlik tamamlanmış sayılmaz.
- [ ] Kritik/yüksek npm bağımlılık bulguları etkilenen çalışma zamanı paketlerine göre sınıflandırılacak; uyumlu düzeltmeler ayrı doğrulanacak.
- [ ] Çocuk verileri için gizlilik, saklama, silme ve hesap yetki denetimi canlı ortamda yapılacak.

## P1 — Çocuk profili
- [x] Profil/oyuncu kimliği ve avatar/sınıf/İngilizce tercihi kodda mevcut.
- [ ] Gerçek ilk kurulum, tekrarlanan giriş, profil değiştirme, offline ve tarayıcı veri temizleme davranışı kullanıcı kabulünde kontrol edilecek.

## P2 — Gerçek iki cihaz
Aşağıdaki test **aynı yetişkin hesabında** yapılır. Test çocuğu gerçek çocuk verileriyle değil, sahte takma adla açılır.
1. Cihaz A'da yeni çocuk profili aç, seçili sınıf ve İngilizce düzeyini kaydet. Profil kimliğini not et.
2. A'da Hayvan Çayırı'nın ilk görevini bitir, kazandığın yıldızı ve toplam tamamlanan görevi not et.
3. Ebeveyn alanından profili açık onayla aile hesabına bağla ve eşitle. Başarı mesajını doğrula.
4. Cihaz B'de aynı **yetişkin** hesabına giriş yap. Profilleri buluttan getir, A'daki kimlik/yıldız/sınıf/düzeyin aynen geldiğini doğrula.
5. B'de başka bir görev bitir ve eşitle. A'da yeniden eşitle, iki cihazdaki durumun aynı olduğunu doğrula.
6. A offline iken bir görev oynasın. B de offline iken aynı görevi farklı sonuçla tekrar oynasın; bağlantıdan sonra B→A ve A→B sırayla eşitlensin. Yıldız yalnızca **en yüksek görev ödülü** kadar sayılmalı; yeni öğrenme kanıtları kaybolmamalı.
7. Aynı senkronizasyonu ikinci kez yap. Yeni olay yoksa yıldız artmamalı.
8. İkinci bir çocuk profili aç; iki profilin olayları/ödülleri asla karışmamalı.
9. Yetişkin hesabından çıkış ve başka yetişkin hesabı ile giriş: önceki yetişkinin bağlı çocuğu buluttan erişilebilir olmamalı.
10. Test profilini ebeveyn alanında açık onayla sil; bulut silme doğrulansın. İkinci cihaz eşitlendiğinde profil geri doğmamalı.

## Beklenen kanıt
- Her adımda A ve B: aynı profil ID; toplam yıldız; tamamlanan Hayvan Çayırı ve Renk Korusu görevi; sınıf ve İngilizce tercihi.
- Çevrimdışı işlemler ve bağlantı geldikten sonraki idempotent senkronizasyon sonuçları.
- Başarı mesajı yalnızca sunucu yanıtı doğrulanınca gösterilmeli.
- Ödeme, Play Store, Vercel deploy bu kapanışın parçası değildir.

**Kapanış kararı:** Gerçek iki cihaz/hesap testleri ve npm audit triage tamamlanmadan P0–P2 'DONE' değildir.
