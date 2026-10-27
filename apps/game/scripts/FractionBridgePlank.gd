class_name FractionBridgePlank
extends Control

## VENTRA — Kesir Köprüsü Tahta Parçası (Fraction Bridge Plank)
## Gerçek matematiksel oranlara (1/payda) göre uzunluğu belirlenen birim kesir tahtası.

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

@onready var panel: PanelContainer = $Panel
@onready var fraction_label: Label = $Panel/Margin/VBox/FractionLabel
@onready var length_bar: ColorRect = $Panel/Margin/VBox/LengthBar
@onready var glow_border: ReferenceRect = $Panel/GlowBorder

# Renk Paleti (Birim kesirlere özel ferah ahşap ve neon mavi-altın tonları)
const PLANK_COLOR_MAP = {
	2: Color("#38bdf8"),  # Yarım: Parlak Gök Mavisi (En Büyük)
	3: Color("#2dd4bf"),  # Üçte bir: Turkuaz
	4: Color("#34d399"),  # Çeyrek: Zümrüt Yeşili
	5: Color("#a3e635"),  # Beşte bir: Fıstık Yeşili
	6: Color("#facc15"),  # Altıda bir: Canlı Sarı
	7: Color("#fb923c"),  # Yedide bir: Turuncu
	8: Color("#f87171"),  # Sekizde bir: Mercan
	10: Color("#e879f9"), # Onda bir: Pembe
	12: Color("#c084fc"), # On ikide bir: Mor
	15: Color("#818cf8"), # On beşte bir: İndigo
	16: Color("#60a5fa"), # On altıda bir: Mavi
	20: Color("#94a3b8")  # Yirmide bir: Gümüş / Çelik (En Küçük)
}

func _ready() -> void:
	custom_minimum_size = calculate_proportional_size(denominator)
	size = custom_minimum_size
	mouse_filter = Control.MOUSE_FILTER_PASS
	_update_visuals()

static func calculate_proportional_size(den: int) -> Vector2:
	# Matematiksel referans bütün: 340 px
	# En büyük parça (1/2): 170 px
	# En küçük parça (1/20): min 68 px (okunabilirlik ve dokunmatik hedef sınırı)
	var ref_whole = 340.0
	var proportional_width = ref_whole / float(max(1, den))
	var clamped_width = clampf(proportional_width, 68.0, 175.0)
	return Vector2(clamped_width, 74.0)

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
		fraction_label.text = "1/%d" % denominator
	
	var accent_color = PLANK_COLOR_MAP.get(denominator, Color("#38bdf8"))
	
	if length_bar:
		length_bar.color = accent_color
		
	if glow_border:
		glow_border.visible = is_selected
		glow_border.border_color = Color("#facc15") if is_selected else Color.TRANSPARENT

	# Panel stili
	if panel:
		var style = StyleBoxFlat.new()
		style.set_corner_radius_all(10)
		style.bg_color = Color("#0f1b33") if not is_selected else Color("#1a2b4f")
		style.border_color = Color("#facc15") if is_selected else accent_color.lerp(Color.WHITE, 0.25)
		style.set_border_width_all(3 if is_selected else 2)
		style.shadow_size = 6 if is_selected else 3
		style.shadow_color = Color(0, 0, 0, 0.45)
		panel.add_theme_stylebox_override("panel", style)

func set_selected(selected: bool) -> void:
	is_selected = selected
	_update_visuals()
	
	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if selected:
		tween.tween_property(self, "scale", Vector2(1.08, 1.08), 0.15)
	else:
		tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.15)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				drag_offset = get_global_mouse_position() - global_position
				is_dragging = true
				plank_drag_started.emit(self)
				plank_clicked.emit(self)
			else:
				if is_dragging:
					is_dragging = false
					plank_drag_ended.emit(self, get_global_mouse_position())
	elif event is InputEventScreenTouch:
		var st = event as InputEventScreenTouch
		if st.pressed:
			is_dragging = true
			plank_drag_started.emit(self)
			plank_clicked.emit(self)
		else:
			if is_dragging:
				is_dragging = false
				plank_drag_ended.emit(self, st.position)

