class_name FractionPiece
extends PanelContainer

## VENTRA — Kesir Parçası (Fraction Piece Button / Drag Source)
## Tepsiden kalıplara sürüklenen veya tıklandığında otomatik yerleşen parça bileşeni.

signal piece_selected(den: int)

@export var piece_den: int = 4
@export var piece_num: int = 1

var _value_label: Label
var _style_normal: StyleBoxFlat
var _style_hover: StyleBoxFlat
var _style_pressed: StyleBoxFlat

func _init() -> void:
	custom_minimum_size = Vector2(90, 56)
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_setup_styles()

func _ready() -> void:
	_create_ui()
	gui_input.connect(_on_gui_input)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

func _setup_styles() -> void:
	_style_normal = StyleBoxFlat.new()
	_style_normal.bg_color = Color(0.08, 0.15, 0.3, 0.95) # Ventra koyu mavi
	_style_normal.border_color = Color(0.22, 0.74, 0.97, 0.9) # Cyan
	_style_normal.border_width_left = 2
	_style_normal.border_width_top = 2
	_style_normal.border_width_right = 2
	_style_normal.border_width_bottom = 2
	_style_normal.corner_radius_top_left = 10
	_style_normal.corner_radius_top_right = 10
	_style_normal.corner_radius_bottom_right = 10
	_style_normal.corner_radius_bottom_left = 10
	_style_normal.content_margin_left = 12
	_style_normal.content_margin_top = 6
	_style_normal.content_margin_right = 12
	_style_normal.content_margin_bottom = 6
	_style_normal.shadow_color = Color(0.22, 0.74, 0.97, 0.25)
	_style_normal.shadow_size = 4
	
	_style_hover = _style_normal.duplicate()
	_style_hover.bg_color = Color(0.12, 0.22, 0.42, 1.0)
	_style_hover.shadow_size = 8
	
	_style_pressed = _style_normal.duplicate()
	_style_pressed.bg_color = Color(0.06, 0.12, 0.24, 1.0)
	
	add_theme_stylebox_override("panel", _style_normal)

func _create_ui() -> void:
	var vbox = VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 2)
	add_child(vbox)
	
	_value_label = Label.new()
	_value_label.text = "1/%d" % piece_den
	_value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_value_label.add_theme_color_override("font_color", Color(0.95, 0.98, 1.0))
	_value_label.add_theme_font_size_override("font_size", 18)
	vbox.add_child(_value_label)
	
	var sub_label = Label.new()
	sub_label.text = "Parça Ekle +"
	sub_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub_label.add_theme_color_override("font_color", Color(0.22, 0.74, 0.97, 0.8))
	sub_label.add_theme_font_size_override("font_size", 11)
	vbox.add_child(sub_label)

func setup(den: int, num: int = 1) -> void:
	piece_den = den
	piece_num = num
	if _value_label:
		_value_label.text = "1/%d" % piece_den

func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			add_theme_stylebox_override("panel", _style_pressed)
			# Mikro sıçrama animasyonu
			pivot_offset = size / 2.0
			var tween = create_tween()
			tween.tween_property(self, "scale", Vector2(0.92, 0.92), 0.06)
			tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.08)
			piece_selected.emit(piece_den)
			accept_event()
		else:
			add_theme_stylebox_override("panel", _style_hover if Rect2(Vector2.ZERO, size).has_point(get_local_mouse_position()) else _style_normal)

func _on_mouse_entered() -> void:
	add_theme_stylebox_override("panel", _style_hover)

func _on_mouse_exited() -> void:
	add_theme_stylebox_override("panel", _style_normal)

# --- Sürükle & Bırak Desteği ---
func _get_drag_data(_at_position: Vector2) -> Variant:
	var drag_data = {
		"type": "fraction_piece",
		"den": piece_den,
		"num": piece_num
	}
	
	# Sürükleme önizlemesi (Drag Preview)
	var preview = PanelContainer.new()
	preview.custom_minimum_size = Vector2(70, 48)
	var p_style = _style_normal.duplicate()
	p_style.shadow_size = 12
	preview.add_theme_stylebox_override("panel", p_style)
	
	var p_label = Label.new()
	p_label.text = "1/%d" % piece_den
	p_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	p_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	p_label.add_theme_color_override("font_color", Color.WHITE)
	p_label.add_theme_font_size_override("font_size", 16)
	preview.add_child(p_label)
	
	set_drag_preview(preview)
	return drag_data

