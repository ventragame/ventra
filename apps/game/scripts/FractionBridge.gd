class_name FractionBridge
extends Control

## VENTRA — Kesir Köprüsü (Fraction Bridge) Mini Oyunu — v2 Vertical Slice
## MEB M.4.1.6.2 standardı: Birim kesirleri karşılaştırır ve sıralar (1/2 > 1/3 > 1/4).

const FractionBridgeLevelCatalog = preload("res://scripts/FractionBridgeLevelCatalog.gd")
const FractionBridgePlankScene = preload("res://scenes/FractionBridgePlank.tscn")
const FractionBridgeSlotScene = preload("res://scenes/FractionBridgeSlot.tscn")

# 2D Sahne Düğümleri
@onready var background: TextureRect = $Background
@onready var game_world: Control = $GameWorld

@onready var left_cliff: TextureRect = $GameWorld/LeftCliff
@onready var explorer_avatar: TextureRect = $GameWorld/LeftCliff/ExplorerAvatar
@onready var nickname_badge: Label = $GameWorld/LeftCliff/ExplorerAvatar/NicknameBadge
@onready var companion_robot: TextureRect = $GameWorld/LeftCliff/CompanionRobot
@onready var speech_bubble: PanelContainer = $GameWorld/LeftCliff/CompanionRobot/SpeechBubble
@onready var bubble_label: Label = $GameWorld/LeftCliff/CompanionRobot/SpeechBubble/BubbleLabel

@onready var bridge_ropes: TextureRect = $GameWorld/BridgeRopes
@onready var slots_container: HBoxContainer = $GameWorld/SlotsContainer

@onready var right_cliff: TextureRect = $GameWorld/RightCliff
@onready var target_flag: TextureRect = $GameWorld/RightCliff/TargetFlag
@onready var target_star: Label = $GameWorld/RightCliff/TargetStar

# UI Düğümleri
@onready var back_button: Button = $UI/SafeMargin/MainLayout/TopBar/BackButton
@onready var level_title: Label = $UI/SafeMargin/MainLayout/TopBar/HeaderPill/HBox/LevelTitle
@onready var order_badge: Label = $UI/SafeMargin/MainLayout/TopBar/HeaderPill/HBox/OrderBadge
@onready var stars_label: Label = $UI/SafeMargin/MainLayout/TopBar/StarsLabel
@onready var hint_button: Button = $UI/SafeMargin/MainLayout/TopBar/HintButton

@onready var tray_panel: PanelContainer = $UI/SafeMargin/MainLayout/BottomBar/TrayPanel
@onready var tray_box: HBoxContainer = $UI/SafeMargin/MainLayout/BottomBar/TrayPanel/VBox/TrayScroll/TrayBox
@onready var undo_button: Button = $UI/SafeMargin/MainLayout/BottomBar/TrayPanel/VBox/TrayHeaderBox/UndoButton
@onready var reset_button: Button = $UI/SafeMargin/MainLayout/BottomBar/TrayPanel/VBox/TrayHeaderBox/ResetButton

# Modallar
@onready var success_modal: Control = $UI/SuccessModal
@onready var modal_stars: Label = $UI/SuccessModal/Center/Panel/VBox/Stars
@onready var modal_score: Label = $UI/SuccessModal/Center/Panel/VBox/Score
@onready var modal_msg: Label = $UI/SuccessModal/Center/Panel/VBox/Message
@onready var replay_button: Button = $UI/SuccessModal/Center/Panel/VBox/ButtonsHBox/ReplayButton
@onready var exit_button: Button = $UI/SuccessModal/Center/Panel/VBox/ButtonsHBox/ExitButton

@onready var hint_modal: Control = $UI/HintModal
@onready var hint_modal_text: Label = $UI/HintModal/Center/Panel/VBox/HintText
@onready var close_hint_btn: Button = $UI/HintModal/Center/Panel/VBox/CloseButton

# Oyun Değişkenleri
var current_level_id: int = 1
var current_level_data: Dictionary = {}
var slots: Array = []
var tray_planks: Array = []
var selected_plank: Control = null
var action_history: Array[Dictionary] = []

var start_time_msec: int = 0
var wrong_attempts: int = 0
var hints_used: int = 0
var total_stars: int = 0
var level_completed: bool = false
var is_testing_bridge: bool = false
var is_mobile_mode: bool = false

var _robot_hover_tween: Tween = null
var _avatar_idle_tween: Tween = null
var _original_avatar_parent: Node = null
var _original_avatar_pos: Vector2 = Vector2.ZERO

func _ready() -> void:
	_original_avatar_parent = explorer_avatar.get_parent()
	_original_avatar_pos = explorer_avatar.position
	
	_connect_signals()
	_setup_ambient_animations()
	_update_responsive_layout()
	get_viewport().size_changed.connect(_update_responsive_layout)
	
	# Profil senkronizasyonunu dinle
	if has_node("/root/Bridge"):
		var bridge = get_node("/root/Bridge")
		if bridge.has_signal("state_synced"):
			bridge.state_synced.connect(_on_bridge_state_synced)
			
	start_level(1)

func _connect_signals() -> void:
	back_button.pressed.connect(_on_back_to_map_pressed)
	hint_button.pressed.connect(_on_hint_pressed)
	reset_button.pressed.connect(_on_reset_pressed)
	undo_button.pressed.connect(_on_undo_pressed)
	
	replay_button.pressed.connect(_on_replay_pressed)
	exit_button.pressed.connect(_on_back_to_map_pressed)
	close_hint_btn.pressed.connect(_on_close_hint_pressed)

func _setup_ambient_animations() -> void:
	# 1. Robot companion süzülme animasyonu (nazik hover)
	if _robot_hover_tween:
		_robot_hover_tween.kill()
	_robot_hover_tween = create_tween().set_loops()
	_robot_hover_tween.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	_robot_hover_tween.tween_property(companion_robot, "position:y", companion_robot.position.y - 8.0, 1.4)
	_robot_hover_tween.tween_property(companion_robot, "position:y", companion_robot.position.y + 4.0, 1.4)
	
	# 2. Kaşif nefes alma/idle animasyonu
	if _avatar_idle_tween:
		_avatar_idle_tween.kill()
	_avatar_idle_tween = create_tween().set_loops()
	_avatar_idle_tween.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	_avatar_idle_tween.tween_property(explorer_avatar, "scale", Vector2(1.0, 1.03), 1.2)
	_avatar_idle_tween.tween_property(explorer_avatar, "scale", Vector2(1.0, 0.98), 1.2)

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
	
	# Kaşifi sol adadaki başlangıç konumuna sıfırla
	if explorer_avatar.get_parent() != _original_avatar_parent:
		explorer_avatar.get_parent().remove_child(explorer_avatar)
		_original_avatar_parent.add_child(explorer_avatar)
	explorer_avatar.position = _original_avatar_pos
	explorer_avatar.rotation = 0.0
	explorer_avatar.scale = Vector2.ONE
	
	success_modal.visible = false
	hint_modal.visible = false
	
	_setup_level_ui()
	_build_bridge_slots()
	_build_plank_tray()
	_update_bridge_status()
	
	# Robotun başlangıç konuşması
	_set_robot_speech("Bu köprü karşı adaya ulaşmamızı sağlayacak. Tahtaları büyükten küçüğe doğru büyüklükteki kesirlerle yerleştirelim!")

func _setup_level_ui() -> void:
	level_title.text = "Bölüm %d • %s" % [current_level_id, current_level_data.get("title", "Yarım, Üçte Bir, Çeyrek")]
	stars_label.text = "★ %d" % total_stars
	
	var is_desc = current_level_data.get("order_type", "desc") == "desc"
	order_badge.text = "BÜYÜKTEN KÜÇÜĞE ( > )" if is_desc else "KÜÇÜKTEN BÜYÜĞE ( < )"
	order_badge.add_theme_color_override("font_color", Color("#fbbf24") if is_desc else Color("#34d399"))
	
	undo_button.disabled = true
	reset_button.disabled = true

func _build_bridge_slots() -> void:
	for child in slots_container.get_children():
		slots_container.remove_child(child)
		child.queue_free()
	slots.clear()
	
	var required: Array = current_level_data.get("required_fractions", [])
	var op: String = current_level_data.get("comparison_operator", ">")
	
	for i in range(required.size()):
		var slot_inst = FractionBridgeSlotScene.instantiate()
		slots_container.add_child(slot_inst)
		
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

func _set_robot_speech(text: String, is_warn: bool = false) -> void:
	bubble_label.text = text
	speech_bubble.visible = true
	
	var style = speech_bubble.get_theme_stylebox("panel") as StyleBoxFlat
	if style:
		style.border_color = Color("#ef4444") if is_warn else Color("#38bdf8")
		
	# Sevimli konuşma titreşimi
	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	speech_bubble.scale = Vector2(0.9, 0.9)
	tween.tween_property(speech_bubble, "scale", Vector2.ONE, 0.2)

func _on_plank_clicked(plank: Control) -> void:
	if is_testing_bridge or level_completed:
		return
		
	# Yuvadaysa geri al
	if plank.is_placed:
		_return_plank_to_tray(plank)
		return
		
	if selected_plank == plank:
		plank.set_selected(false)
		selected_plank = null
	else:
		if selected_plank:
			selected_plank.set_selected(false)
		selected_plank = plank
		plank.set_selected(true)
		
	var first_empty = _get_first_empty_slot()
	for s in slots:
		s.set_highlight(selected_plank != null and s == first_empty)

func _on_slot_clicked(slot: Control) -> void:
	if is_testing_bridge or level_completed:
		return
		
	if slot.current_plank != null:
		_return_plank_to_tray(slot.current_plank)
		return
		
	if selected_plank != null:
		_place_plank_in_slot(selected_plank, slot)

func _on_plank_drag_ended(plank: Control, screen_pos: Vector2) -> void:
	if is_testing_bridge or level_completed:
		return
		
	var target_slot: Control = null
	for s in slots:
		var slot_rect = s.get_global_rect()
		if slot_rect.has_point(screen_pos):
			target_slot = s
			break
			
	if target_slot != null:
		_place_plank_in_slot(plank, target_slot)
	else:
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
	undo_button.disabled = action_history.is_empty() or is_testing_bridge
	reset_button.disabled = (filled_count == 0) or is_testing_bridge
	
	# 3 yuva dolunca OTOMATİK KONTROL tetiklenir (GDD v2 kuralı)
	if filled_count == total_slots and not is_testing_bridge and not level_completed:
		call_deferred("_trigger_auto_bridge_test")

func _trigger_auto_bridge_test() -> void:
	if not is_testing_bridge and not level_completed:
		_run_bridge_crossing_test()

func _on_undo_pressed() -> void:
	if action_history.is_empty() or is_testing_bridge or level_completed:
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
	_set_robot_speech("Köprü sıfırlandı. Tahtaları büyükten küçüğe dikkatlice yerleştir!")

func _on_test_bridge_pressed() -> void:
	if is_testing_bridge or level_completed:
		return
	_run_bridge_crossing_test()

func _run_bridge_crossing_test() -> void:
	is_testing_bridge = true
	undo_button.disabled = true
	reset_button.disabled = true
	
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
			
		# Birim kesir karşılaştırması: 1/den1 > 1/den2  <=>  den1 < den2
		if is_desc:
			if p1.denominator >= p2.denominator:
				error_slot_index = i + 1
				error_msg = "Yarım (1/%d) mı daha büyük, çeyrek (1/%d) mü? Parçaların uzunluklarına bak!" % [min(p1.denominator, p2.denominator), max(p1.denominator, p2.denominator)]
				break
		else: # asc
			if p1.denominator <= p2.denominator:
				error_slot_index = i + 1
				error_msg = "Küçükten büyüğe sıralamalısın! 1/%d daha küçüktür." % min(p1.denominator, p2.denominator)
				break

	if error_slot_index >= 0:
		# Hata Durumu (Nazik ve öğretici geri bildirim)
		is_testing_bridge = false
		wrong_attempts += 1
		slots[error_slot_index].set_error_state(true)
		_set_robot_speech(error_msg, true)
		undo_button.disabled = false
		reset_button.disabled = false
	else:
		# Başarı Durumu — Köprü tamamlandı! Kaşif karşıya yürür!
		_set_robot_speech("Harika! Köprü tamamlandı ve son derece sağlam!")
		_animate_avatar_crossing()

func _animate_avatar_crossing() -> void:
	# Kaşifi game_world koordinat sistemine alarak serbest hareket ettir
	var start_global = explorer_avatar.global_position
	if explorer_avatar.get_parent() != game_world:
		explorer_avatar.get_parent().remove_child(explorer_avatar)
		game_world.add_child(explorer_avatar)
	explorer_avatar.global_position = start_global
	
	var walk_tween = create_tween()
	var step_time = 0.45
	
	# Her kalasın üstüne sırayla adım at
	for i in range(slots.size()):
		var target_x = slots[i].global_position.x + (slots[i].size.x / 2.0) - (explorer_avatar.size.x / 2.0)
		var target_y = slots[i].global_position.y - explorer_avatar.size.y + 25.0
		
		# Yürüyüş adımı (x düz, y hafif zıplama)
		walk_tween.tween_property(explorer_avatar, "global_position:x", target_x, step_time).set_trans(Tween.TRANS_SINE)
		var mid_y = target_y - 14.0
		walk_tween.parallel().tween_property(explorer_avatar, "global_position:y", mid_y, step_time * 0.5)
		walk_tween.chain().tween_property(explorer_avatar, "global_position:y", target_y, step_time * 0.5)
		
		# Kalas üzerinde esneme efekti
		var current_slot = slots[i]
		walk_tween.tween_callback(func():
			if current_slot and current_slot.current_plank:
				var wobble = create_tween().set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
				wobble.tween_property(current_slot.current_plank, "scale:y", 0.92, 0.1)
				wobble.tween_property(current_slot.current_plank, "scale:y", 1.0, 0.2)
		)

	# Sağ adadaki hedefe ulaşma
	var finish_x = right_cliff.global_position.x + 80.0
	var finish_y = right_cliff.global_position.y - 15.0
	walk_tween.tween_property(explorer_avatar, "global_position:x", finish_x, 0.5).set_trans(Tween.TRANS_CUBIC)
	walk_tween.parallel().tween_property(explorer_avatar, "global_position:y", finish_y, 0.5)
	
	# Zafer Zıplaması ve Robotun Eşlik Etmesi
	walk_tween.tween_callback(func():
		var victory_tween = create_tween()
		victory_tween.tween_property(explorer_avatar, "scale", Vector2(1.2, 1.2), 0.18)
		victory_tween.tween_property(explorer_avatar, "scale", Vector2.ONE, 0.18)
		
		# Robot da sağ adaya süzülür
		var robot_fly = create_tween().set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		robot_fly.tween_property(companion_robot, "global_position:x", finish_x - 70.0, 0.6)
		
		_on_level_success()
	)

func _on_level_success() -> void:
	level_completed = true
	is_testing_bridge = false
	
	var duration_sec = int((Time.get_ticks_msec() - start_time_msec) / 1000.0)
	
	# Yıldız Hesabı (GDD v2 kuralı):
	# İlk doğrulamada ipucusuz = 3 yıldız
	# Düzeltme veya ipucu ile = 2 yıldız
	# Tamamlanan diğer = 1 yıldız
	var stars = 3
	if hints_used > 0 or wrong_attempts == 1:
		stars = 2
	elif wrong_attempts >= 2:
		stars = 1
		
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
	modal_score.text = "Skor: %d • Süre: %d sn • Doğruluk: %%%d" % [final_score, duration_sec, 100 if wrong_attempts == 0 else int(100.0 / (wrong_attempts + 1))]
	modal_msg.text = "Harika! Birim kesirleri (1/2 > 1/3 > 1/4) doğru karşılaştırdın ve köprüyü kurdun!"
	
	success_modal.visible = true

func _on_replay_pressed() -> void:
	start_level(current_level_id)

func _on_back_to_map_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/MathWorldSelection.tscn")

func _on_hint_pressed() -> void:
	hints_used += 1
	var hint_text = current_level_data.get("hint_text", "Payda büyüdükçe birim kesir küçülür! 1/2 > 1/3 > 1/4.")
	_set_robot_speech(hint_text)
	hint_modal_text.text = hint_text
	hint_modal.visible = true

func _on_close_hint_pressed() -> void:
	hint_modal.visible = false

func _on_bridge_state_synced(_stars: int, prof_name: String, _av_id: String) -> void:
	if nickname_badge and not prof_name.is_empty():
		nickname_badge.text = prof_name

func _update_responsive_layout() -> void:
	var vp_size = get_viewport_rect().size
	if vp_size.x <= 0 or vp_size.y <= 0:
		return
		
	var aspect = vp_size.x / vp_size.y
	is_mobile_mode = aspect < 0.85
	
	if is_mobile_mode:
		# Mobil Dikey Mod (Portrait): Sahne çapraz/yukarı doğru yükselir
		left_cliff.position = Vector2(10, vp_size.y - 360)
		left_cliff.size = Vector2(240, 180)
		
		right_cliff.position = Vector2(vp_size.x - 250, 110)
		right_cliff.size = Vector2(240, 180)
		
		bridge_ropes.position = Vector2(80, 160)
		bridge_ropes.size = Vector2(vp_size.x - 120, 260)
		bridge_ropes.rotation_degrees = -14.0
		
		slots_container.position = Vector2(40, 220)
		slots_container.size = Vector2(vp_size.x - 80, 100)
		slots_container.alignment = BoxContainer.ALIGNMENT_CENTER
	else:
		# Masaüstü / Yatay Mod: Ferah, dengeli yatay asma köprü
		left_cliff.position = Vector2(40, 280)
		left_cliff.size = Vector2(300, 225)
		
		right_cliff.position = Vector2(vp_size.x - 340, 280)
		right_cliff.size = Vector2(300, 225)
		
		var bridge_width = max(400.0, vp_size.x - 680.0)
		bridge_ropes.position = Vector2(300, 310)
		bridge_ropes.size = Vector2(bridge_width + 80.0, 160)
		bridge_ropes.rotation_degrees = 0.0
		
		slots_container.position = Vector2(340, 340)
		slots_container.size = Vector2(bridge_width, 100)
		slots_container.alignment = BoxContainer.ALIGNMENT_CENTER
