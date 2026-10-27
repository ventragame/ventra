extends Node2D

@onready var camera: Camera2D = $WorldCamera
@onready var background: Sprite2D = $BackgroundSprite
@onready var hud_layer: CanvasLayer = $HUDLayer
@onready var top_bar: MarginContainer = $HUDLayer/TopBar
@onready var logo_label: Label = $HUDLayer/TopBar/Panel/Margin/HBox/LogoContainer/LogoLabel
@onready var sub_label: Label = $HUDLayer/TopBar/Panel/Margin/HBox/LogoContainer/SubLabel
@onready var detail_panel: Control = $HUDLayer/DetailPanel
@onready var detail_title: Label = $HUDLayer/DetailPanel/Card/Margin/VBox/HeaderHBox/TitleLabel
@onready var detail_category: Label = $HUDLayer/DetailPanel/Card/Margin/VBox/HeaderHBox/CategoryLabel
@onready var close_button: Button = $HUDLayer/DetailPanel/Card/Margin/VBox/HeaderHBox/CloseButton
@onready var detail_desc: Label = $HUDLayer/DetailPanel/Card/Margin/VBox/DescLabel
@onready var detail_outcome: Label = $HUDLayer/DetailPanel/Card/Margin/VBox/OutcomeBox/HBox/OutcomeLabel
@onready var enter_button: Button = $HUDLayer/DetailPanel/Card/Margin/VBox/ButtonContainer/EnterButton
@onready var reset_cam_button: Button = $HUDLayer/TopBar/Panel/Margin/HBox/ResetCamButton
@onready var stars_label: Label = $HUDLayer/TopBar/Panel/Margin/HBox/CurrencyContainer/StarsPill/StarsHBox/StarsLabel
@onready var shards_label: Label = $HUDLayer/TopBar/Panel/Margin/HBox/CurrencyContainer/ShardsPill/ShardsHBox/ShardsLabel

@onready var quick_nav_container: Control = $HUDLayer/QuickNavContainer
@onready var quick_nav_button: Button = $HUDLayer/QuickNavContainer/QuickNavButton

@onready var hub_island = $Islands/HubIsland
@onready var math_island = $Islands/MathIsland

var _is_mobile: bool = false
var default_camera_pos: Vector2 = Vector2(0, 0)
var default_camera_zoom: Vector2 = Vector2(1.0, 1.0)
var focused_camera_zoom: Vector2 = Vector2(1.32, 1.32)
var cam_min_pos: Vector2 = Vector2(-450, -250)
var cam_max_pos: Vector2 = Vector2(450, 250)

# Touch / Mouse Pan Gezinme Durumu
var _is_dragging: bool = false
var _drag_start_screen_pos: Vector2 = Vector2.ZERO
var _drag_start_cam_pos: Vector2 = Vector2.ZERO
var _has_drag_moved: bool = false
const DRAG_THRESHOLD: float = 14.0

var _current_selected_island: Dictionary = {}
var _camera_tween: Tween
var _panel_tween: Tween
var _reset_btn_tween: Tween
var _quick_nav_tween: Tween
var _stars_balance: int = 0
var _shards_balance: int = 0
var _target_nav_island: String = "hub_island"

func _ready() -> void:
	# Kamera başlangıç durumu
	camera.position = default_camera_pos
	camera.zoom = default_camera_zoom
	
	# Detay paneli ve harita sıfırlama butonu başlangıçta gizli
	detail_panel.visible = false
	detail_panel.modulate.a = 0.0
	reset_cam_button.visible = false
	reset_cam_button.modulate.a = 0.0
	
	# Ada sinyalleri
	if hub_island:
		hub_island.island_selected.connect(_on_island_selected)
	if math_island:
		math_island.island_selected.connect(_on_island_selected)
		
	# UI butonları
	enter_button.pressed.connect(_on_enter_world_pressed)
	close_button.pressed.connect(_on_close_detail_pressed)
	reset_cam_button.pressed.connect(_reset_camera_overview)
	if quick_nav_button:
		quick_nav_button.pressed.connect(_on_quick_nav_pressed)
	
	# Bridge sinyalleri (Autoload Bridge)
	if has_node("/root/Bridge"):
		var bridge = get_node("/root/Bridge")
		bridge.game_started.connect(_on_external_game_started)
		bridge.state_synced.connect(_on_external_state_synced)
		
	_update_hud_display()
	get_viewport().size_changed.connect(_on_viewport_resized)
	_on_viewport_resized()

func _update_hud_display() -> void:
	if stars_label:
		stars_label.text = str(_stars_balance)
	if shards_label:
		shards_label.text = str(_shards_balance)

func _unhandled_input(event: InputEvent) -> void:
	# Dokunma ve Mouse ile Kaydırarak Gezinme (Touch & Drag Pan)
	if event is InputEventMouseButton:
		var mb = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_start_drag(mb.position)
			else:
				_end_drag()
	elif event is InputEventMouseMotion:
		var mm = event as InputEventMouseMotion
		if _is_dragging:
			_process_drag(mm.position)
	elif event is InputEventScreenTouch:
		var st = event as InputEventScreenTouch
		if st.pressed:
			_start_drag(st.position)
		else:
			_end_drag()
	elif event is InputEventScreenDrag:
		var sd = event as InputEventScreenDrag
		if _is_dragging:
			_process_drag(sd.position)

func _start_drag(screen_pos: Vector2) -> void:
	_is_dragging = true
	_has_drag_moved = false
	_drag_start_screen_pos = screen_pos
	_drag_start_cam_pos = camera.position

func _process_drag(screen_pos: Vector2) -> void:
	var dist = screen_pos.distance_to(_drag_start_screen_pos)
	if dist > DRAG_THRESHOLD:
		if not _has_drag_moved:
			_has_drag_moved = true
			if not _current_selected_island.is_empty():
				_close_detail_panel()
		if _camera_tween and _camera_tween.is_running():
			_camera_tween.kill()
		var offset = (screen_pos - _drag_start_screen_pos) / camera.zoom
		camera.position = (_drag_start_cam_pos - offset).clamp(cam_min_pos, cam_max_pos)
		_update_quick_nav()

func _end_drag() -> void:
	_is_dragging = false
	if _has_drag_moved:
		_update_quick_nav()

func _update_quick_nav() -> void:
	if not _is_mobile or not quick_nav_button:
		return
	if camera.position.y < 0:
		_target_nav_island = "hub_island"
		quick_nav_button.text = "Keşif Merkezi'ne Git  ▼"
	else:
		_target_nav_island = "math_island"
		quick_nav_button.text = "▲  Matematik Dünyası'na Git"

func _on_quick_nav_pressed() -> void:
	if not _current_selected_island.is_empty():
		_close_detail_panel()
	if _target_nav_island == "hub_island":
		_animate_camera(Vector2(0, 860), default_camera_zoom)
		_target_nav_island = "math_island"
		quick_nav_button.text = "▲  Matematik Dünyası'na Git"
	else:
		_animate_camera(Vector2(0, -860), default_camera_zoom)
		_target_nav_island = "hub_island"
		quick_nav_button.text = "Keşif Merkezi'ne Git  ▼"

func _on_island_selected(data: Dictionary) -> void:
	if _has_drag_moved:
		return
	_current_selected_island = data
	print("[WorldMap] Ada seçildi: ", data.name)
	
	# Seçilen adanın aurasını etkinleştir, diğerini sıfırla
	if hub_island and hub_island.has_method("set_selected"):
		hub_island.set_selected(data.id == "hub_island")
	if math_island and math_island.has_method("set_selected"):
		math_island.set_selected(data.id == "math_island")
	
	# Kamerayı yumuşakça adaya odakla (mobilde alt kart için yukarı merkezle)
	var offset_y = -45.0 if _is_mobile else -25.0
	var target_pos = data.global_position + Vector2(0, offset_y)
	_animate_camera(target_pos, focused_camera_zoom)
	
	# Detay panelini doldur
	detail_title.text = data.name
	detail_category.text = data.category
	detail_desc.text = data.description
	
	if data.id == "math_island":
		detail_outcome.text = "MEB Kazanım: M.4.1.6.1 & M.4.1.6.2 (Kesirler Dünyası)"
		enter_button.visible = true
		enter_button.text = "Matematik Dünyası'na Gir"
		enter_button.disabled = false
	else:
		detail_outcome.text = "Geliştirme Aşamasında • Görevler & Avatarlar"
		enter_button.visible = false
		
	_show_detail_panel(true)
	_show_reset_button(true)
	_show_quick_nav(false)

func _on_close_detail_pressed() -> void:
	_reset_camera_overview()

func _close_detail_panel() -> void:
	_current_selected_island = {}
	if hub_island and hub_island.has_method("set_selected"):
		hub_island.set_selected(false)
	if math_island and math_island.has_method("set_selected"):
		math_island.set_selected(false)
	_show_detail_panel(false)
	_show_reset_button(false)
	if _is_mobile:
		_show_quick_nav(true)
		_update_quick_nav()

func _reset_camera_overview() -> void:
	_close_detail_panel()
	if _is_mobile:
		# Mobilde kamerayı en yakın adanın merkezine oturt
		var target_y = 860.0 if camera.position.y > 0 else -860.0
		_animate_camera(Vector2(0, target_y), default_camera_zoom)
	else:
		_animate_camera(default_camera_pos, default_camera_zoom)

func _animate_camera(target_pos: Vector2, target_zoom: Vector2) -> void:
	if _camera_tween:
		_camera_tween.kill()
	_camera_tween = create_tween().set_parallel(true)
	_camera_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	_camera_tween.tween_property(camera, "position", target_pos, 0.55)
	_camera_tween.tween_property(camera, "zoom", target_zoom, 0.55)

func _show_detail_panel(show_panel: bool) -> void:
	if _panel_tween:
		_panel_tween.kill()
	_panel_tween = create_tween().set_parallel(true)
	_panel_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	
	var vp_size = get_viewport_rect().size
	if show_panel:
		detail_panel.visible = true
		_panel_tween.tween_property(detail_panel, "modulate:a", 1.0, 0.28)
		var target_y = vp_size.y - detail_panel.size.y - (32.0 if _is_mobile else 18.0)
		_panel_tween.tween_property(detail_panel, "position:y", target_y, 0.28).from(vp_size.y)
	else:
		_panel_tween.tween_property(detail_panel, "modulate:a", 0.0, 0.22)
		_panel_tween.tween_property(detail_panel, "position:y", vp_size.y, 0.22)
		_panel_tween.chain().tween_callback(func(): detail_panel.visible = false)

func _show_reset_button(show_btn: bool) -> void:
	if _reset_btn_tween:
		_reset_btn_tween.kill()
	_reset_btn_tween = create_tween()
	_reset_btn_tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	
	if show_btn:
		reset_cam_button.visible = true
		_reset_btn_tween.tween_property(reset_cam_button, "modulate:a", 1.0, 0.25)
	else:
		_reset_btn_tween.tween_property(reset_cam_button, "modulate:a", 0.0, 0.2)
		_reset_btn_tween.tween_callback(func(): reset_cam_button.visible = false)

func _show_quick_nav(show_nav: bool) -> void:
	if not quick_nav_container:
		return
	if not _is_mobile:
		quick_nav_container.visible = false
		return
	if _quick_nav_tween:
		_quick_nav_tween.kill()
	_quick_nav_tween = create_tween()
	_quick_nav_tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	
	if show_nav:
		quick_nav_container.visible = true
		_quick_nav_tween.tween_property(quick_nav_container, "modulate:a", 1.0, 0.25)
	else:
		_quick_nav_tween.tween_property(quick_nav_container, "modulate:a", 0.0, 0.2)
		_quick_nav_tween.tween_callback(func(): quick_nav_container.visible = false)

func _on_enter_world_pressed() -> void:
	if _current_selected_island.is_empty():
		return
		
	var island_id = _current_selected_island.get("id", "")
	print("[WorldMap] Dünyaya giriş yapılıyor: ", island_id)
	
	if island_id == "math_island":
		get_tree().change_scene_to_file("res://scenes/MathWorldSelection.tscn")

func _on_external_game_started(_student_name: String, _level_id: int) -> void:
	get_tree().change_scene_to_file("res://scenes/FractionWorkshop.tscn")

func _on_external_state_synced(stars: int) -> void:
	_stars_balance = stars
	_update_hud_display()

func _on_viewport_resized() -> void:
	var vp_size = get_viewport_rect().size
	if vp_size.x <= 0 or vp_size.y <= 0:
		return
		
	var aspect = vp_size.x / vp_size.y
	
	# 1. Arka planı dinamik olarak ekrana sığdır (geniş kaydırma alanını kaplasın)
	if background and background.texture:
		var tex_size = background.texture.get_size()
		var fit_scale = max(vp_size.x / tex_size.x, vp_size.y / tex_size.y) * 2.4
		background.scale = Vector2(fit_scale, fit_scale)
	
	# 2. Cihaz oranına göre ada yerleşimini ve kamera kadrajını uyarla
	if aspect < 0.85:
		# Mobil Dikey Ekran: Büyük, ferah, tek adaya odaklı ve kaydırılarak gezilen harita
		_is_mobile = true
		
		# Adalar mobilde büyük ve dikey hat üzerine ferah bir mesafeyle yerleştirilir
		if math_island:
			math_island.position = Vector2(0, -860)
			if math_island.has_method("set_mobile_mode"):
				math_island.set_mobile_mode(true)
		if hub_island:
			hub_island.position = Vector2(0, 860)
			if hub_island.has_method("set_mobile_mode"):
				hub_island.set_mobile_mode(true)
				
		default_camera_zoom = Vector2(1.28, 1.28)
		focused_camera_zoom = Vector2(1.42, 1.42)
		cam_min_pos = Vector2(-150, -900)
		cam_max_pos = Vector2(150, 900)
		default_camera_pos = Vector2(0, -860)
		
		# HUD Güvenli Alan & Okunabilirlik (Üst durum çubuğu ve çentik boşluğu)
		if top_bar:
			top_bar.add_theme_constant_override("margin_top", 112)
			top_bar.add_theme_constant_override("margin_left", 20)
			top_bar.add_theme_constant_override("margin_right", 20)
			top_bar.custom_minimum_size = Vector2(0, 0)
		if logo_label:
			logo_label.add_theme_font_size_override("font_size", 19)
		if sub_label:
			sub_label.visible = false
		if stars_label:
			stars_label.add_theme_font_size_override("font_size", 16)
		if shards_label:
			shards_label.add_theme_font_size_override("font_size", 16)
		if reset_cam_button:
			reset_cam_button.add_theme_font_size_override("font_size", 14)
			reset_cam_button.custom_minimum_size = Vector2(110, 36)
			
		# Detay paneli mobil boyutları (Geniş kart, rahat dokunma hedefleri)
		var panel_w = min(620.0, vp_size.x - 48.0)
		detail_panel.offset_left = -panel_w / 2.0
		detail_panel.offset_right = panel_w / 2.0
		detail_panel.offset_top = -320.0
		detail_panel.offset_bottom = -36.0
		detail_title.add_theme_font_size_override("font_size", 22)
		detail_category.add_theme_font_size_override("font_size", 14)
		detail_desc.add_theme_font_size_override("font_size", 14)
		detail_outcome.add_theme_font_size_override("font_size", 13)
		enter_button.custom_minimum_size = Vector2(240, 54)
		enter_button.add_theme_font_size_override("font_size", 17)
		
		# Hızlı Ada Geçiş Butonu (Güvenli alt alan boşluğu)
		if quick_nav_container:
			quick_nav_container.visible = _current_selected_island.is_empty()
			quick_nav_container.offset_top = -140.0
			quick_nav_container.offset_bottom = -76.0
	else:
		# Masaüstü / Geniş Ekran (İki ada yan yana kalır, klasik görünüm korunur)
		_is_mobile = false
		
		if hub_island:
			hub_island.position = Vector2(-340, 40)
			if hub_island.has_method("set_mobile_mode"):
				hub_island.set_mobile_mode(false)
		if math_island:
			math_island.position = Vector2(340, -20)
			if math_island.has_method("set_mobile_mode"):
				math_island.set_mobile_mode(false)
				
		default_camera_zoom = Vector2(1.0, 1.0)
		focused_camera_zoom = Vector2(1.32, 1.32)
		cam_min_pos = Vector2(-450, -250)
		cam_max_pos = Vector2(450, 250)
		default_camera_pos = Vector2(0, 0)
		
		if top_bar:
			top_bar.add_theme_constant_override("margin_top", 12)
			top_bar.add_theme_constant_override("margin_left", 16)
			top_bar.add_theme_constant_override("margin_right", 16)
			top_bar.custom_minimum_size = Vector2(0, 62)
		if logo_label:
			logo_label.add_theme_font_size_override("font_size", 16)
		if sub_label:
			sub_label.visible = true
		if stars_label:
			stars_label.add_theme_font_size_override("font_size", 13)
		if shards_label:
			shards_label.add_theme_font_size_override("font_size", 13)
		if reset_cam_button:
			reset_cam_button.add_theme_font_size_override("font_size", 13)
			reset_cam_button.custom_minimum_size = Vector2(90, 32)
			
		detail_panel.offset_left = -230.0
		detail_panel.offset_right = 230.0
		detail_panel.offset_top = -245.0
		detail_panel.offset_bottom = -20.0
		detail_title.add_theme_font_size_override("font_size", 18)
		detail_category.add_theme_font_size_override("font_size", 12)
		detail_desc.add_theme_font_size_override("font_size", 12)
		detail_outcome.add_theme_font_size_override("font_size", 12)
		enter_button.custom_minimum_size = Vector2(200, 44)
		enter_button.add_theme_font_size_override("font_size", 14)
		
		if quick_nav_container:
			quick_nav_container.visible = false
	
	if _current_selected_island.is_empty():
		camera.zoom = default_camera_zoom
		camera.position = default_camera_pos
	
	_update_quick_nav()
