extends SceneTree

## VENTRA — Kesir Köprüsü v2 Ekran Görüntüsü Yakalama Betiği

const FractionBridgeScript = preload("res://scripts/FractionBridge.gd")

func _initialize() -> void:
	print("[ScreenshotGenerator] Başlatılıyor...")
	
	# Hedef çıktı dizini: Artifacts klasörü
	var out_dir = "C:/Users/Yiğit/.gemini/antigravity/brain/2099b22d-62e3-4323-be2a-690223f3fbca/"
	
	# 1. Sahneyi Yükle
	change_scene_to_file("res://scenes/FractionBridge.tscn")
	await process_frame
	await process_frame
	await create_timer(0.2).timeout
	
	var game = current_scene as FractionBridge
	if game == null:
		print("HATA: FractionBridge sahnesi yüklenemedi!")
		quit(1)
		return
		
	# --- EKRAN 1: Masaüstü Başlangıç Durumu ---
	print("[ScreenshotGenerator] 1. Masaüstü başlangıç ekranı alınıyor...")
	root.size = Vector2i(1280, 720)
	game._update_responsive_layout()
	await process_frame
	await process_frame
	await create_timer(0.3).timeout
	
	_save_viewport_image(out_dir + "bridge_v2_desktop_start.png")
	
	# --- EKRAN 2: Hatalı Sıralama ve Robot Uyarısı ---
	print("[ScreenshotGenerator] 2. Hatalı sıralama ekranı alınıyor...")
	var p_half = null
	var p_third = null
	var p_quarter = null
	for child in game.tray_box.get_children():
		if child.get("denominator") == 2: p_half = child
		elif child.get("denominator") == 3: p_third = child
		elif child.get("denominator") == 4: p_quarter = child
		
	game._place_plank_in_slot(p_quarter, game.slots[0])
	game._place_plank_in_slot(p_third, game.slots[1])
	game._place_plank_in_slot(p_half, game.slots[2])
	await process_frame
	await create_timer(0.4).timeout
	
	_save_viewport_image(out_dir + "bridge_v2_desktop_error.png")
	
	# --- EKRAN 3: Başarı ve Kutlama Modalı ---
	print("[ScreenshotGenerator] 3. Başarı ve kutlama ekranı alınıyor...")
	game._on_reset_pressed()
	await process_frame
	
	# Yeniden referansları al
	for child in game.tray_box.get_children():
		if child.get("denominator") == 2: p_half = child
		elif child.get("denominator") == 3: p_third = child
		elif child.get("denominator") == 4: p_quarter = child
		
	game._place_plank_in_slot(p_half, game.slots[0])
	game._place_plank_in_slot(p_third, game.slots[1])
	game._place_plank_in_slot(p_quarter, game.slots[2])
	await process_frame
	await create_timer(2.6).timeout
	
	_save_viewport_image(out_dir + "bridge_v2_desktop_success.png")
	
	# --- EKRAN 4: Mobil Dikey Kadraj (390x844) ---
	print("[ScreenshotGenerator] 4. Mobil dikey ekran alınıyor...")
	root.size = Vector2i(390, 844)
	game.start_level(1)
	game._update_responsive_layout()
	await process_frame
	await process_frame
	await create_timer(0.3).timeout
	
	_save_viewport_image(out_dir + "bridge_v2_mobile_portrait.png")
	
	print("[ScreenshotGenerator] Tüm ekran görüntüleri başarıyla kaydedildi!")
	quit(0)

func _save_viewport_image(path: String) -> void:
	var img = root.get_texture().get_image()
	if img != null:
		var err = img.save_png(path)
		if err == OK:
			print("  -> Kaydedildi: ", path)
		else:
			print("  -> Kaydetme hatası: ", err)
	else:
		print("  -> HATA: get_image() null döndü!")

