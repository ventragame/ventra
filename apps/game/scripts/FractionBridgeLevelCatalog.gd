class_name FractionBridgeLevelCatalog
extends RefCounted

## VENTRA — Kesir Köprüsü (Fraction Bridge) Bölüm Kataloğu
## MEB M.4.1.6.2 standardı: Birim kesirleri karşılaştırır ve sıralar.
## Ventra İç Beceri Sözleşmesi: ventra.math.g4.fraction.unit_comparison

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
		# --- BÖLÜM 1: Temel Karşılaştırma — Yarım, Üçte Bir, Çeyrek (1/2 > 1/3 > 1/4) ---
		{
			"id": 1,
			"title": "Yarım, Üçte Bir, Çeyrek",
			"order_type": "desc", # Büyükten Küçüğe (>)
			"comparison_operator": ">",
			"required_fractions": [
				{"num": 1, "den": 2},
				{"num": 1, "den": 3},
				{"num": 1, "den": 4}
			],
			"tray_pieces": [
				{"num": 1, "den": 4},
				{"num": 1, "den": 2},
				{"num": 1, "den": 3}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "Tahtaları büyükten küçüğe dizerek köprüyü tamamla!",
			"hint_text": "Bir bütün daha çok parçaya bölündükçe her parça küçülür! 1/2 (yarım), 1/4'ten (çeyrek) daha büyüktür: 1/2 > 1/3 > 1/4."
		},
		
		# --- BÖLÜM 2: Üçte Bir ve Altıda Bir ---
		{
			"id": 2,
			"title": "Vadi Geçişi: 1/3 ve 1/6",
			"order_type": "desc",
			"comparison_operator": ">",
			"required_fractions": [
				{"num": 1, "den": 3},
				{"num": 1, "den": 6}
			],
			"tray_pieces": [
				{"num": 1, "den": 6},
				{"num": 1, "den": 3}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "1/3 ve 1/6 parçalarını BÜYÜKTEN KÜÇÜĞE ( > ) yerleştir.",
			"hint_text": "Paydası küçük olan birim kesir daha büyüktür. 3 < 6 olduğu için 1/3 > 1/6'dır."
		},
		
		# --- BÖLÜM 3: Üçlü Kemer — 2'nin Katları (Azalan Sıra) ---
		{
			"id": 3,
			"title": "Üç Basamaklı Kemer",
			"order_type": "desc",
			"comparison_operator": ">",
			"required_fractions": [
				{"num": 1, "den": 2},
				{"num": 1, "den": 4},
				{"num": 1, "den": 8}
			],
			"tray_pieces": [
				{"num": 1, "den": 8},
				{"num": 1, "den": 2},
				{"num": 1, "den": 4}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "3 parçayı BÜYÜKTEN KÜÇÜĞE ( 1/2 > 1/4 > 1/8 ) doğru diz.",
			"hint_text": "Payda iki katına çıktıkça parça boyu yarıya iner: 1/2 en uzun, 1/8 en kısadır."
		},
		
		# --- BÖLÜM 4: Tırmanış Köprüsü — Küçükten Büyüğe (<) ---
		{
			"id": 4,
			"title": "Tırmanış Köprüsü (Küçükten Büyüğe)",
			"order_type": "asc", # Küçükten Büyüğe (<)
			"comparison_operator": "<",
			"required_fractions": [
				{"num": 1, "den": 10},
				{"num": 1, "den": 5},
				{"num": 1, "den": 2}
			],
			"tray_pieces": [
				{"num": 1, "den": 2},
				{"num": 1, "den": 10},
				{"num": 1, "den": 5}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "DİKKAT: Bu köprüde tahtaları KÜÇÜKTEN BÜYÜĞE ( < ) doğru dizmelisin!",
			"hint_text": "Küçükten büyüğe sıralarken paydası EN BÜYÜK olan en küçüktür: 1/10 < 1/5 < 1/2."
		},
		
		# --- BÖLÜM 5: Tek Sayılı Paydalar ---
		{
			"id": 5,
			"title": "Taş Kemer: 1/3, 1/5, 1/7",
			"order_type": "desc",
			"comparison_operator": ">",
			"required_fractions": [
				{"num": 1, "den": 3},
				{"num": 1, "den": 5},
				{"num": 1, "den": 7}
			],
			"tray_pieces": [
				{"num": 1, "den": 5},
				{"num": 1, "den": 7},
				{"num": 1, "den": 3}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "Tek sayılı paydaları BÜYÜKTEN KÜÇÜĞE ( > ) doğru sırala.",
			"hint_text": "Bütün 7 eş parçaya bölündüğünde her dilim küçülür. Sıralama: 1/3 > 1/5 > 1/7."
		},
		
		# --- BÖLÜM 6: Dört Parçalı Kemer ---
		{
			"id": 6,
			"title": "Nehir Geçidi: 4 Parçalı Sıralama",
			"order_type": "desc",
			"comparison_operator": ">",
			"required_fractions": [
				{"num": 1, "den": 2},
				{"num": 1, "den": 3},
				{"num": 1, "den": 4},
				{"num": 1, "den": 6}
			],
			"tray_pieces": [
				{"num": 1, "den": 4},
				{"num": 1, "den": 2},
				{"num": 1, "den": 6},
				{"num": 1, "den": 3}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "4 farklı tahtayı BÜYÜKTEN KÜÇÜĞE ( > ) dizerek geçidi tamamla.",
			"hint_text": "Paydaları küçükten büyüğe incele: 2, 3, 4, 6. Kesir sırası: 1/2 > 1/3 > 1/4 > 1/6."
		},
		
		# --- BÖLÜM 7: İnce Parçalar — Artan Sıra (<) ---
		{
			"id": 7,
			"title": "İnce Parçalar Tırmanışı",
			"order_type": "asc",
			"comparison_operator": "<",
			"required_fractions": [
				{"num": 1, "den": 12},
				{"num": 1, "den": 8},
				{"num": 1, "den": 6},
				{"num": 1, "den": 4}
			],
			"tray_pieces": [
				{"num": 1, "den": 6},
				{"num": 1, "den": 12},
				{"num": 1, "den": 4},
				{"num": 1, "den": 8}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "KÜÇÜKTEN BÜYÜĞE ( < ) doğru sırala. En küçük parçayı en başa koy!",
			"hint_text": "12 parçaya bölünen tahta (1/12) en incesidir: 1/12 < 1/8 < 1/6 < 1/4."
		},
		
		# --- BÖLÜM 8: Aralık Doldurma ve Çeldiriciler ---
		{
			"id": 8,
			"title": "Mühendislik Sınavı: Doğru Parçaları Seç",
			"order_type": "desc",
			"comparison_operator": ">",
			# Hedef: 1/2 > 1/3 > 1/4 > 1/6 köprüsünü kurmak.
			# Rafta 1/8 ve 1/10 gibi çeldiriciler var; oyuncu doğru 4'lüyü seçip sıralamalı!
			"required_fractions": [
				{"num": 1, "den": 2},
				{"num": 1, "den": 3},
				{"num": 1, "den": 4},
				{"num": 1, "den": 6}
			],
			"tray_pieces": [
				{"num": 1, "den": 8},
				{"num": 1, "den": 3},
				{"num": 1, "den": 10},
				{"num": 1, "den": 6},
				{"num": 1, "den": 2},
				{"num": 1, "den": 4}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "DİKKAT: Rafta fazladan parçalar var! 4 parçalık azalan köprü için doğru parçaları seç ve diz.",
			"hint_text": "Köprü 1/2'den 1/6'ya uzanmalı. 1/8 ve 1/10 parçaları bu köprü için fazla küçüktür."
		},
		
		# --- BÖLÜM 9: 5 Parçalı Büyük Asma Köprü ---
		{
			"id": 9,
			"title": "Büyük Asma Köprü (5 Basamak)",
			"order_type": "desc",
			"comparison_operator": ">",
			"required_fractions": [
				{"num": 1, "den": 2},
				{"num": 1, "den": 3},
				{"num": 1, "den": 4},
				{"num": 1, "den": 8},
				{"num": 1, "den": 16}
			],
			"tray_pieces": [
				{"num": 1, "den": 8},
				{"num": 1, "den": 16},
				{"num": 1, "den": 2},
				{"num": 1, "den": 4},
				{"num": 1, "den": 3}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "5 birim kesri BÜYÜKTEN KÜÇÜĞE ( > ) sıralayarak dev kanyonu aş.",
			"hint_text": "Sıralama: 1/2 > 1/3 > 1/4 > 1/8 > 1/16. Paydalar büyüdükçe tahtalar incelir!"
		},
		
		# --- BÖLÜM 10: MEB Sınırı (Payda 20) — Usta Mühendis Köprüsü ---
		{
			"id": 10,
			"title": "Usta Mühendis Köprüsü (Payda 20)",
			"order_type": "asc",
			"comparison_operator": "<",
			"required_fractions": [
				{"num": 1, "den": 20},
				{"num": 1, "den": 15},
				{"num": 1, "den": 10},
				{"num": 1, "den": 5},
				{"num": 1, "den": 2}
			],
			"tray_pieces": [
				{"num": 1, "den": 5},
				{"num": 1, "den": 20},
				{"num": 1, "den": 2},
				{"num": 1, "den": 10},
				{"num": 1, "den": 15}
			],
			"outcome_id": "M.4.1.6.2",
			"skill_id": "ventra.math.g4.fraction.unit_comparison",
			"description": "Usta Mühendislik görevi! 5 parçayı KÜÇÜKTEN BÜYÜĞE ( < ) sırala. Payda 20'ye dikkat et!",
			"hint_text": "En küçük birim kesir 1/20'dir (en büyük payda). Sıralama: 1/20 < 1/15 < 1/10 < 1/5 < 1/2."
		}
	]

