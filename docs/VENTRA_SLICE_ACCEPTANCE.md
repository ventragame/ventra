# Ventra P2 + Renk Korusu — Acceptance

## Durum
- Bu commit kaynak kodu günceller; otomatik Vercel dağıtımı kapalıdır.
- Gerçek iki cihazlı senkronizasyon ve cihaz üzerinde Android/iOS QA henüz tamamlanmadı.
- Kullanıcı Supabase SQL migration'ını SQL Editor ile uyguladığını bildirdi.
- Cloud metadata kolonlarını kullanmak için yerelde apps/web/.env.local içinde NEXT_PUBLIC_VENTRA_CLOUD_METADATA_V2=true etkinleştirilmelidir.

## Zorunlu testler
1. npm run type-check
2. npm --workspace=apps/web test
3. npm run build:web
4. npm run export:mobile
5. İki cihazla yetişkin hesabında A→B ve B→A senkronizasyonu; çocuk kimliği, yıldız, sınıf/İngilizce düzeyi.
6. Offline oyun ve tekrar kayıt; çift yıldız oluşmaması; farklı yetişkin hesaplarının izolasyonu.
7. Renk Korusu'nda doğru cevap feedback'i, bilinçli devam, replay ve sessiz mod.

Not: Gerçek Supabase veri bütünlüğü testleri ve native cihaz QA yapılmadan P2 tamamlandı sayılmaz.
