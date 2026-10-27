class_name MathWorldSelection
extends Control

## VENTRA — Matematik Dünyası Oyun Seçim Ekranı
## Kesir Atölyesi (M.4.1.6.1) ve Kesir Köprüsü (M.4.1.6.2) oyunlarını sunar.

@onready var background: TextureRect = $Background
@onready var back_button: Button = $UI/SafeMargin/MainLayout/TopBar/BackButton
@onready var title_label: Label = $UI/SafeMargin/MainLayout/TopBar/TitleContainer/TitleLabel
@onready var subtitle_label: Label = $UI/SafeMargin/MainLayout/TopBar/TitleContainer/SubLabel
@onready var cards_container: BoxContainer = $UI/SafeMargin/MainLayout/Scroll/CardsContainer

@onready var workshop_card: PanelContainer = $UI/SafeMargin/MainLayout/Scroll/CardsContainer/WorkshopCard
@onready var workshop_start_btn: Button = $UI/SafeMargin/MainLayout/Scroll/CardsContainer/WorkshopCard/Margin/VBox/StartButton

@onready var bridge_card: PanelContainer = $UI/SafeMargin/MainLayout/Scroll/CardsContainer/BridgeCard
@onready var bridge_start_btn: Button = $UI/SafeMargin/MainLayout/Scroll/CardsContainer/BridgeCard/Margin/VBox/StartButton

var _is_mobile: bool = false

func _ready() -> void:
	back_button.pressed.connect(_on_back_to_worldmap_pressed)
	workshop_start_btn.pressed.connect(_on_workshop_start_pressed)
	bridge_start_btn.pressed.connect(_on_bridge_start_pressed)
	
	get_viewport().size_changed.connect(_on_viewport_resized)
	_on_viewport_resized()

func _on_back_to_worldmap_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/WorldMap.tscn")

func _on_workshop_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/FractionWorkshop.tscn")

func _on_bridge_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/FractionBridge.tscn")

func _on_viewport_resized() -> void:
	var vp_size = get_viewport_rect().size
	if vp_size.x <= 0 or vp_size.y <= 0:
		return
	var aspect = vp_size.x / vp_size.y
	_is_mobile = aspect < 0.85
	
	if cards_container:
		if _is_mobile:
			cards_container.alignment = BoxContainer.ALIGNMENT_CENTER
			workshop_card.custom_minimum_size = Vector2(vp_size.x - 48.0, 260)
			bridge_card.custom_minimum_size = Vector2(vp_size.x - 48.0, 260)
		else:
			workshop_card.custom_minimum_size = Vector2(380, 360)
			bridge_card.custom_minimum_size = Vector2(380, 360)

