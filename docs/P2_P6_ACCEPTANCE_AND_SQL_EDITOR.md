# Ventra P2 güvenilirlik ve P6.1 okul/sınıf kabul kılavuzu
**Kod tarihi:** 2026-11-01 | **Dağıtım:** GitHub main (canlı Supabase'e SQL otomatik uygulanmaz).

## Yapılan P2 güçlendirmeleri
- Yerel bulut eşitleme olayları 100'lük gruplarla yüklenir, yazma onayı gelmeden işaretlenmez; 500'lük sayfalama 1000'den büyük event geçmişini kesmez.
- Silinmiş çocuk profili için eskiden sadece `deleted_at` işaretlemek yerine, artık `delete_child_profile` sunucu RPC'si çağrılır. Bu işlem olayları siler, nickname ve sınıf/diğer metadata'yı anonimize eder.
- Tekrarlanan silme çağrısı yalnızca aynı ebeveyne ait anonimleştirilmiş, geçerli tombstone SELECT ile onaylanır. Başka hesap, silinmemiş profil veya eski takma ad başarı sayılmaz.
- PGlite PostgreSQL güvenlik testleri, gerçek iki rol izolasyonu, eklenti olmayan istemci işlemleri ve çoklu cihaz simülasyonu ile sınanır.
- **AÇIK:** Doğrudan iki fiziksel cihazda aynı Supabase hesabıyla A→B/B→A, offline tekrar, farklı hesap ve canlı silme işlemleri bu ortamda yapılmadı. SQL migration uygulanmış mı bilinmiyor. P2 henüz kesin DONE değildir.

## SQL Editor — sıra / tekrarsız kuruluma dikkat
Önce Supabase projesinin doğru ortam olduğunu ve SQL dosyalarının yedeğini doğrula.
Aşağıdaki dosyalar repoda bulunur; Supabase SQL Editor'da sırayla çalıştırılmalıdır.
1. `supabase/migrations/20261026000000_player_profiles_and_sync.sql` — **yalnızca ilk kurulumda**.
2. `supabase/migrations/20261026000001_harden_rls_and_reconcile_history.sql` — eksikse.
3. `supabase/migrations/20261101000000_kids_learning_metadata.sql` — sınıf/İngilizce seviyesi için.
4. `supabase/migrations/20261101000001_delete_child_profile_atomically.sql` — gizlilik ve atomik silme için.
5. `supabase/migrations/20261101000002_school_classrooms_rls.sql` — okul/sınıf/öğretmen/veli RLS için.

SQL Editor yüksek yetkilidir. Önceden uygulanmış veya üretimde uyarlanmış şemaya 1 ve 2'yi körlemesine tekrar uygulama.
Kod otomatik database migration çalıştırmaz. **3 ve 4'ten sonra** uygulama ortamında
`NEXT_PUBLIC_VENTRA_CLOUD_METADATA_V2=true` etkinleştirilmeli; canlı şema kontrolü yapılmadan açılmamalı.

## Read-only SQL doğrulaması (SQL Editor'da)
```sql
select
 to_regclass('public.player_profiles') is not null as p2_profiles,
 to_regclass('public.progress_events') is not null as p2_events,
 exists(select 1 from information_schema.columns where table_schema='public'
   and table_name='player_profiles' and column_name='grade_level') as p2_grade,
 to_regprocedure('public.delete_child_profile(uuid)') is not null as p2_atomic_delete,
 to_regclass('public.ventra_schools') is not null as p6_schools,
 to_regclass('public.ventra_classrooms') is not null as p6_classes,
 to_regprocedure('public.ventra_enroll_child(uuid,uuid)') is not null as p6_parent_join,
 to_regprocedure('public.ventra_teacher_roster(uuid)') is not null as p6_roster;
```
Bütün sütunlar `true` olmalı. Bu, sadece varlık kontrolüdür; RLS ve gerçek cihaz kabulünü tek başına kanıtlamaz.

## P2 gerçek iki cihaz kabul senaryosu
- [ ] Yetişkin A hesabına giriş yapıp profil P'yi açıkça bağla; cihaz A'da seviye ve yıldız kaydet.
- [ ] Aynı yetişkin hesabıyla cihaz B'de buluttan P'yi geri getir; profil UUID, yıldızlar ve sınıf/İngilizce seviyesi eşleşsin.
- [ ] Cihaz B offline iken farklı oyun görevi tamamla; yeniden online olup eşitle, A'da birleşsin.
- [ ] Aynı event tekrar çekildiğinde çift yıldız/çift öğrenme kanıtı oluşmasın.
- [ ] İki farklı yetişkin hesabında aynı çocuk UUID'si veya profil verisi sızmasın.
- [ ] Ebeveyn P'yi kalıcı silsin; B'de tekrar geri yüklemeye çalışıldığında veri dirilmesin, olay kanıtları temizlensin.
- [ ] Ebeveyn oturumu değiştirildiğinde önceki yetişkinin profili izinsiz okula katılamasın.
- [ ] Ücretli coin: P5 local ledger iki cihazda eşitlenmediği için YAYIN İÇİN KAPALI kalır.

## P6.1 kodlanan kullanıcı akışı
1. `/kids → Okulumla Oyna → /school`. Yetişkin e-posta OTP ile giriş yapar.
2. Öğretmen okul çalışma alanını açar (ilk hali **doğrulanmamış**), sınıf adını ve 1–8 düzeyini seçer.
3. Öğretmen 7 gün / 30 kullanımlık tahmin edilemez sınıf davet kodu üretir; kod yalnızca yaratıldığı anda gösterilir.
4. Ebeveyn aynı sayfada `Ebeveyn Katılımı` moduna geçer, **kendi** buluta bağlı çocuk profilini seçer ve daveti onaylar.
5. Öğretmen sadece o sınıfa veli onayıyla bağlanan çocukların takma adı, sınıf seviyesi, toplam tamamlanan görev ve yıldız özetini görür. Ham yanlışlar, e-posta veya çocukla iletişim bilgisi açılmaz.
6. Ebeveyn sınıf bağlantısını kaldırabilir, çocuğu silince tüm bağlantıları temizleyen trigger vardır.

## P6.1 yayın ve güvenlik kabulü
- [ ] Migration çalıştırıldı ve preflight 8/8 true.
- [ ] Gerçek Supabase hesabı ile öğretmen okul/sınıf oluşturdu.
- [ ] Farklı bir yetişkin aynı okulu ve davet kodu tablosunu okuyamadı.
- [ ] Velinin kod kullanımı çalıştı; yabancı profil ID ile enroll reddedildi.
- [ ] Öğretmen roster yalnızca katılmış çocukları ve özet bilgileri gösterdi.
- [ ] Veli katılımı kaldırınca rosterdan çıktı, çocuk silince bağlantı temizlendi.
- [ ] Mobil ekran/klavye/ekran okuyucu ve iOS/Android testleri.
- [ ] Gerçek okul/öğretmen kimliği doğrulama, lisanslama ve kurumsal kullanıma açmadan önce tamamlanmalı.

### P6.2 sonrasına bırakılanlar
Birden çok öğretmen hesabı daveti, ödev atama, okul doğrulaması ve lisansı, sınıf teması yönetimi, gelişmiş analitik ve P5 coin bulut muhasebesi.

**Dürüst kabul:** GitHub CI'nin yeşil olması canlı Supabase uygulandığı, fiziksel cihazlarda senkron çalıştığı veya okulun doğrulandığı anlamına gelmez.
