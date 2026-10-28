extends SceneTree

## VENTRA — Kesir Köprüsü v2 Otomatik Solver ve Seviye Testleri (Headless)
## MEB M.4.1.6.2 Standardı, 1. Bölümün 3 Parçalı (1/2 > 1/3 > 1/4) Matematik Doğruluğu,
## Didaktik Hata Geri Bildirimleri, Geri Alma/Sıfırlama ve Köprü Entegrasyonu.

const FractionBridgeLevelCatalog = preload("res://scripts/FractionBridgeLevelCatalog.gd")
const FractionBridgeScript = preload("res://scripts/FractionBridge.gd")
const FractionBridgePlankScript = preload("res://scripts/FractionBridgePlank.gd")
const FractionBridgeSlotScript = preload("res://scripts/FractionBridgeSlot.gd")

func _initialize() -> void:
	print("\n========================================================")
	print("  VENTRA — FRACTION BRIDGE V2 AUTOMATED TESTS")
	print("========================================================\n")
	
	# 1. Seviye Kataloğu ve Matematik Doğrulaması
	print("--- TEST 1: Katalog ve Seviye 1 Matematik Doğrulaması ---")
	var lvl1 = FractionBridgeLevelCatalog.get_level(1)
	assert(lvl1.get("id") == 1, "Bölüm 1 mevcut olmalı")
	assert(lvl1.get("outcome_id") == "M.4.1.6.2", "Kazanım M.4.1.6.2 olmalı")
	assert(lvl1.get("skill_id") == "ventra.math.g4.fraction.unit_comparison", "Beceri doğru olmalı")
	
	var req_fractions: Array = lvl1.get("required_fractions", [])
	assert(req_fractions.size() == 3, "Bölüm 1 tam 3 adet yuva içermelidir (1/2, 1/3, 1/4)")
	assert(req_fractions[0].get("den") == 2, "1. parça 1/2 olmalı")
	assert(req_fractions[1].get("den") == 3, "2. parça 1/3 olmalı")
	assert(req_fractions[2].get("den") == 4, "3. parça 1/4 olmalı")
	print("  ✓ Bölüm 1: 1/2 > 1/3 > 1/4 matematiksel sıralama kuralı doğrulandı.")

	# 2. Sahne ve Kontrollerin Başlatılması
	print("\n--- TEST 2: FractionBridge Sahnesi ve Oynanış Döngüsü ---")
	change_scene_to_file("res://scenes/FractionBridge.tscn")
	await process_frame
	await process_frame
	
	var bridge_game = current_scene
	assert(bridge_game != null, "FractionBridge sahnesi yüklenebilmeli")
	
	bridge_game.start_level(1)
	assert(bridge_game.current_level_id == 1, "Aktif bölüm 1 olmalı")
	assert(bridge_game.slots.size() == 3, "Bölüm 1'de 3 yuva olmalı")
	assert(bridge_game.tray_box.get_child_count() == 3, "Tepside 3 kalas olmalı")
	
	# Kalasları bul
	var p_half = null
	var p_third = null
	var p_quarter = null
	for child in bridge_game.tray_box.get_children():
		if child.get("denominator") == 2: p_half = child
		elif child.get("denominator") == 3: p_third = child
		elif child.get("denominator") == 4: p_quarter = child
		
	assert(p_half != null and p_third != null and p_quarter != null, "1/2, 1/3, 1/4 kalaslarının tümü tepside mevcut olmalı")
	
	# Görsel uzunluk kontrolü (W/n kuralı: 1/2 > 1/3 > 1/4)
	assert(p_half.size.x > p_third.size.x, "1/2 tahtası 1/3 tahtasından daha uzun olmalı")
	assert(p_third.size.x > p_quarter.size.x, "1/3 tahtası 1/4 tahtasından daha uzun olmalı")
	print("  ✓ Kalas görünür uzunlukları: 1/2 (%s px) > 1/3 (%s px) > 1/4 (%s px) matematiksel olarak doğrulandı." % [p_half.size.x, p_third.size.x, p_quarter.size.x])
	
	# 2.1 Hatalı Sıralama Testi (1/4 yuva 0'a, 1/3 yuva 1'e, 1/2 yuva 2'ye)
	bridge_game._place_plank_in_slot(p_quarter, bridge_game.slots[0])
	bridge_game._place_plank_in_slot(p_third, bridge_game.slots[1])
	bridge_game._place_plank_in_slot(p_half, bridge_game.slots[2])
	
	# Otomatik kontrolün çalışması için frame/zaman bekle
	await process_frame
	await process_frame
	await create_timer(0.4).timeout
	
	assert(bridge_game.wrong_attempts >= 1, "Hatalı sıralamada yanlış deneme sayısı artmalı")
	assert(bridge_game.slots[1].is_error or bridge_game.slots[2].is_error, "Hatalı yuvada uyarı durumu aktif olmalı")
	print("  ✓ Hatalı yerleşim: Robot öğretici uyarı verdi, kalaslar güvenle yerinde kaldı.")
	
	# 2.2 Geri Alma (Undo) Testi
	bridge_game._on_undo_pressed()
	assert(bridge_game.slots[2].current_plank == null, "Geri alma son yuvayı boşaltmalı")
	print("  ✓ Geri Alma (Undo) testi başarılı.")
	
	# 2.3 Sıfırlama (Reset) Testi
	bridge_game._on_reset_pressed()
	for s in bridge_game.slots:
		assert(s.current_plank == null, "Tüm yuvalar sıfırlanmalı")
	assert(bridge_game.tray_box.get_child_count() == 3, "Tüm kalaslar tepsiye dönmeli")
	print("  ✓ Sıfırlama (Reset) testi başarılı.")
	
	# 2.4 Doğru Yerleşim ve Otomatik Tamamlama (1/2 > 1/3 > 1/4)
	# Tekrar referansları al
	p_half = null
	p_third = null
	p_quarter = null
	for child in bridge_game.tray_box.get_children():
		if child.get("denominator") == 2: p_half = child
		elif child.get("denominator") == 3: p_third = child
		elif child.get("denominator") == 4: p_quarter = child
		
	bridge_game._place_plank_in_slot(p_half, bridge_game.slots[0])
	bridge_game._place_plank_in_slot(p_third, bridge_game.slots[1])
	bridge_game._place_plank_in_slot(p_quarter, bridge_game.slots[2])
	
	# Otomatik doğrulama ve kaşif köprü geçiş animasyonunu bekle
	await process_frame
	await process_frame
	await create_timer(2.6).timeout
	
	assert(bridge_game.level_completed, "Bölüm 1 doğru sıralamayla tamamlanmalı")
	assert(bridge_game.success_modal.visible, "Başarı kutlama modalı açılmalı")
	print("  ✓ Doğru yerleşim: Kaşif köprüyü adım adım geçti, Bölüm 1 başarıyla tamamlandı.")
	
	print("\n========================================================")
	print("  KESİR KÖPRÜSÜ V2 TÜM KONTROL VE TESTLERİ BAŞARILI!")
	print("========================================================\n")
	quit(0)
