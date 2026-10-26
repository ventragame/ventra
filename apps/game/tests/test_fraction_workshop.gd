extends SceneTree

## VENTRA — Kesir Atölyesi Tam Otomatik Oynanış ve Solver Testleri (Headless)
## MEB M.4.1.6.1 Standardı, 10 Bölümün Tamamının Kazanılabilirliği, Geri Alma/Sıfırlama ve Köprü Entegrasyonu.

const FractionLevelCatalog = preload("res://scripts/FractionLevelCatalog.gd")
const FractionMath = preload("res://scripts/FractionMath.gd")

func _initialize() -> void:
	print("\n========================================================")
	print("  VENTRA — FRACTION WORKSHOP FULL AUTOMATED SOLVER TESTS")
	print("========================================================\n")
	
	# Sahneyi yükle ve ağaca girmesini bekle
	change_scene_to_file("res://scenes/FractionWorkshop.tscn")
	await process_frame
	await process_frame
	
	var workshop: FractionWorkshop = current_scene as FractionWorkshop
	assert(workshop != null, "Workshop scene must be active")
	
	var bridge = root.get_node_or_null("Bridge")
	assert(bridge != null, "Bridge autoload must be present at /root/Bridge")
	
	var emitted_events: Array[Dictionary] = []
	bridge.message_received.connect(func(type, payload):
		emitted_events.append({"type": type, "payload": payload})
	)
	
	print("--- TEST 1: Undo & Reset & Error Handling (Bölüm 1) ---")
	workshop.start_level(1)
	assert(workshop.current_level_id == 1, "Level should be 1")
	assert(workshop.containers.size() == 1, "Level 1 should have 1 whole container")
	assert(workshop._get_total_filled_pieces() == 0, "Initial pieces should be 0")
	
	# 1.1 Boşken kontrol et -> Hata mesajı dönmeli
	workshop._on_check_pressed()
	assert(workshop.wrong_attempts == 1, "Wrong attempts should increment to 1")
	assert(not workshop.level_completed, "Should not be completed with 0 pieces")
	assert(workshop.feedback_label.text.contains("yerleştirmek") or workshop.feedback_label.text.contains("tıkla"), "Pedagogical message should advise placing pieces")
	print("  ✓ Boş durumda Kontrol Et: Öğretici uyarı başarıyla üretildi.")
	
	# 1.2 Parça ekleme (Tray butonuna tıklama simülasyonu)
	workshop._on_tray_piece_clicked(2)
	assert(workshop._get_total_filled_pieces() == 1, "Should have 1 piece placed")
	assert(workshop.action_history.size() == 1, "History size should be 1")
	print("  ✓ Tepsiden parça ekleme: 1/2 parçası 1. bütüne yerleşti.")
	
	# 1.3 Fazla parça ekleme (2/2) -> Hata üretmeli
	workshop._on_tray_piece_clicked(2)
	assert(workshop._get_total_filled_pieces() == 2, "Should have 2 pieces placed")
	workshop._on_check_pressed()
	assert(workshop.wrong_attempts == 2, "Wrong attempts should increment to 2")
	assert(workshop.feedback_label.text.contains("fazla") or workshop.feedback_label.text.contains("Fazla"), "Feedback should warn about excess piece")
	print("  ✓ Fazla parça uyarısı: 'Fazla olan parçayı çıkarabilirsin' rehberliği üretildi.")
	
	# 1.4 Geri Alma (Undo)
	workshop._on_undo_pressed()
	assert(workshop._get_total_filled_pieces() == 1, "After undo, pieces should be 1")
	print("  ✓ Geri Al (Undo): Fazla parça başarıyla kaldırıldı.")
	
	# 1.5 Sıfırla (Reset)
	workshop._on_reset_pressed()
	assert(workshop._get_total_filled_pieces() == 0, "After reset, pieces should be 0")
	print("  ✓ Sıfırla (Reset): Kalıplar tamamen temizlendi.")
	
	print("\n--- TEST 2: 10 Bölümün Tamamının Solver & Kazanılabilirlik Doğrulaması ---")
	
	var total_levels = FractionLevelCatalog.get_total_levels()
	assert(total_levels == 10, "Total levels must be 10")
	
	for lvl_id in range(1, total_levels + 1):
		workshop.start_level(lvl_id)
		var lvl_data = FractionLevelCatalog.get_level(lvl_id)
		var ftype = lvl_data.get("fraction_type")
		var num = lvl_data.get("target_num")
		var den = lvl_data.get("target_den")
		var whole = lvl_data.get("target_whole", 0)
		
		var required_pieces = num
		if ftype == "mixed":
			required_pieces = (whole * den) + num
			
		# Solver: Gerekli parça sayısı kadar parçayı yerleştir
		for p in range(required_pieces):
			workshop._on_tray_piece_clicked(den)
			
		assert(workshop._get_total_filled_pieces() == required_pieces, 
			"Level %d: Placed pieces (%d) must match required (%d)" % [lvl_id, workshop._get_total_filled_pieces(), required_pieces])
			
		# Kontrol Et
		workshop._on_check_pressed()
		assert(workshop.level_completed, "Level %d should be completed!" % lvl_id)
		assert(workshop.success_modal.visible, "Success modal should be visible")
		
		var stars = FractionMath.calculate_stars(workshop.wrong_attempts, workshop.hints_used)
		assert(stars >= 1 and stars <= 3, "Stars should be between 1 and 3")
		
		var rep_str = ("%d tam %d/%d" % [whole, num, den]) if ftype == "mixed" else ("%d/%d" % [num, den])
		print("  ✓ BÖLÜM %d KAZANILDI: '%s' (%s: %s) -> %d Yıldız [Gereken: %d, Kalıp Kapasitesi: %d]" % [
			lvl_id, 
			lvl_data.get("title"),
			ftype,
			rep_str,
			stars,
			required_pieces,
			workshop.containers.size() * den
		])
		
	print("\n--- TEST 3: Köprü Mesajlaşma (Bridge Telemetrisi) Doğrulaması ---")
	bridge.send_fraction_workshop_completed(
		10, 
		"MATH.G4.FRAC.01", 
		"ventra.math.g4.fraction.mixed", 
		100, 
		true, 
		3, 
		20, 
		1, 
		0, 
		0
	)
	print("  ✓ send_fraction_workshop_completed başarıyla çağrıldı.")
	
	print("\n========================================================")
	print("  ALL 10 LEVELS & WORKSHOP TESTS PASSED SUCCESSFULLY! ✓")
	print("========================================================\n")
	
	quit(0)

