class_name FractionBridge
extends Control

## VENTRA — Kesir Köprüsü (Fraction Bridge) Mini Oyunu
## MEB M.4.1.6.2 müfredatı: Birim kesirleri karşılaştırır ve sıralar.

const FractionBridgeLevelCatalog = preload("res://scripts/FractionBridgeLevelCatalog.gd")
const FractionBridgePlankScene = preload("res://scenes/FractionBridgePlank.tscn")
const FractionBridgeSlotScene = preload("res://scenes/FractionBridgeSlot.tscn")

# UI Düğümleri
@onready var background: TextureRect = $Background
@onready var safe_margin: MarginContainer = $UI/SafeMargin
@onready var back_button: Button = $UI/SafeMargin/MainLayout/TopBar/BackButton
@onready var level_label: Label = $UI/SafeMargin/MainLayout/TopBar/LevelInfo/LevelLabel
@onready var stars_label: Label = $UI/SafeMargin/MainLayout/TopBar/LevelInfo/StarsLabel
@onready var hint_button: Button = $UI/SafeMargin/MainLayout/TopBar/HintButton

@onready var target_order_badge: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/Badge
@onready var target_title_label: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/TitleLabel
@onready var target_desc_label: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/DescLabel
@onready var bridge_status_label: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/StatusLabel

# Köprü Alanı (Kanyon & Yuvalar)
@onready var bridge_scroll: ScrollContainer = $UI/SafeMargin/MainLayout/BridgeScroll
@onready var bridge_slots_box: HBoxContainer = $UI/SafeMargin/MainLayout/BridgeScroll/BridgeContainer/SlotsBox
@onready var left_cliff_panel: PanelContainer = $UI/SafeMargin/MainLayout/BridgeScroll/BridgeContainer/LeftCliff
@onready var right_cliff_panel: PanelContainer = $UI/SafeMargin/MainLayout/BridgeScroll/BridgeContainer/RightCliff
@onready var explorer_avatar: Label = $UI/SafeMargin/MainLayout/BridgeScroll/BridgeContainer/LeftCliff/AvatarLabel

@onready var feedback_panel: PanelContainer = $UI/SafeMargin/MainLayout/FeedbackPanel
@onready var feedback_label: Label = $UI/SafeMargin/MainLayout/FeedbackPanel/FeedbackLabel

# Alt Kereste Rafı & Aksiyon Butonları
@onready var tray_box: HBoxContainer = $UI/SafeMargin/MainLayout/BottomBar/TrayPanel/TrayScroll/TrayBox
@onready var undo_button: Button = $UI/SafeMargin/MainLayout/BottomBar/Actions/UndoButton
@onready var reset_button: Button = $UI/SafeMargin/MainLayout/BottomBar/Actions/ResetButton
@onready var test_button: Button = $UI/SafeMargin/MainLayout/BottomBar/Actions/TestButton

# Modallar
@onready var success_modal: Control = $UI/SuccessModal
@onready var modal_stars: Label = $UI/SuccessModal/Center/Panel/VBox/Stars
@onready var modal_score: Label = $UI/SuccessModal/Center/Panel/VBox/Score
@onready var modal_msg: Label = $UI/SuccessModal/Center/Panel/VBox/Message
@onready var next_level_btn: Button = $UI/SuccessModal/Center/Panel/VBox/NextButton
@onready var exit_map_btn: Button = $UI/SuccessModal/Center/Panel/VBox/ExitButton

@onready var hint_modal: Control = $UI/HintModal
@onready var hint_modal_text: Label = $UI/HintModal/Center/Panel/VBox/HintText
@onready var close_hint_btn: Button = $UI/HintModal/Center/Panel/VBox/CloseButton

# Oyun Durumu
var current_level_id: int = 1
var current_level_data: Dictionary = {}
var slots: Array = []
var tray_planks: Array = []
var selected_plank: Control = null
var action_history: Array[Dictionary] = [] # Undo geçmişi: [{"plank": p, "from_slot": slot_idx}]

var start_time_msec: int = 0
var wrong_attempts: int = 0
var hints_used: int = 0
var total_stars: int = 0
var level_completed: bool = false
var is_testing_bridge: bool = false

func _ready() -> void:
	_connect_signals()
	_update_responsive_layout()
	get_viewport().size_changed.connect(_update_responsive_layout)
	
	start_level(current_level_id)

func _connect_signals() -> void:
	back_button.pressed.connect(_on_back_to_map_pressed)
	hint_button.pressed.connect(_on_hint_pressed)
	reset_button.pressed.connect(_on_reset_pressed)
	undo_button.pressed.connect(_on_undo_pressed)
	test_button.pressed.connect(_on_test_bridge_pressed)
	
	next_level_btn.pressed.connect(_on_next_level_pressed)
	exit_map_btn.pressed.connect(_on_back_to_map_pressed)
	close_hint_btn.pressed.connect(_on_close_hint_pressed)

func start_level(level_id: int) -> void:
	current_level_id = level_id
	current_level_data = FractionBridgeLevelCatalog.get_level(level_id)
	
	start_time_msec = Time.get_ticks_msec()
	wrong_attempts = 0
	hints_used = 0
	level_completed = false
	is_testing_bridge = false
	selected_plank = null
	action_history.clear()
	
	success_modal.visible = false
	hint_modal.visible = false
	
	_setup_level_ui()
	_build_bridge_slots()
	_build_plank_tray()
	_update_bridge_status()
	
	feedback_label.text = "Tahtaları seçip köprü yuvalarına yerleştir, ardından 'Köprüyü Test Et'e bas!"
	_set_feedback_color(Color("#38bdf8")) # Canlı Cyan

func _setup_level_ui() -> void:
	level_label.text = "Bölüm %d / %d" % [current_level_id, FractionBridgeLevelCatalog.get_total_levels()]
	stars_label.text = "★ %d" % total_stars
	
	var is_desc = current_level_data.get("order_type", "desc") == "desc"
	target_order_badge.text = "BÜYÜKTEN KÜÇÜĞE ( > )" if is_desc else "KÜÇÜKTEN BÜYÜĞE ( < )"
	target_order_badge.add_theme_color_override("font_color", Color("#fbbf24") if is_desc else Color("#34d399"))
	
	target_title_label.text = current_level_data.get("title", "Kesir Köprüsü")
	target_desc_label.text = current_level_data.get("description", "")
	
	test_button.disabled = true
	undo_button.disabled = true
	
	# Kaşif başlangıçta sol uçurumda durur
	if explorer_avatar:
		explorer_avatar.text = "🧭"
		explorer_avatar.position = Vector2(10, 10)

func _build_bridge_slots() -> void:
	for child in bridge_slots_box.get_children():
		bridge_slots_box.remove_child(child)
		child.queue_free()
	slots.clear()
	
	var required: Array = current_level_data.get("required_fractions", [])
	var op: String = current_level_data.get("comparison_operator", ">")
	
	for i in range(required.size()):
		var slot_inst = FractionBridgeSlotScene.instantiate()
		bridge_slots_box.add_child(slot_inst)
		
		# Son yuvanın yanında karşılaştırma sembolü olmaz
		var symbol_to_show = op if i < (required.size() - 1) else ""
		slot_inst.setup(i, symbol_to_show)
		
		slot_inst.slot_clicked.connect(_on_slot_clicked)
		slot_inst.plank_removed_from_slot.connect(_on_plank_removed_from_slot)
		slots.append(slot_inst)

func _build_plank_tray() -> void:
	for child in tray_box.get_children():
		tray_box.remove_child(child)
		child.queue_free()
	tray_planks.clear()
	
	var tray_pieces: Array = current_level_data.get("tray_pieces", [])
	for i in range(tray_pieces.size()):
		var piece_data = tray_pieces[i]
		var plank = FractionBridgePlankScene.instantiate()
		tray_box.add_child(plank)
		plank.setup(piece_data.get("num", 1), piece_data.get("den", 2))
		plank.original_tray_parent = tray_box
		plank.original_tray_index = i
		
		plank.plank_clicked.connect(_on_plank_clicked)
		plank.plank_drag_ended.connect(_on_plank_drag_ended)
		tray_planks.append(plank)

func _on_plank_clicked(plank: Control) -> void:
	if is_testing_bridge or level_completed:
		return
		
	# Eğer tahta zaten bir yuvadayısa tıklandığında geri alınır
	if plank.is_placed:
		_return_plank_to_tray(plank)
		return
		
	# Tahta raftaysa seçim durumunu değiştir
	if selected_plank == plank:
		plank.set_selected(false)
		selected_plank = null
	else:
		if selected_plank:
			selected_plank.set_selected(false)
		selected_plank = plank
		plank.set_selected(true)
		
	# Boş ilk yuvayı vurgula
	var first_empty = _get_first_empty_slot()
	for s in slots:
		s.set_highlight(selected_plank != null and s == first_empty)

func _on_slot_clicked(slot: Control) -> void:
	if is_testing_bridge or level_completed:
		return
		
	# Eğer yuvada zaten tahta varsa çıkar
	if slot.current_plank != null:
		_return_plank_to_tray(slot.current_plank)
		return
		
	# Eğer seçili bir tahta varsa bu yuvaya yerleştir
	if selected_plank != null:
		_place_plank_in_slot(selected_plank, slot)

func _on_plank_drag_ended(plank: Control, screen_pos: Vector2) -> void:
	if is_testing_bridge or level_completed:
		return
		
	# Bırakılan konumda bir yuva var mı kontrol et
	var target_slot: Control = null
	for s in slots:
		var slot_rect = s.get_global_rect()
		if slot_rect.has_point(screen_pos):
			target_slot = s
			break
			
	if target_slot != null:
		_place_plank_in_slot(plank, target_slot)
	else:
		# Boşluğa bırakıldıysa ve henüz yerleşmemişse rafta tut
		if not plank.is_placed:
			plank.set_selected(false)
			if selected_plank == plank:
				selected_plank = null

func _place_plank_in_slot(plank: Control, slot: Control) -> void:
	action_history.append({
		"action": "place",
		"plank": plank,
		"slot_index": slot.slot_index
	})
	
	slot.place_plank(plank)
	selected_plank = null
	
	for s in slots:
		s.set_highlight(false)
		s.set_error_state(false)
		
	_update_bridge_status()

func _return_plank_to_tray(plank: Control) -> void:
	var from_slot_idx = plank.current_slot_index
	if from_slot_idx >= 0 and from_slot_idx < slots.size():
		slots[from_slot_idx].remove_plank()
		
	if plank.get_parent():
		plank.get_parent().remove_child(plank)
		
	tray_box.add_child(plank)
	plank.set_selected(false)
	if selected_plank == plank:
		selected_plank = null
		
	action_history.append({
		"action": "remove",
		"plank": plank,
		"slot_index": from_slot_idx
	})
	
	for s in slots:
		s.set_error_state(false)
	_update_bridge_status()

func _on_plank_removed_from_slot(_slot: Control, plank: Control) -> void:
	if plank.get_parent() != tray_box:
		if plank.get_parent():
			plank.get_parent().remove_child(plank)
		tray_box.add_child(plank)
	_update_bridge_status()

func _get_first_empty_slot() -> Control:
	for s in slots:
		if s.current_plank == null:
			return s
	return null

func _update_bridge_status() -> void:
	var filled_count = 0
	for s in slots:
		if s.current_plank != null:
			filled_count += 1
			
	var total_slots = slots.size()
	test_button.disabled = (filled_count < total_slots) or is_testing_bridge
	undo_button.disabled = action_history.is_empty() or is_testing_bridge
	
	bridge_status_label.text = "Köprü Durumu: %d / %d Parça Yerleşti" % [filled_count, total_slots]
	if filled_count == total_slots:
		bridge_status_label.add_theme_color_override("font_color", Color("#34d399"))
	else:
		bridge_status_label.add_theme_color_override("font_color", Color("#94a3b8"))

func _on_undo_pressed() -> void:
	if action_history.is_empty() or is_testing_bridge:
		return
		
	var last_action = action_history.pop_back()
	var plank: Control = last_action.get("plank")
	
	if last_action.get("action") == "place":
		_return_plank_to_tray(plank)
	elif last_action.get("action") == "remove":
		var slot_idx = last_action.get("slot_index", 0)
		if slot_idx >= 0 and slot_idx < slots.size():
			_place_plank_in_slot(plank, slots[slot_idx])

func _on_reset_pressed() -> void:
	if is_testing_bridge or level_completed:
		return
		
	for s in slots:
		if s.current_plank != null:
			var p = s.remove_plank()
			if p and p.get_parent() != tray_box:
				tray_box.add_child(p)
	
	action_history.clear()
	selected_plank = null
	for s in slots:
		s.set_error_state(false)
		s.set_highlight(false)
	_update_bridge_status()
	feedback_label.text = "Köprü sıfırlandı. Tahtaları dikkatlice sıraya göre yerleştir."
	_set_feedback_color(Color("#38bdf8"))

func _on_test_bridge_pressed() -> void:
	if is_testing_bridge or level_completed:
		return
		
	is_testing_bridge = true
	test_button.disabled = true
	undo_button.disabled = true
	reset_button.disabled = true
	
	feedback_label.text = "Köprü sağlamlığı test ediliyor... Kaşif karşıya geçiyor!"
	_set_feedback_color(Color("#facc15"))
	
	# Matematiksel Doğrulama ve Animasyon Adımları
	_run_bridge_crossing_test()

func _run_bridge_crossing_test() -> void:
	var is_desc = current_level_data.get("order_type", "desc") == "desc"
	var error_slot_index = -1
	var error_msg = ""
	
	# Bütün yuvalar arası sıralama kuralını doğrula
	for i in range(slots.size() - 1):
		var p1 = slots[i].current_plank
		var p2 = slots[i + 1].current_plank
		
		if p1 == null or p2 == null:
			error_slot_index = i
			error_msg = "Köprüde boşluk var! Tüm yuvaları doldurmalısın."
			break
			
		# Birim kesir karşılaştırması:
		# 1/den1 > 1/den2  <=>  den1 < den2
		if is_desc:
			if p1.denominator >= p2.denominator:
				error_slot_index = i + 1
				error_msg = "Sıralama Hatası: 1/%d parçası 1/%d parçasından daha küçük veya eşittir! Büyükten küçüğe sıralamalısın." % [p2.denominator, p1.denominator]
				break
		else: # asc (Küçükten Büyüğe)
			if p1.denominator <= p2.denominator:
				error_slot_index = i + 1
				error_msg = "Sıralama Hatası: 1/%d parçası 1/%d parçasından daha büyük veya eşittir! Küçükten büyüğe sıralamalısın." % [p2.denominator, p1.denominator]
				break

	# Animasyon: Kaşif adım adım ilerler
	var tween = create_tween()
	var step_duration = 0.35
	
	for i in range(slots.size()):
		var target_x = slots[i].global_position.x - left_cliff_panel.global_position.x + 30.0
		tween.tween_property(explorer_avatar, "position:x", target_x, step_duration)
		
		if error_slot_index >= 0 and i == error_slot_index:
			# Hatalı adımda dur
			break
			
	tween.tween_callback(func(): _finish_bridge_test(error_slot_index, error_msg))

func _finish_bridge_test(error_slot_index: int, error_msg: String) -> void:
	is_testing_bridge = false
	reset_button.disabled = false
	undo_button.disabled = action_history.is_empty()
	test_button.disabled = false
	
	if error_slot_index >= 0:
		wrong_attempts += 1
		slots[error_slot_index].set_error_state(true)
		feedback_label.text = error_msg
		_set_feedback_color(Color("#ef4444")) # Kırmızı uyarı
		
		# Kaşifi sol uçuruma geri döndür
		var return_tween = create_tween().set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		return_tween.tween_property(explorer_avatar, "position:x", 10.0, 0.4)
	else:
		# Kusursuz başarı! Karşıya ulaşıldı!
		level_completed = true
		feedback_label.text = "Harika! Köprü son derece sağlam ve sıralama kusursuz!"
		_set_feedback_color(Color("#34d399"))
		
		# Kaşif sağ uçuruma zaferle ulaşır
		var win_tween = create_tween()
		win_tween.tween_property(explorer_avatar, "position:x", right_cliff_panel.global_position.x - left_cliff_panel.global_position.x + 20.0, 0.3)
		win_tween.tween_callback(func(): _on_level_success())

func _on_level_success() -> void:
	var duration_sec = int((Time.get_ticks_msec() - start_time_msec) / 1000.0)
	
	# Yıldız Hesabı:
	# 0 yanlış = 3 yıldız
	# 1-2 yanlış = 2 yıldız
	# 3+ yanlış = 1 yıldız
	var stars = 3
	if wrong_attempts >= 3:
		stars = 1
	elif wrong_attempts >= 1:
		stars = 2
		
	var base_score = 100
	var penalty = (wrong_attempts * 15) + (hints_used * 10)
	var final_score = max(50, base_score - penalty)
	
	total_stars += stars
	stars_label.text = "★ %d" % total_stars
	
	# Bridge üzerinden Web ve İlerleme Sistemine bildir
	if has_node("/root/Bridge"):
		var bridge = get_node("/root/Bridge")
		if bridge.has_method("send_fraction_bridge_completed"):
			bridge.send_fraction_bridge_completed(
				current_level_id,
				current_level_data.get("outcome_id", "M.4.1.6.2"),
				current_level_data.get("skill_id", "ventra.math.g4.fraction.unit_comparison"),
				final_score,
				true,
				stars,
				duration_sec,
				wrong_attempts + 1,
				wrong_attempts,
				hints_used
			)
			
	# Başarı Modalı
	modal_stars.text = "★ ".repeat(stars).strip_edges()
	modal_score.text = "Skor: %d • Süre: %d sn" % [final_score, duration_sec]
	modal_msg.text = current_level_data.get("hint_text", "Birim kesirler başarıyla sıralandı!")
	
	next_level_btn.visible = (current_level_id < FractionBridgeLevelCatalog.get_total_levels())
	success_modal.visible = true

func _on_next_level_pressed() -> void:
	if current_level_id < FractionBridgeLevelCatalog.get_total_levels():
		start_level(current_level_id + 1)
	else:
		_on_back_to_map_pressed()

func _on_back_to_map_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/MathWorldSelection.tscn")

func _on_hint_pressed() -> void:
	hints_used += 1
	hint_modal_text.text = current_level_data.get("hint_text", "Payda büyüdükçe birim kesir küçülür!")
	hint_modal.visible = true

func _on_close_hint_pressed() -> void:
	hint_modal.visible = false

func _set_feedback_color(col: Color) -> void:
	if feedback_panel:
		var style = StyleBoxFlat.new()
		style.set_corner_radius_all(10)
		style.bg_color = col.darkened(0.75)
		style.border_color = col
		style.set_border_width_all(2)
		feedback_panel.add_theme_stylebox_override("panel", style)
	if feedback_label:
		feedback_label.add_theme_color_override("font_color", col.lightened(0.25))

func _update_responsive_layout() -> void:
	var vp_size = get_viewport_rect().size
	if vp_size.x <= 0 or vp_size.y <= 0:
		return
	var aspect = vp_size.x / vp_size.y
	var is_mobile = aspect < 0.85
	
	if safe_margin:
		safe_margin.add_theme_constant_override("margin_left", 14 if is_mobile else 28)
		safe_margin.add_theme_constant_override("margin_right", 14 if is_mobile else 28)
		safe_margin.add_theme_constant_override("margin_top", 12 if is_mobile else 20)
		safe_margin.add_theme_constant_override("margin_bottom", 14 if is_mobile else 20)
