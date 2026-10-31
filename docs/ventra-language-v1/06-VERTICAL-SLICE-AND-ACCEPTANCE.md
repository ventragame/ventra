# VENTRA — DİL ÖĞRENME PLATFORMU V1
## 06: İlk Dikey Dilim (Vertical Slice) ve Kabul Kriterleri

---

## 1. Dikey Dilim (Vertical Slice) Kapsamı ve Hedefi

> [!IMPORTANT]
> **Tasarım Statüsü:** Bu belgede tanımlanan "Kelime Bahçesi", "Hayvanlar" konusu ve 5 adımlı akış; ilk çalışan dikey dilimi somutlaştırmak için hazırlanmış **onay bekleyen öneri (PROPOSED) tasarımdır**. Nihai içerik kararı kullanıcı onayına tabidir.

### Temel Hedef:
Tüm mimariyi uçtan uca (Frontend UI -> Phaser Canvas -> Yerel IndexedDB -> Supabase Bulut -> Android APK) çalışan, test edilebilir ve pedagojik olarak tutarlı **tek bir mikro-deneyimle** doğrulamak.

* **Bölge:** Kelime Bahçesi *(Word Garden)*
* **Hedef Kitle:** 7–12 Yaş (Kids World)
* **Kazanım:** A1 Başlangıç İngilizcesi — Evcil & Bahçe Hayvanları (`cat`, `dog`, `bird`, `rabbit`).
* **Hedef Süre:** 3–5 dakika.

---

## 2. Ekran Bazında Uygulanacak İşlevler

| Ekran No | Ekran Adı | Görsel / Teknik Kapsam | Kabul Kriteri |
| :---: | :--- | :--- | :--- |
| **E1** | **Profil & Giriş** | Mevcut profil seçici açılır; Kaşif çocuk profili seçilir. | Seçilen profilin takma adı ve avatarı üst bara yansımalı. |
| **E2** | **Dünya Haritası** | Phaser 3 sahnesi: Ortada uykuda (pastel tonlu) "Kelime Bahçesi" adası. | Ada tıklanabilir olmalı; üzerine gelindiğinde hafifçe parlamalıdır. |
| **E3** | **Geçiş Animasyonu** | Adanın seçilmesiyle kamera yakınlaşır, beyaz bulutlar ekrandan geçer. | 600–800 ms içinde takılmasız (60 FPS) yumuşak geçiş. |
| **E4** | **Bölge Patikası** | 5 Düğümlü baloncuklu öğrenme yolu belirir. 1. Düğüm aktiftir, 2–5 kilitlidir. | Düğüm 1 parlamalı; kilitli düğümlere dokunulduğunda kilit uyarısı vermelidir. |
| **E5** | **Adım 1: Keşfet** | 4 büyük etkileşimli hayvan kartı. | Her karta dokunulduğunda görsel büyümeli ve İngilizce telaffuz net çalmalıdır. |
| **E6** | **Adım 2: Eşleştir** | 4 hayvan resmi sol tarafta, 4 İngilizce kelime sağ tarafta. | Sürükleyerek veya sırayla dokunarak eşleme yapılabilmeli; doğru eşleşmede yeşil çizgi kalmalıdır. |
| **E7** | **Adım 3: Dinle** | Ses düğmesi rastgele bir hayvanın adını söyler (örn: "Rabbit"). 3 seçenek. | Doğru hayvana dokunulduğunda tebrik efekti; yanlışta ses tekrar çalmalıdır. |
| **E8** | **Adım 4: Uygula** | Yönerge: "Feed the cat with milk". Ekranda kedi ve süt şişesi. | Süt kediye sürüklendiğinde kedi içmeli, mırlamalı ve teşekkür etmelidir. |
| **E9** | **Adım 5: Mini Görev** | Bahçedeki 4 boş yuvaya doğru hayvanlar yerleştirilir. | 4 hayvan doğru yuvasına girdiğinde bahçe canlanma sekansı tetiklenmelidir. |
| **E10** | **Başarı Ekranı** | 3 Yıldız animasyonu, 100 skor, bahçenin yeşerip çiçek açtığı canlanma sahnesi. | "Haritaya Dön" tıklandığında dünya haritasında bahçe artık renkli görünmelidir. |

---

## 3. Kabul Kriterleri (Acceptance Criteria)

### A. Fonksiyonel Kriterler:
1. **Çift Yönlü İletişim:** Phaser oyunundaki `PHASER_NODE_COMPLETED` olayı React arayüzüne ve IndexedDB deposuna gecikmesiz iletilmelidir.
2. **Çevrimdışı Çalışabilirlik:** Cihaz uçak modundayken bölüm baştan sona oynanabilmeli, yıldızlar yerel hafızaya kaydedilmeli ve uygulama kapatılıp açıldığında korunmalıdır.
3. **Bulut Eşitlemesi:** İnternet bağlantısı sağlandığında yerel etkinlikler Supabase `progress_events` tablosuna arka planda hatasız aktarılmalıdır.
4. **Profil İzolasyonu:** "Can" profilinde kazanılan yıldızlar, başka bir çocuk profili seçildiğinde görünmemelidir.

### B. Performans ve Mobil Kalite Kriterleri:
* **Kare Hızı (FPS):** Standart mobil tarayıcı ve Android WebView'da en az **55 FPS** (hedef: 60 FPS).
* **İlk Yükleme Süresi:** İlk açılışta Phaser motoru ve asset'lerin yüklenmesi 3G/4G bağlantıda **2 saniyenin altında** tamamlanmalıdır.
* **Bellek Tüketimi (RAM):** Tarayıcı bellek kullanımı tepe noktada **120 MB'ı** aşmamalıdır (iOS WKWebView çökme güvencesi).
* **Dokunma Alanı (Touch Hitbox):** Tüm interaktif buton ve nesnelerin dokunma alanı **en az 48x48 piksel** olmalıdır.
* **Erişilebilirlik:** Metin ve arka plan kontrast oranı minimum **4.5:1 (WCAG AA)**, ideal olarak **7:1 (WCAG AAA)** olmalıdır.

---

## 4. Kapsam Dışında Bırakılanlar (Out of Scope for V1)

Aşağıdaki özellikler V1 dikey diliminde **kesinlikle yer almayacaktır**:
* ❌ Yapay zeka (LLM) destekli konuşma ve telaffuz değerlendirme motoru.
* ❌ 13+ Life World kod geliştirmesi (yalnızca vizyon ve akışta tanımlı kalacaktır).
* ❌ İkinci veya üçüncü bölgeler (Orman, Şehir, Ada).
* ❌ Çoklu dil desteği (yalnızca Başlangıç İngilizcesi geliştirilecektir).
* ❌ Sosyal özellikler, liderlik tabloları ve çok oyunculu modlar.
* ❌ Şehir kurma, envanter yönetimi veya kaynak toplama mekanikleri.

