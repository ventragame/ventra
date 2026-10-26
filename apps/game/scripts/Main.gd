extends Control

@onready var title_label: Label = $MarginContainer/VBoxContainer/TitleLabel
@onready var status_label: Label = $MarginContainer/VBoxContainer/StatusLabel
@onready var complete_btn: Button = $MarginContainer/VBoxContainer/HBoxContainer/CompleteButton
@onready var fail_btn: Button = $MarginContainer/VBoxContainer/HBoxContainer/FailButton
@onready var return_map_btn: Button = $MarginContainer/VBoxContainer/ReturnMapButton

var start_time: int = 0
var current_student: String = "Öğrenci"

func _ready() -> void:
	# Kesir Atölyesi ana sahnesine yönlendir
	get_tree().change_scene_to_file("res://scenes/FractionWorkshop.tscn")

func _on_return_map_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/WorldMap.tscn")

func _on_game_started(student_name: String, level_id: int) -> void:
	current_student = student_name
	status_label.text = "Oyun Başladı! Öğrenci: %s | Seviye: %d" % [student_name, level_id]
	complete_btn.disabled = false
	fail_btn.disabled = false

func _on_state_synced(stars: int) -> void:
	print("Bakiye güncellendi: ", stars)

func _on_complete_pressed() -> void:
	var duration = int((Time.get_ticks_msec() - start_time) / 1000.0)
	status_label.text = "Tebrikler! Bölüm tamamlandı. Sonuç Next.js'e iletiliyor..."
	complete_btn.disabled = true
	fail_btn.disabled = true
	Bridge.send_game_completed(100, true, 3, duration)

func _on_fail_pressed() -> void:
	var duration = int((Time.get_ticks_msec() - start_time) / 1000.0)
	status_label.text = "Tekrar Dene! Sonuç Next.js'e iletiliyor..."
	complete_btn.disabled = true
	fail_btn.disabled = true
	Bridge.send_game_completed(40, false, 0, duration)

