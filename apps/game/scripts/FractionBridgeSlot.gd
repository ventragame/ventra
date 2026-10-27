class_name FractionBridgeSlot
extends Control

## VENTRA — Kesir Köprüsü Yuvası (Fraction Bridge Slot)
## Köprü üzerindeki birim kesir tahtası yerleştirme istasyonu ve karşılaştırma sembolü.

signal slot_clicked(slot: Control)
signal plank_removed_from_slot(slot: Control, plank: Control)

@export var slot_index: int = 0
@export var comparison_symbol: String = ">" # ">", "<" veya "" (son parça için boş)

var current_plank: Control = null
var is_highlighted: bool = false
var is_error: bool = false

@onready var slot_panel: PanelContainer = $HBox/SlotPanel
@onready var slot_label: Label = $HBox/SlotPanel/Margin/SlotLabel
@onready var symbol_label: Label = $HBox/SymbolContainer/SymbolLabel
@onready var symbol_container: Control = $HBox/SymbolContainer
@onready var plank_anchor: Control = $HBox/SlotPanel/Margin/PlankAnchor

func _ready() -> void:
	custom_minimum_size = Vector2(130, 84)
	mouse_filter = Control.MOUSE_FILTER_PASS
	_update_slot_visuals()

func setup(index: int, symbol: String) -> void:
	slot_index = index
	comparison_symbol = symbol
	_update_slot_visuals()

func _update_slot_visuals() -> void:
	if not is_inside_tree():
		return
		
	if slot_label:
		slot_label.text = "%d. Yuva" % (slot_index + 1)
		slot_label.visible = (current_plank == null)
		
	if symbol_label and symbol_container:
		if comparison_symbol.is_empty():
			symbol_container.visible = false
		else:
			symbol_container.visible = true
			symbol_label.text = comparison_symbol
			# Sembol rengi: Altın sarısı neon
			symbol_label.add_theme_color_override("font_color", Color("#fbbf24"))

	if slot_panel:
		var style = StyleBoxFlat.new()
		style.set_corner_radius_all(10)
		
		if is_error:
			style.bg_color = Color("#450a0a")
			style.border_color = Color("#ef4444")
			style.set_border_width_all(3)
		elif is_highlighted:
			style.bg_color = Color("#064e3b")
			style.border_color = Color("#10b981")
			style.set_border_width_all(3)
		elif current_plank != null:
			style.bg_color = Color("#0c1527")
			style.border_color = Color("#38bdf8")
			style.set_border_width_all(2)
		else:
			style.bg_color = Color("#080f1d")
			style.border_color = Color("#334155")
			style.set_border_width_all(2)
			
		style.shadow_size = 4
		style.shadow_color = Color(0, 0, 0, 0.4)
		slot_panel.add_theme_stylebox_override("panel", style)

func place_plank(plank: Control) -> void:
	if current_plank != null and current_plank != plank:
		remove_plank()
		
	current_plank = plank
	plank.is_placed = true
	plank.current_slot_index = slot_index
	
	if plank.get_parent():
		plank.get_parent().remove_child(plank)
		
	plank_anchor.add_child(plank)
	plank.position = Vector2.ZERO
	plank.set_selected(false)
	
	# Parçanın genişliğine göre yuva boyutunu yumuşakça ayarla
	custom_minimum_size.x = max(110.0, plank.size.x + 24.0)
	is_error = false
	_update_slot_visuals()
	
	# Yerleşme animasyonu
	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	plank.scale = Vector2(0.85, 0.85)
	tween.tween_property(plank, "scale", Vector2.ONE, 0.18)

func remove_plank() -> Control:
	if current_plank == null:
		return null
		
	var p = current_plank
	current_plank = null
	p.is_placed = false
	p.current_slot_index = -1
	
	if p.get_parent() == plank_anchor:
		plank_anchor.remove_child(p)
		
	is_error = false
	custom_minimum_size = Vector2(130, 84)
	_update_slot_visuals()
	plank_removed_from_slot.emit(self, p)
	return p

func set_highlight(active: bool) -> void:
	is_highlighted = active
	_update_slot_visuals()

func set_error_state(error: bool) -> void:
	is_error = error
	_update_slot_visuals()
	if error:
		var tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		tween.tween_property(slot_panel, "position:x", 6.0, 0.05)
		tween.tween_property(slot_panel, "position:x", -6.0, 0.05)
		tween.tween_property(slot_panel, "position:x", 0.0, 0.05)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			slot_clicked.emit(self)
	elif event is InputEventScreenTouch:
		var st = event as InputEventScreenTouch
		if st.pressed:
			slot_clicked.emit(self)
