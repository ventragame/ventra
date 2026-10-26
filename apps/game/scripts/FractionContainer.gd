class_name FractionContainer
extends PanelContainer

## VENTRA — Kesir Atölyesi Bütün Modeli (Fraction Container)
## Tek bir tam bütünü ve eş parçalı yuvalarını temsil eden bileşen.

signal slot_interacted(whole_index: int, slot_index: int, was_filled: bool)
signal piece_dropped_in_slot(whole_index: int, slot_index: int, piece_data: Dictionary)

const FractionSlotScene = preload("res://scenes/FractionSlot.tscn")

@export var whole_index: int = 1
@export var total_slots: int = 4
@export var piece_den: int = 4

var _title_label: Label
var _status_badge: Label
var _slots_box: HBoxContainer
var _slots: Array[FractionSlot] = []

func _init() -> void:
	custom_minimum_size = Vector2(280, 130)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_setup_container_style()

func _ready() -> void:
	_create_ui()

func _setup_container_style() -> void:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.051, 0.086, 0.161, 0.9) # #0d1629
	style.border_color = Color(0.15, 0.25, 0.42, 0.8) # #26406b
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	style.corner_radius_top_left = 14
	style.corner_radius_top_right = 14
	style.corner_radius_bottom_right = 14
	style.corner_radius_bottom_left = 14
	style.content_margin_left = 16
	style.content_margin_top = 12
	style.content_margin_right = 16
	style.content_margin_bottom = 14
	style.shadow_color = Color(0.0, 0.0, 0.0, 0.4)
	style.shadow_size = 8
	add_theme_stylebox_override("panel", style)

func _create_ui() -> void:
	var main_vbox = VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 10)
	add_child(main_vbox)
	
	# Başlık ve Durum Satırı
	var header_hbox = HBoxContainer.new()
	header_hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	main_vbox.add_child(header_hbox)
	
	_title_label = Label.new()
	_title_label.text = "%d. BÜTÜN" % whole_index
	_title_label.add_theme_color_override("font_color", Color(0.9, 0.95, 1.0))
	_title_label.add_theme_font_size_override("font_size", 16)
	_title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header_hbox.add_child(_title_label)
	
	_status_badge = Label.new()
	_status_badge.text = "0 / %d" % total_slots
	_status_badge.add_theme_color_override("font_color", Color(0.58, 0.64, 0.72))
	_status_badge.add_theme_font_size_override("font_size", 14)
	header_hbox.add_child(_status_badge)
	
	# Yuvalar Çubuğu (Slot Bar)
	_slots_box = HBoxContainer.new()
	_slots_box.add_theme_constant_override("separation", 6)
	_slots_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_slots_box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	main_vbox.add_child(_slots_box)
	
	_rebuild_slots()

func setup(w_index: int, slots_cnt: int, den: int) -> void:
	whole_index = w_index
	total_slots = slots_cnt
	piece_den = den
	if is_inside_tree():
		if _title_label:
			_title_label.text = "%d. BÜTÜN" % whole_index
		_rebuild_slots()

func _rebuild_slots() -> void:
	if not _slots_box:
		return
		
	for child in _slots_box.get_children():
		child.queue_free()
	_slots.clear()
	
	for i in range(total_slots):
		var slot: FractionSlot = FractionSlotScene.instantiate()
		slot.setup(i, piece_den, false)
		slot.slot_clicked.connect(_on_slot_clicked)
		slot.piece_dropped.connect(_on_slot_piece_dropped)
		_slots_box.add_child(slot)
		_slots.append(slot)
		
	_update_status_display()

func _on_slot_clicked(slot_idx: int) -> void:
	if slot_idx >= 0 and slot_idx < _slots.size():
		var slot = _slots[slot_idx]
		var was_filled = slot.is_filled
		# Tıklandığında doluysa boşalt, boşsa doldur
		slot.set_filled(not was_filled, true)
		_update_status_display()
		slot_interacted.emit(whole_index, slot_idx, was_filled)

func _on_slot_piece_dropped(slot_idx: int, piece_data: Dictionary) -> void:
	if slot_idx >= 0 and slot_idx < _slots.size():
		var slot = _slots[slot_idx]
		if not slot.is_filled:
			slot.set_filled(true, true)
			_update_status_display()
			piece_dropped_in_slot.emit(whole_index, slot_idx, piece_data)

func get_filled_count() -> int:
	var count = 0
	for s in _slots:
		if s.is_filled:
			count += 1
	return count

func is_full() -> bool:
	return get_filled_count() >= total_slots

func set_slot(idx: int, filled: bool, animate: bool = true) -> void:
	if idx >= 0 and idx < _slots.size():
		_slots[idx].set_filled(filled, animate)
		_update_status_display()

func add_first_available() -> int:
	for i in range(_slots.size()):
		if not _slots[i].is_filled:
			_slots[i].set_filled(true, true)
			_update_status_display()
			return i
	return -1

func remove_last_filled() -> int:
	for i in range(_slots.size() - 1, -1, -1):
		if _slots[i].is_filled:
			_slots[i].set_filled(false, true)
			_update_status_display()
			return i
	return -1

func clear_all() -> void:
	for s in _slots:
		s.set_filled(false, false)
	_update_status_display()

func fill_all() -> void:
	for s in _slots:
		s.set_filled(true, false)
	_update_status_display()

func _update_status_display() -> void:
	if not _status_badge:
		return
	var filled = get_filled_count()
	if filled == total_slots and total_slots > 0:
		_status_badge.text = "%d / %d (1 Tam Dolu! ✨)" % [filled, total_slots]
		_status_badge.add_theme_color_override("font_color", Color(0.22, 0.74, 0.97)) # Cyan
	else:
		_status_badge.text = "%d / %d" % [filled, total_slots]
		_status_badge.add_theme_color_override("font_color", Color(0.58, 0.64, 0.72))

