class_name FractionWorkshop
extends Control

## VENTRA — Kesir Atölyesi (Fraction Workshop) Mini Oyunu
## MEB M.4.1.6.1 müfredatı ve Ventra İç Beceri Sözleşmesi ile tam uyumlu üretim oyunu.

const FractionMath = preload("res://scripts/FractionMath.gd")
const FractionLevelCatalog = preload("res://scripts/FractionLevelCatalog.gd")
const FractionContainerScene = preload("res://scenes/FractionContainer.tscn")
const FractionPieceScene = preload("res://scenes/FractionPiece.tscn")

# UI Düğümleri
@onready var background: TextureRect = $Background
@onready var safe_margin: MarginContainer = $UI/SafeMargin
@onready var back_button: Button = $UI/SafeMargin/MainLayout/TopBar/BackButton
@onready var level_label: Label = $UI/SafeMargin/MainLayout/TopBar/LevelInfo/LevelLabel
@onready var stars_label: Label = $UI/SafeMargin/MainLayout/TopBar/LevelInfo/StarsLabel
@onready var hint_button: Button = $UI/SafeMargin/MainLayout/TopBar/HintButton
@onready var right_spacer: Control = $UI/SafeMargin/MainLayout/TopBar/RightSpacer

@onready var target_type_badge: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/Badge
@onready var target_fraction_label: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/FractionDisplay
@onready var target_desc_label: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/DescLabel
@onready var current_status_label: Label = $UI/SafeMargin/MainLayout/TargetCard/VBox/StatusLabel

@onready var wholes_scroll: ScrollContainer = $UI/SafeMargin/MainLayout/WholesScroll
@onready var wholes_box: BoxContainer = $UI/SafeMargin/MainLayout/WholesScroll/WholesBox

@onready var feedback_panel: PanelContainer = $UI/SafeMargin/MainLayout/FeedbackPanel
@onready var feedback_label: Label = $UI/SafeMargin/MainLayout/FeedbackPanel/FeedbackLabel

@onready var pieces_box: HBoxContainer = $UI/SafeMargin/MainLayout/BottomBar/TrayPanel/PiecesBox
@onready var undo_button: Button = $UI/SafeMargin/MainLayout/BottomBar/Actions/UndoButton
@onready var reset_button: Button = $UI/SafeMargin/MainLayout/BottomBar/Actions/ResetButton
@onready var check_button: Button = $UI/SafeMargin/MainLayout/BottomBar/Actions/CheckButton

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
var containers: Array[FractionContainer] = []
var action_history: Array[Dictionary] = [] # Geri alma (Undo) geçmişi

var start_time_msec: int = 0
var wrong_attempts: int = 0
var hints_used: int = 0
var total_stars: int = 0
var level_completed: bool = false

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
	check_button.pressed.connect(_on_check_pressed)
	
	next_level_btn.pressed.connect(_on_next_level_pressed)
	exit_map_btn.pressed.connect(_on_back_to_map_pressed)
	close_hint_btn.pressed.connect(_on_close_hint_pressed)

func start_level(level_id: int) -> void:
	current_level_id = level_id
	current_level_data = FractionLevelCatalog.get_level(level_id)
	
	start_time_msec = Time.get_ticks_msec()
	wrong_attempts = 0
	hints_used = 0
	level_completed = false
	action_history.clear()
	
	success_modal.visible = false
	hint_modal.visible = false
	
	_setup_level_ui()
	_build_containers()
	_build_piece_tray()
	_update_live_status()
	
	feedback_label.text = "Parçaları kalıplara yerleştirmek için tıkla veya sürükle, ardından 'Kontrol Et'e bas!"
	_set_feedback_color(Color(0.22, 0.74, 0.97)) # Normal Cyan

func _setup_level_ui() -> void:
	level_label.text = "BÖLÜM %d / %d • %s" % [
		current_level_id, 
		FractionLevelCatalog.get_total_levels(), 
		current_level_data.get("title", "")
	]
	stars_label.text = "★ %d" % total_stars
	
	var ftype = current_level_data.get("fraction_type", "proper")
	var num = current_level_data.get("target_num", 1)
	var den = current_level_data.get("target_den", 2)
	var whole = current_level_data.get("target_whole", 0)
	
	match ftype:
		"proper":
			target_type_badge.text = "BASİT KESİR"
			target_type_badge.add_theme_color_override("font_color", Color(0.22, 0.74, 0.97)) # Cyan
			target_fraction_label.text = "Hedef: %d / %d" % [num, den]
		"improper":
			target_type_badge.text = "BİLEŞİK KESİR"
			target_type_badge.add_theme_color_override("font_color", Color(0.96, 0.62, 0.04)) # Amber
			target_fraction_label.text = "Hedef: %d / %d" % [num, den]
		"mixed":
			target_type_badge.text = "TAM SAYILI KESİR"
			target_type_badge.add_theme_color_override("font_color", Color(0.66, 0.33, 0.97)) # Purple
			target_fraction_label.text = "Hedef: %d tam %d / %d" % [whole, num, den]
			
	target_desc_label.text = current_level_data.get("description", "")

func _build_containers() -> void:
	for c in wholes_box.get_children():
		c.queue_free()
	containers.clear()
	
	var wholes_cnt = current_level_data.get("wholes_count", 1)
	var ppw = current_level_data.get("pieces_per_whole", 4)
	var den = current_level_data.get("target_den", 4)
	
	for i in range(wholes_cnt):
		var container: FractionContainer = FractionContainerScene.instantiate()
		container.setup(i + 1, ppw, den)
		container.slot_interacted.connect(_on_container_slot_interacted)
		container.piece_dropped_in_slot.connect(_on_container_piece_dropped)
		wholes_box.add_child(container)
		containers.append(container)

func _build_piece_tray() -> void:
	for p in pieces_box.get_children():
		p.queue_free()
		
	var pieces = current_level_data.get("available_pieces", [])
	for pinfo in pieces:
		var p_den = pinfo.get("den", 4)
		var p_num = pinfo.get("num", 1)
		var piece_btn: FractionPiece = FractionPieceScene.instantiate()
		piece_btn.setup(p_den, p_num)
		piece_btn.piece_selected.connect(_on_tray_piece_clicked)
		pieces_box.add_child(piece_btn)

func _on_tray_piece_clicked(den: int) -> void:
	if level_completed:
		return
		
	# İlk boş yuvası olan bütünü bul ve yerleştir
	for c_idx in range(containers.size()):
		var container = containers[c_idx]
		if not container.is_full():
			var slot_idx = container.add_first_available()
			if slot_idx != -1:
				action_history.append({
					"type": "add",
					"container_idx": c_idx,
					"slot_idx": slot_idx
				})
				_update_live_status()
				return
				
	feedback_label.text = "Tüm kalıplar tamamen dolu! Fazla parçaları çıkarmak için üzerine dokunabilirsin."
	_set_feedback_color(Color(0.96, 0.62, 0.04))

func _on_container_slot_interacted(whole_idx: int, slot_idx: int, was_filled: bool) -> void:
	if level_completed:
		return
	var c_idx = whole_idx - 1
	action_history.append({
		"type": "remove" if was_filled else "add",
		"container_idx": c_idx,
		"slot_idx": slot_idx
	})
	_update_live_status()

func _on_container_piece_dropped(whole_idx: int, slot_idx: int, _piece_data: Dictionary) -> void:
	if level_completed:
		return
	var c_idx = whole_idx - 1
	action_history.append({
		"type": "add",
		"container_idx": c_idx,
		"slot_idx": slot_idx
	})
	_update_live_status()

func _on_undo_pressed() -> void:
	if level_completed or action_history.is_empty():
		return
		
	var last_action = action_history.pop_back()
	var c_idx = last_action.get("container_idx", 0)
	var slot_idx = last_action.get("slot_idx", 0)
	var atype = last_action.get("type", "add")
	
	if c_idx >= 0 and c_idx < containers.size():
		var container = containers[c_idx]
		# Eğer 'add' idiyse geri alırken boşalt, 'remove' idiyse doldur
		container.set_slot(slot_idx, atype == "remove", true)
		_update_live_status()
		feedback_label.text = "Son işlem geri alındı."
		_set_feedback_color(Color(0.58, 0.64, 0.72))

func _on_reset_pressed() -> void:
	if level_completed:
		return
	for c in containers:
		c.clear_all()
	action_history.clear()
	_update_live_status()
	feedback_label.text = "Tüm kalıplar sıfırlandı. Yeniden başlayabilirsin!"
	_set_feedback_color(Color(0.22, 0.74, 0.97))

func _get_total_filled_pieces() -> int:
	var total = 0
	for c in containers:
		total += c.get_filled_count()
	return total

func _update_live_status() -> void:
	var filled_pieces = _get_total_filled_pieces()
	var den = current_level_data.get("target_den", 4)
	var ftype = current_level_data.get("fraction_type", "proper")
	
	if ftype == "mixed":
		var mixed_rep = FractionMath.to_mixed(filled_pieces, den)
		if mixed_rep.whole > 0 and mixed_rep.num > 0:
			current_status_label.text = "Mevcut: %d tam %d/%d (%d parça)" % [mixed_rep.whole, mixed_rep.num, den, filled_pieces]
		elif mixed_rep.whole > 0 and mixed_rep.num == 0:
			current_status_label.text = "Mevcut: %d Tam Bütün (%d parça)" % [mixed_rep.whole, filled_pieces]
		else:
			current_status_label.text = "Mevcut: %d/%d (%d parça)" % [filled_pieces, den, filled_pieces]
	else:
		current_status_label.text = "Mevcut Model: %d / %d" % [filled_pieces, den]

func _on_check_pressed() -> void:
	if level_completed:
		return
		
	var filled_pieces = _get_total_filled_pieces()
	var den = current_level_data.get("target_den", 4)
	var num = current_level_data.get("target_num", 1)
	var whole = current_level_data.get("target_whole", 0)
	var ftype = current_level_data.get("fraction_type", "proper")
	
	# Hedeflenen toplam pay parçası
	var target_total_num = num
	if ftype == "mixed":
		target_total_num = (whole * den) + num
		
	var is_correct = (filled_pieces == target_total_num)
	
	if is_correct:
		_handle_level_success()
	else:
		_handle_level_error(target_total_num, filled_pieces, den, whole, num, ftype)

func _handle_level_success() -> void:
	level_completed = true
	var duration_sec = int((Time.get_ticks_msec() - start_time_msec) / 1000.0)
	var stars = FractionMath.calculate_stars(wrong_attempts, hints_used)
	var score = FractionMath.calculate_score(wrong_attempts, hints_used, duration_sec)
	total_stars += stars
	stars_label.text = "★ %d" % total_stars
	
	# Köprüye bildirim gönder
	var bridge = get_node_or_null("/root/Bridge")
	if bridge:
		bridge.send_fraction_workshop_completed(
			current_level_id,
			current_level_data.get("outcome_id", "MATH.G4.FRAC.01"),
			current_level_data.get("skill_id", "ventra.math.g4.fraction.proper"),
			score,
			true,
			stars,
			duration_sec,
			wrong_attempts + 1,
			wrong_attempts,
			hints_used
		)
		
	# Kutlama Modalı
	modal_stars.text = "★".repeat(stars) + "☆".repeat(3 - stars)
	modal_score.text = "Puan: %d • Süre: %d sn" % [score, duration_sec]
	modal_msg.text = "Harika! %s hedefini başarıyla tamamladın." % current_level_data.get("title", "")
	
	if current_level_id >= FractionLevelCatalog.get_total_levels():
		next_level_btn.text = "Tüm Atölye Tamamlandı! 🎉"
	else:
		next_level_btn.text = "Sonraki Bölüm (%d / %d) →" % [current_level_id + 1, FractionLevelCatalog.get_total_levels()]
		
	success_modal.visible = true
	
	# Başarı kutlama animasyonu
	modal_stars.pivot_offset = modal_stars.size / 2.0
	var tween = create_tween()
	modal_stars.scale = Vector2(0.5, 0.5)
	tween.tween_property(modal_stars, "scale", Vector2(1.2, 1.2), 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(modal_stars, "scale", Vector2(1.0, 1.0), 0.15)

func _handle_level_error(target_total_num: int, filled_pieces: int, den: int, whole: int, num: int, ftype: String) -> void:
	wrong_attempts += 1
	var guidance = FractionMath.get_pedagogical_guidance(ftype, num, den, whole, filled_pieces, den)
	feedback_label.text = guidance
	_set_feedback_color(Color(0.96, 0.62, 0.04)) # Amber uyarı
	
	# Sallama animasyonu (Wobble)
	var tween = create_tween()
	var orig_pos = wholes_box.position
	tween.tween_property(wholes_box, "position:x", orig_pos.x - 8, 0.05)
	tween.tween_property(wholes_box, "position:x", orig_pos.x + 8, 0.05)
	tween.tween_property(wholes_box, "position:x", orig_pos.x - 5, 0.05)
	tween.tween_property(wholes_box, "position:x", orig_pos.x + 5, 0.05)
	tween.tween_property(wholes_box, "position:x", orig_pos.x, 0.05)

func _set_feedback_color(col: Color) -> void:
	var style = feedback_panel.get_theme_stylebox("panel") as StyleBoxFlat
	if style:
		style.border_color = col
	feedback_label.add_theme_color_override("font_color", col)

func _on_next_level_pressed() -> void:
	if current_level_id < FractionLevelCatalog.get_total_levels():
		start_level(current_level_id + 1)
	else:
		_on_back_to_map_pressed()

func _on_hint_pressed() -> void:
	hints_used += 1
	hint_modal_text.text = current_level_data.get("hint_text", "Hedef kesre ulaşmak için kalıbı istenen parça kadar doldur.")
	hint_modal.visible = true

func _on_close_hint_pressed() -> void:
	hint_modal.visible = false

func _on_back_to_map_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/WorldMap.tscn")

func _update_responsive_layout() -> void:
	var vp_size = get_viewport_rect().size
	if vp_size.x <= 0 or vp_size.y <= 0:
		return
		
	var aspect = vp_size.x / vp_size.y
	var is_portrait = aspect < 0.88
	
	# Mobil dikey ekranda safe-area üst boşluğu (Next.js başlığı ve mobil durum çubuğu için)
	var top_margin = 220 if is_portrait else 16
	safe_margin.add_theme_constant_override("margin_top", top_margin)
	safe_margin.add_theme_constant_override("margin_left", 20 if is_portrait else 24)
	safe_margin.add_theme_constant_override("margin_right", 20 if is_portrait else 24)
	safe_margin.add_theme_constant_override("margin_bottom", 20 if is_portrait else 20)
	
	if right_spacer:
		right_spacer.visible = not is_portrait
	
	# Bütünlerin dizilimi: Mobilde dikey, geniş ekranda yatay veya dikey flex
	if wholes_box:
		if is_portrait:
			wholes_box.vertical = true
			wholes_box.add_theme_constant_override("separation", 18)
		else:
			wholes_box.vertical = (containers.size() > 2)
			wholes_box.add_theme_constant_override("separation", 16)
