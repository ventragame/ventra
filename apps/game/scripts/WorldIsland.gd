extends Area2D
class_name WorldIsland

signal island_selected(island_data: Dictionary)
signal island_hovered(island_data: Dictionary, is_hovering: bool)

@export var island_id: String = "math_island"
@export var island_name: String = "Matematik Dünyası"
@export var island_category: String = "4. Sınıf • Kesirler & Sayılar"
@export_multiline var island_description: String = "Kesir Atölyesi, parça-bütün modellemeleri ve eğlenceli görevlerle dolu macera adası."
@export var island_texture: Texture2D
@export var is_locked: bool = false
@export var stars_required: int = 0
@export var base_scale: Vector2 = Vector2(0.36, 0.36)
@export var bobbing_amplitude: float = 6.0
@export var bobbing_speed: float = 1.6

@onready var sprite: Sprite2D = $IslandSprite
@onready var shadow: Sprite2D = $ShadowSprite
@onready var aura: Sprite2D = $SelectionAura
@onready var label_container: Node2D = $LabelContainer
@onready var name_label: Label = $LabelContainer/Panel/VBox/NameLabel
@onready var category_label: Label = $LabelContainer/Panel/VBox/CategoryLabel
@onready var tag_panel: PanelContainer = $LabelContainer/Panel

var _time_passed: float = 0.0
var _initial_sprite_y: float = 0.0
var _is_hovered: bool = false
var _is_selected: bool = false
var _is_mobile_mode: bool = false
var _base_label_offset_y: float = 160.0
var _scale_tween: Tween
var _aura_tween: Tween

func _ready() -> void:
	if not sprite:
		sprite = get_node_or_null("IslandSprite")
	if not shadow:
		shadow = get_node_or_null("ShadowSprite")
	if not aura:
		aura = get_node_or_null("SelectionAura")
	if not label_container:
		label_container = get_node_or_null("LabelContainer")
	if not name_label:
		name_label = get_node_or_null("LabelContainer/Panel/VBox/NameLabel")
	if not category_label:
		category_label = get_node_or_null("LabelContainer/Panel/VBox/CategoryLabel")
	if not tag_panel:
		tag_panel = get_node_or_null("LabelContainer/Panel")

	if island_texture and sprite:
		sprite.texture = island_texture
	
	if sprite:
		sprite.scale = base_scale
		_initial_sprite_y = sprite.position.y
	
	if shadow:
		shadow.scale = base_scale * Vector2(1.15, 0.42)
		shadow.modulate = Color(0, 0, 0, 0.32)
	
	if aura:
		aura.modulate.a = 0.0
	
	if name_label:
		name_label.text = island_name
	if category_label:
		category_label.text = island_category
		
	# Rastgele başlangıç fazı
	_time_passed = randf() * 12.0
	
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	input_event.connect(_on_input_event)

func _process(delta: float) -> void:
	_time_passed += delta * bobbing_speed
	
	# Yumuşak süzülme ve su üstü mikro eğim animasyonu
	if sprite:
		var offset = sin(_time_passed) * bobbing_amplitude
		var tilt = sin(_time_passed * 0.7) * 0.014
		sprite.position.y = _initial_sprite_y + offset
		sprite.rotation = tilt
		
		# Gölge su derinliğine göre hafifçe nefes alır
		if shadow:
			var shadow_scale_mod = 1.0 - (offset * 0.02)
			shadow.scale = base_scale * Vector2(1.15 * shadow_scale_mod, 0.42 * shadow_scale_mod)
			
		# Ada etiketi ada ile senkronize süzülür
		if label_container:
			label_container.position.y = _base_label_offset_y + (offset * 0.45)

func set_mobile_mode(is_mobile: bool) -> void:
	_is_mobile_mode = is_mobile
	if is_mobile:
		base_scale = Vector2(0.50, 0.50)
		_base_label_offset_y = 215.0
		if sprite:
			sprite.scale = base_scale
		if shadow:
			shadow.scale = base_scale * Vector2(1.15, 0.42)
		if label_container:
			label_container.position.y = _base_label_offset_y
		if name_label:
			name_label.add_theme_font_size_override("font_size", 18)
		if category_label:
			category_label.add_theme_font_size_override("font_size", 13)
		if tag_panel:
			tag_panel.custom_minimum_size = Vector2(280, 62)
		var shape = get_node_or_null("CollisionShape2D")
		if shape and shape.shape is CircleShape2D:
			shape.shape.radius = 230.0
	else:
		base_scale = Vector2(0.38, 0.38)
		_base_label_offset_y = 160.0
		if sprite:
			sprite.scale = base_scale
		if shadow:
			shadow.scale = base_scale * Vector2(1.15, 0.42)
		if label_container:
			label_container.position.y = _base_label_offset_y
		if name_label:
			name_label.add_theme_font_size_override("font_size", 14)
		if category_label:
			category_label.add_theme_font_size_override("font_size", 11)
		if tag_panel:
			tag_panel.custom_minimum_size = Vector2(230, 52)
		var shape = get_node_or_null("CollisionShape2D")
		if shape and shape.shape is CircleShape2D:
			shape.shape.radius = 185.0

func _on_mouse_entered() -> void:
	_is_hovered = true
	if not _is_selected:
		_animate_scale(base_scale * 1.05)
		_animate_aura(0.42)
	island_hovered.emit(get_data(), true)

func _on_mouse_exited() -> void:
	_is_hovered = false
	if not _is_selected:
		_animate_scale(base_scale)
		_animate_aura(0.0)
	island_hovered.emit(get_data(), false)

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton:
		var mb = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			_trigger_selection()
	elif event is InputEventScreenTouch:
		var st = event as InputEventScreenTouch
		if st.pressed:
			_trigger_selection()

func _trigger_selection() -> void:
	set_selected(true)
	
	# Tıklama yaylanması (Punch feedback)
	if sprite:
		if _scale_tween:
			_scale_tween.kill()
		_scale_tween = create_tween()
		_scale_tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		_scale_tween.tween_property(sprite, "scale", base_scale * 1.12, 0.12)
		_scale_tween.tween_property(sprite, "scale", base_scale * 1.07, 0.18)
	
	island_selected.emit(get_data())

func set_selected(selected: bool) -> void:
	_is_selected = selected
	if _is_selected:
		_animate_aura(0.85)
		_animate_scale(base_scale * 1.07)
	else:
		_animate_aura(0.0)
		_animate_scale(base_scale)

func _animate_scale(target: Vector2) -> void:
	if not sprite:
		return
	if _scale_tween:
		_scale_tween.kill()
	_scale_tween = create_tween()
	_scale_tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_scale_tween.tween_property(sprite, "scale", target, 0.22)

func _animate_aura(target_alpha: float) -> void:
	if not aura:
		return
	if _aura_tween:
		_aura_tween.kill()
	_aura_tween = create_tween()
	_aura_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	_aura_tween.tween_property(aura, "modulate:a", target_alpha, 0.3)

func get_data() -> Dictionary:
	return {
		"id": island_id,
		"name": island_name,
		"category": island_category,
		"description": island_description,
		"is_locked": is_locked,
		"stars_required": stars_required,
		"global_position": global_position
	}
