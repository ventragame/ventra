class_name FractionBridgePlank
extends Control

## VENTRA — Kesir Köprüsü Ahşap Kalas Parçası (Fraction Bridge Plank)
## Gerçek ahşap dokusu ve matematiksel olarak W/n ile tam orantılı görünür uzunluk.

signal plank_clicked(plank: FractionBridgePlank)
signal plank_drag_started(plank: FractionBridgePlank)
signal plank_drag_ended(plank: FractionBridgePlank, screen_pos: Vector2)

@export var numerator: int = 1
@export var denominator: int = 2

var is_selected: bool = false
var is_dragging: bool = false
var is_placed: bool = false
var current_slot_index: int = -1

var original_tray_parent: Node = null
var original_tray_index: int = -1
var drag_offset: Vector2 = Vector2.ZERO

@onready var wood_texture: NinePatchRect = $WoodTexture
@onready var fraction_label: Label = $Margin/VBox/FractionLabel
@onready var length_bar: ColorRect = $Margin/VBox/LengthBar
@onready var glow_border: ReferenceRect = $GlowBorder

# Birim kesirlere özel ferah accent ve parlaklık tonları
const PLANK_COLOR_MAP = {
	2: Color("#38bdf8"),  # 1/2: Parlak Gök Mavisi (En Geniş Kalas)
	3: Color("#2dd4bf"),  # 1/3: Turkuaz (Orta Kalas)
	4: Color("#34d399"),  # 1/4: Zümrüt Yeşili (Kısa Kalas)
	6: Color("#facc15"),  # 1/6: Canlı Altın
	8: Color("#f87171"),  # 1/8: Mercan
	10: Color("#e879f9")  # 1/10: Pembe
}

func _ready() -> void:
	custom_minimum_size = calculate_proportional_size(denominator)
	size = custom_minimum_size
	mouse_filter = Control.MOUSE_FILTER_PASS
	_update_visuals()

static func calculate_proportional_size(den: int) -> Vector2:
	# Matematiksel referans bütün: 340.0 px
	# 1/2: 170.0 px
	# 1/3: 113.33 px
	# 1/4: 85.0 px
	# Tüm parçalar W/n formülüyle tam orantılıdır.
	var ref_whole = 340.0
	var proportional_width = ref_whole / float(max(1, den))
	return Vector2(snappedf(proportional_width, 0.1), 76.0)

func setup(num: int, den: int) -> void:
	numerator = num
	denominator = den
	custom_minimum_size = calculate_proportional_size(den)
	size = custom_minimum_size
	_update_visuals()

func _update_visuals() -> void:
	if not is_inside_tree():
		return
		
	if fraction_label:
		fraction_label.text = "1 / %d" % denominator
	
	var accent_color = PLANK_COLOR_MAP.get(denominator, Color("#38bdf8"))
	
	if length_bar:
		length_bar.color = accent_color
		
	if glow_border:
		glow_border.visible = is_selected
		glow_border.border_color = Color("#facc15") if is_selected else Color.TRANSPARENT

func set_selected(selected: bool) -> void:
	is_selected = selected
	_update_visuals()
	
	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if selected:
		z_index = 20
		tween.tween_property(self, "scale", Vector2(1.08, 1.08), 0.15)
	else:
		z_index = 0
		tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.15)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				drag_offset = get_global_mouse_position() - global_position
				is_dragging = true
				z_index = 50
				plank_drag_started.emit(self)
				plank_clicked.emit(self)
			else:
				if is_dragging:
					is_dragging = false
					z_index = 0
					plank_drag_ended.emit(self, get_global_mouse_position())
	elif event is InputEventScreenTouch:
		var st = event as InputEventScreenTouch
		if st.pressed:
			is_dragging = true
			z_index = 50
			plank_drag_started.emit(self)
			plank_clicked.emit(self)
		else:
			if is_dragging:
				is_dragging = false
				z_index = 0
				plank_drag_ended.emit(self, st.position)
