extends SceneTree

## VENTRA — Kesir Köprüsü Tam Otomatik Oynanış ve Solver Testleri (Headless)
## MEB M.4.1.6.2 Standardı, 10 Bölümün Tamamının Matematiksel Doğruluğu,
## Didaktik Hata Geri Bildirimleri, Geri Alma/Sıfırlama ve Köprü Entegrasyonu.

const FractionBridgeLevelCatalog = preload("res://scripts/FractionBridgeLevelCatalog.gd")
const FractionBridgeScript = preload("res://scripts/FractionBridge.gd")
const FractionBridgePlankScript = preload("res://scripts/FractionBridgePlank.gd")
const FractionBridgeSlotScript = preload("res://scripts/FractionBridgeSlot.gd")

func _initialize() -> void:
	print("\n========================================================")
	print("  VENTRA — FRACTION BRIDGE FULL AUTOMATED SOLVER TESTS")
	print("========================================================\n")
	
	# 1. Katalog Seviye ve Matematiksel Doğruluk Testi
	print("--- TEST 1: 10 Bölümlük Katalog Doğrulaması ---")
	var total_levels = FractionBridgeLevelCatalog.get_total_levels()
	assert(total_levels == 10, "Katalog tam 10 bölüm içermeli")
	
	var all_levels = FractionBridgeLevelCatalog.get_all_levels()
	assert(all_levels.size() == 10, "Katalog listesi 10 bölüm döndürmeli")
	
	for lvl_data in all_levels:
		var lvl_id: int = lvl_data.get("id", 0)
		assert(lvl_id > 0, "Bölüm ID pozitif olmalı")
		assert(lvl_data.get("outcome_id") == "M.4.1.6.2", "Kazanım M.4.1.6.2 olmalı: Bölüm %d" % lvl_id)
		assert(lvl_data.get("skill_id") == "ventra.math.g4.fraction.unit_comparison", "Beceri doğru olmalı: Bölüm %d" % lvl_id)
		
		var req_fractions: Array = lvl_data.get("required_fractions", [])
		var tray_pieces: Array = lvl_data.get("tray_pieces", [])
		var order_type: String = lvl_data.get("order_type", "")
		
		assert(req_fractions.size() >= 2, "En az 2 kalas yuvası olmalı: Bölüm %d" % lvl_id)
		assert(tray_pieces.size() >= req_fractions.size(), "Tepsisindeki parça sayısı yeterli olmalı: Bölüm %d" % lvl_id)
		
		# MEB Sınırı Kontrolü: Payda <= 20
		for frac in tray_pieces:
			var den: int = frac.get("den", 0)
			assert(den >= 2 and den <= 20, "Payda MEB 4. sınıf sınırlarında (2..20) olmalı: %d (Bölüm %d)" % [den, lvl_id])
			
		# Matematiksel Sıralama Tutarlılığı Testi
		for i in range(req_fractions.size() - 1):
			var d1: int = req_fractions[i].get("den", 0)
			var d2: int = req_fractions[i + 1].get("den", 0)
			if order_type == "desc":
				assert(d1 < d2, "Azalan sırada 1/%d > 1/%d olmalı (payda %d < %d)" % [d1, d2, d1, d2])
			else:
				assert(d1 > d2, "Artan sırada 1/%d < 1/%d olmalı (payda %d > %d)" % [d1, d2, d1, d2])
				
		print("  ✓ Bölüm %d: %s (%s, %d yuva) matematiksel doğruluğu onaylandı." % [lvl_id, lvl_data.get("title"), order_type, req_fractions.size()])
		
	# 2. Sahne ve Kontrolör Başlatma
	print("\n--- TEST 2: FractionBridge Sahnesi ve Kontrolleri ---")
	change_scene_to_file("res://scenes/FractionBridge.tscn")
	await process_frame
	await process_frame
	
	var bridge_game = current_scene
	assert(bridge_game != null, "FractionBridge sahnesi yüklenebilmeli")
	
	var bridge_autoload = root.get_node_or_null("Bridge")
	assert(bridge_autoload != null, "Bridge autoload mevcut olmalı")
	
	var emitted_events: Array[Dictionary] = []
	bridge_autoload.message_received.connect(func(type, payload):
		emitted_events.append({"type": type, "payload": payload})
	)
	
	# Bölüm 1'i başlat (Azalan: 1/2 > 1/4)
	bridge_game.start_level(1)
	assert(bridge_game.current_level_id == 1, "Aktif bölüm 1 olmalı")
	assert(bridge_game.slots.size() == 2, "Bölüm 1'de 2 yuva olmalı")
	assert(bridge_game.tray_box.get_child_count() == 2, "Tepside 2 kalas olmalı")
	
	# 2.1 Hatalı Yerleşim Testi (1/4 yuva 0'a, 1/2 yuva 1'e konursa hata vermelidir)
	var plank_half = null
	var plank_quarter = null
	for child in bridge_game.tray_box.get_children():
		if child.get("denominator") == 2: plank_half = child
		elif child.get("denominator") == 4: plank_quarter = child
			
	assert(plank_half != null and plank_quarter != null, "1/2 ve 1/4 kalasları bulunmalı")
	
	# Ters yerleştir
	bridge_game._place_plank_in_slot(plank_quarter, bridge_game.slots[0])
	bridge_game._place_plank_in_slot(plank_half, bridge_game.slots[1])
	
	bridge_game._on_test_bridge_pressed()
	await create_timer(1.2).timeout
	
	assert(bridge_game.wrong_attempts == 1, "Yanlış deneme sayısı artmalı")
	assert(bridge_game.feedback_label.text.contains("küçüktür") or bridge_game.feedback_label.text.contains("Hata"), "Öğretici didaktik uyarı verilmeli")
	print("  ✓ Hatalı yerleşim: Didaktik geri bildirim başarıyla görüntülendi.")
	
	# 2.2 Geri Alma (Undo) Testi
	bridge_game._on_undo_pressed()
	assert(bridge_game.slots[1].current_plank == null, "Son yuva geri alınmış olmalı")
	print("  ✓ Geri Alma (Undo) testi başarılı.")
	
	# 2.3 Sıfırlama (Reset) Testi
	bridge_game._on_reset_pressed()
	for s in bridge_game.slots:
		assert(s.current_plank == null, "Tüm yuvalar boşaltılmalı")
	assert(bridge_game.tray_box.get_child_count() == 2, "Tüm kalaslar tepsiye dönmeli")
	print("  ✓ Sıfırla (Reset) testi başarılı.")
	
	# 2.4 Doğru Yerleşim ve Geçiş Testi (Bölüm 1)
	bridge_game._place_plank_in_slot(plank_half, bridge_game.slots[0])
	bridge_game._place_plank_in_slot(plank_quarter, bridge_game.slots[1])
	bridge_game._on_test_bridge_pressed()
	await create_timer(1.8).timeout
	
	assert(bridge_game.level_completed, "Bölüm 1 tamamlanmış olmalı")
	assert(bridge_game.success_modal.visible, "Başarı modalı açılmalı")
	print("  ✓ Doğru yerleşim: Karakter köprüyü geçti, Bölüm 1 tamamlandı.")
	
	# 3. Tüm 10 Bölümün Tamamlanabilirlik (Solver) Testi
	print("\n--- TEST 3: Tüm 10 Bölümün Otomatik Çözüm ve Köprü Bildirimi Doğrulaması ---")
	for lvl_id in range(1, 11):
		bridge_game.start_level(lvl_id)
		var lvl_info = bridge_game.current_level_data
		var reqs: Array = lvl_info.get("required_fractions", [])
		
		# Her yuva için doğru paydadaki kalası bulup yerleştir
		for slot_idx in range(reqs.size()):
			var target_den = reqs[slot_idx].get("den")
			var candidate = null
			for child in bridge_game.tray_box.get_children():
				if child.get("denominator") == target_den and not child.get("is_placed"):
					candidate = child
					break
			assert(candidate != null, "Bölüm %d yuva %d için 1/%d kalası bulunamadı" % [lvl_id, slot_idx, target_den])
			bridge_game._place_plank_in_slot(candidate, bridge_game.slots[slot_idx])
			
		bridge_game._on_test_bridge_pressed()
		await create_timer(1.8).timeout
		assert(bridge_game.level_completed, "Bölüm %d çözülebilir olmalı!" % lvl_id)
		print("  ✓ Bölüm %d (%s) başarıyla otomatik çözüldü." % [lvl_id, lvl_info.get("title")])
		
	print("\n========================================================")
	print("  KESİR KÖPRÜSÜ TÜM TESTLER EKSİKSİZ BAŞARILI OLDU!")
	print("========================================================\n")
	quit(0)

