class_name SkillCatalog
extends RefCounted

## VENTRA — Tek Kaynak Beceri Kataloğu (Single Source of Truth)
## res://data/skills.json dosyasından otomatik yüklenir.

const CATALOG_PATH: String = "res://data/skills.json"

static var _cached_catalog: Dictionary = {}

static func get_catalog() -> Dictionary:
	if not _cached_catalog.is_empty():
		return _cached_catalog
		
	if not FileAccess.file_exists(CATALOG_PATH):
		push_warning("[SkillCatalog] Beceri katalog dosyası bulunamadı: " + CATALOG_PATH)
		return {}
		
	var file = FileAccess.open(CATALOG_PATH, FileAccess.READ)
	if not file:
		push_error("[SkillCatalog] Dosya açılamadı: " + CATALOG_PATH)
		return {}
		
	var json_str = file.get_as_text()
	file.close()
	
	var parsed = JSON.parse_string(json_str)
	if parsed is Dictionary:
		_cached_catalog = parsed
	else:
		push_error("[SkillCatalog] JSON parse hatası: " + CATALOG_PATH)
		_cached_catalog = {}
		
	return _cached_catalog

static func get_skills() -> Array:
	var cat = get_catalog()
	return cat.get("skills", [])

static func get_skill(skill_id: String) -> Dictionary:
	var skills = get_skills()
	for s in skills:
		if s.get("id") == skill_id:
			return s
	return {}

static func is_valid_skill_id(skill_id: String) -> bool:
	return not get_skill(skill_id).is_empty()

static func get_skill_title(skill_id: String) -> String:
	var s = get_skill(skill_id)
	return s.get("title", skill_id)

