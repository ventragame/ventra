class_name FractionSlot
extends PanelContainer

## VENTRA — Kesir Atölyesi Parça Yuvası (Fraction Slot)
## Tek bir eş parçayı temsil eden etkileşimli yuva (sürükle-bırak & tıkla/dokun destekli).

signal slot_clicked(slot_index: int)
signal piece_dropped(slot_index: int, piece_data: Dictionary)

@export var slot_index: int = 0
@export var piece_den: int = 2
@export var is_filled: bool = false

var _label: Label
var _style_empty: StyleBoxFlat
var _style_filled: StyleBoxFlat
var _style_hover: StyleBoxFlat

func _init() -> void:
	custom_minimum_size = Vector2(60, 84)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_setup_styles()

func _ready() -> void:
	_create_ui()
	_update_visuals(false)
	gui_input.connect(_on_gui_input)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

func _setup_styles() -> void:
	# Boş Yuva Stili
	_style_empty = StyleBoxFlat.new()
	_style_empty.bg_color = Color(0.043, 0.075, 0.141, 0.85) # #0b1324
	_style_empty.border_color = Color(0.22, 0.35, 0.55, 0.5) # Yarı saydam mavi
	_style_empty.border_width_left = 2
	_style_empty.border_width_top = 2
	_style_empty.border_width_right = 2
	_style_empty.border_width_bottom = 2
	_style_empty.corner_radius_top_left = 8
	_style_empty.corner_radius_top_right = 8
	_style_empty.corner_radius_bottom_right = 8
	_style_empty.corner_radius_bottom_left = 8
	
	# Dolu Yuva Stili (Ventra Turkuaz & Mavi Parlama)
	_style_filled = StyleBoxFlat.new()
	_style_filled.bg_color = Color(0.055, 0.647, 0.914, 0.95) # #0ea5e9
	_style_filled.border_color = Color(0.22, 0.74, 0.97, 1.0) # #38bdf8
	_style_filled.border_width_left = 2
	_style_filled.border_width_top = 2
	_style_filled.border_width_right = 2
	_style_filled.border_width_bottom = 2
	_style_filled.corner_radius_top_left = 8
	_style_filled.corner_radius_top_right = 8
	_style_filled.corner_radius_bottom_right = 8
	_style_filled.corner_radius_bottom_left = 8
	_style_filled.shadow_color = Color(0.055, 0.647, 0.914, 0.35)
	_style_filled.shadow_size = 6
	
	# Hover Stili
	_style_hover = _style_empty.duplicate()
	_style_hover.border_color = Color(0.22, 0.74, 0.97, 0.9)

func _create_ui() -> void:
	_label = Label.new()
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(_label)

func setup(idx: int, den: int, filled: bool = false) -> void:
	slot_index = idx
	piece_den = den
	is_filled = filled
	if is_inside_tree():
		_update_visuals(false)

func set_filled(filled: bool, animate: bool = true) -> void:
	if is_filled == filled:
		return
	is_filled = filled
	_update_visuals(animate)

func _update_visuals(animate: bool) -> void:
	if not _label:
		return
		
	if is_filled:
		add_theme_stylebox_override("panel", _style_filled)
		_label.text = "1/%d" % piece_den
		_label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0, 1.0))
		_label.add_theme_font_size_override("font_size", 18)
		
		if animate:
			pivot_offset = size / 2.0
			var tween = create_tween()
			scale = Vector2(0.85, 0.85)
			tween.tween_property(self, "scale", Vector2(1.05, 1.05), 0.1).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
			tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.1).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	else:
		add_theme_stylebox_override("panel", _style_empty)
		_label.text = "1/%d" % piece_den
		_label.add_theme_color_override("font_color", Color(0.4, 0.5, 0.65, 0.45))
		_label.add_theme_font_size_override("font_size", 15)

func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		slot_clicked.emit(slot_index)
		accept_event()

func _on_mouse_entered() -> void:
	if not is_filled:
		add_theme_stylebox_override("panel", _style_hover)

func _on_mouse_exited() -> void:
	if not is_filled:
		add_theme_stylebox_override("panel", _style_empty)

# --- Sürükle & Bırak Desteği ---
func _can_drop_data(_at_position: Vector2, data: Variant) -> bool:
	if is_filled:
		return false
	if typeof(data) == TYPE_DICTIONARY:
		var dtype = data.get("type", "")
		var dden = data.get("den", 0)
		return dtype == "fraction_piece" and dden == piece_den
	return false

func _drop_data(_at_position: Vector2, data: Variant) -> void:
	if _can_drop_data(_at_position, data):
		piece_dropped.emit(slot_index, data)
