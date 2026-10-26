class_name FractionLevelCatalog
extends RefCounted

## VENTRA — Kesir Atölyesi Bölüm Kataloğu (10 Pedagojik Bölüm)
## MEB M.4.1.6.1 standardı ve Ventra İç Beceri Sözleşmesi

static func get_total_levels() -> int:
	return 10

static func get_level(level_id: int) -> Dictionary:
	var all_levels = get_all_levels()
	for lvl in all_levels:
		if lvl.get("id") == level_id:
			return lvl
	return all_levels[0]

static func get_all_levels() -> Array:
	return [
		# --- BÖLÜM 1–4: Basit Kesirler ve Bütün-Parça İlişkisi ---
		{
			"id": 1,
			"title": "Birim Kesir Tanışması",
			"fraction_type": "proper",
			"target_whole": 0,
			"target_num": 1,
			"target_den": 2,
			"wholes_count": 1,
			"pieces_per_whole": 2,
			"available_pieces": [
				{"num": 1, "den": 2, "count": 2}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.anatomy",
			"description": "Bir bütünü 2 eş parçaya böldük. Yarım (1/2) oluşturmak için 1 parça yerleştir.",
			"hint_text": "2 parçalı kalıba 1 adet 1/2 parçası yerleştirerek yarımı oluştur."
		},
		{
			"id": 2,
			"title": "Üçte İki (2/3)",
			"fraction_type": "proper",
			"target_whole": 0,
			"target_num": 2,
			"target_den": 3,
			"wholes_count": 1,
			"pieces_per_whole": 3,
			"available_pieces": [
				{"num": 1, "den": 3, "count": 3}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.proper",
			"description": "Bir bütün 3 eş parçaya bölündü. 2/3 elde etmek için 2 parçayı doldur.",
			"hint_text": "3 parçalı bütünden 2 tanesini doldurarak 2/3 modelini tamamla."
		},
		{
			"id": 3,
			"title": "Dörtte Üç (3/4)",
			"fraction_type": "proper",
			"target_whole": 0,
			"target_num": 3,
			"target_den": 4,
			"wholes_count": 1,
			"pieces_per_whole": 4,
			"available_pieces": [
				{"num": 1, "den": 4, "count": 4}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.proper",
			"description": "Çeyrek parçaları kullanarak 3/4 kesrini oluştur.",
			"hint_text": "Kalıba 3 adet 1/4 parça yerleştir."
		},
		{
			"id": 4,
			"title": "Altıda Beş (5/6)",
			"fraction_type": "proper",
			"target_whole": 0,
			"target_num": 5,
			"target_den": 6,
			"wholes_count": 1,
			"pieces_per_whole": 6,
			"available_pieces": [
				{"num": 1, "den": 6, "count": 6}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.visual_reading",
			"description": "6 eş parçadan 5'ini doldurarak bütüne çok yakın bir kesir modelle.",
			"hint_text": "6 dilimden 5 tanesini doldur; sadece 1 dilim boş kalmalı."
		},
		
		# --- BÖLÜM 5–7: Bileşik Kesirler ve Birden Fazla Bütün ---
		{
			"id": 5,
			"title": "Tam Bütün: Dörtte Dört (4/4)",
			"fraction_type": "improper",
			"target_whole": 0,
			"target_num": 4,
			"target_den": 4,
			"wholes_count": 1,
			"pieces_per_whole": 4,
			"available_pieces": [
				{"num": 1, "den": 4, "count": 4}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.improper",
			"description": "Payı paydasına eşit olan kesirler 1 tam bütündür (4/4 = 1).",
			"hint_text": "Bütünün tüm parçalarını (4/4) eksiksiz doldur."
		},
		{
			"id": 6,
			"title": "Bileşik Kesir: Dörtte Beş (5/4)",
			"fraction_type": "improper",
			"target_whole": 0,
			"target_num": 5,
			"target_den": 4,
			"wholes_count": 2,
			"pieces_per_whole": 4,
			"available_pieces": [
				{"num": 1, "den": 4, "count": 8}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.improper",
			"description": "1 bütünden fazlasını göstermek için ikinci bir bütün kalıbı gerekir (4/4 + 1/4).",
			"hint_text": "1. bütünü tamamen doldur (4 parça), 2. bütüne de 1 parça ekle."
		},
		{
			"id": 7,
			"title": "Bileşik Kesir: Üçte Yedi (7/3)",
			"fraction_type": "improper",
			"target_whole": 0,
			"target_num": 7,
			"target_den": 3,
			"wholes_count": 3,
			"pieces_per_whole": 3,
			"available_pieces": [
				{"num": 1, "den": 3, "count": 9}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.improper",
			"description": "7/3 kesri 2 tam bütünden fazladır (3/3 + 3/3 + 1/3 = 7/3).",
			"hint_text": "İlk iki bütünü tamamen doldur (6 parça), üçüncü bütüne 1 parça koy."
		},
		
		# --- BÖLÜM 8–10: Tam Sayılı Kesirler ve Kavramsal Uygulama ---
		{
			"id": 8,
			"title": "Tam Sayılı Kesir: 1 Tam 1/2",
			"fraction_type": "mixed",
			"target_whole": 1,
			"target_num": 1,
			"target_den": 2,
			"wholes_count": 2,
			"pieces_per_whole": 2,
			"available_pieces": [
				{"num": 1, "den": 2, "count": 4}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.mixed",
			"description": "1 tam bütün ve yarım parça (1 tam 1/2 = 3/2).",
			"hint_text": "1. kalıbı tam doldur (1 tam), 2. kalıba 1 parça (1/2) koy."
		},
		{
			"id": 9,
			"title": "Tam Sayılı Kesir: 1 Tam 2/3",
			"fraction_type": "mixed",
			"target_whole": 1,
			"target_num": 2,
			"target_den": 3,
			"wholes_count": 2,
			"pieces_per_whole": 3,
			"available_pieces": [
				{"num": 1, "den": 3, "count": 6}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.mixed",
			"description": "1 tam bütün ve üçte iki (1 tam 2/3 = 5/3).",
			"hint_text": "1. kalıbı tamamen doldur (3 parça), 2. kalıba 2 parça ekle."
		},
		{
			"id": 10,
			"title": "Büyük Adım: 2 Tam 1/4",
			"fraction_type": "mixed",
			"target_whole": 2,
			"target_num": 1,
			"target_den": 4,
			"wholes_count": 3,
			"pieces_per_whole": 4,
			"available_pieces": [
				{"num": 1, "den": 4, "count": 12}
			],
			"outcome_id": "MATH.G4.FRAC.01",
			"skill_id": "ventra.math.g4.fraction.mixed",
			"description": "2 tam bütünü tamamen doldur ve 3. bütünden 1 çeyrek parça yerleştir (2 tam 1/4 = 9/4).",
			"hint_text": "İlk 2 bütünü 4'er parça ile doldur (8 parça), 3. bütüne 1 parça koy."
		}
	]

