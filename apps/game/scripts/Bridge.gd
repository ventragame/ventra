extends Node
class_name VentraBridge

signal message_received(type: String, payload: Dictionary)
signal game_started(student_name: String, level_id: int)
signal state_synced(stars_balance: int)

var _js_callback = null

func _ready() -> void:
	if OS.has_feature("web"):
		_setup_web_bridge()
		send_ready_event()
	else:
		print("[VentraBridge] Masaüstü / Mock modunda başlatıldı.")

func _setup_web_bridge() -> void:
	if OS.has_feature("web"):
		# JS tarafında gelen mesajları güvenli şekilde saklayan dinleyici
		JavaScriptBridge.eval("""
			window.__ventra_last_msg = null;
			window.addEventListener('message', function(event) {
				try {
					var data = event.data;
					if (typeof data === 'object' && data !== null) {
						window.__ventra_last_msg = JSON.stringify(data);
					} else if (typeof data === 'string') {
						window.__ventra_last_msg = data;
					}
				} catch (e) {
					console.error('[Godot Web Helper] Mesaj işleme hatası:', e);
				}
			});
		""")
		
		_js_callback = JavaScriptBridge.create_callback(_on_js_message)
		var window = JavaScriptBridge.get_interface("window")
		if window:
			window.addEventListener("message", _js_callback)
			print("[VentraBridge] Web mesaj dinleyicisi kuruldu.")

func _on_js_message(_args: Array) -> void:
	if not OS.has_feature("web"):
		return
		
	var raw_msg = JavaScriptBridge.eval("window.__ventra_last_msg")
	if raw_msg == null:
		return
		
	var json_str = str(raw_msg)
	if json_str.is_empty() or json_str == "null":
		return

	# Tekrar işlemeyi önlemek için sıfırla
	JavaScriptBridge.eval("window.__ventra_last_msg = null;")

	var json = JSON.new()
	if json.parse(json_str) == OK and typeof(json.data) == TYPE_DICTIONARY:
		var msg_type = str(json.data.get("type", ""))
		var payload = json.data.get("payload", {})
		if not msg_type.is_empty():
			_handle_incoming_message(msg_type, payload)

func _handle_incoming_message(type: String, payload: Dictionary) -> void:
	print("[VentraBridge] Mesaj alındı: ", type)
	message_received.emit(type, payload)
	
	match type:
		"VENTRA_GAME_START":
			var s_name = payload.get("studentName", "Öğrenci")
			var lvl = payload.get("levelId", 1)
			game_started.emit(s_name, lvl)
		"VENTRA_SYNC_STATE":
			var stars = payload.get("starsBalance", 0)
			state_synced.emit(stars)

func send_event(type: String, payload: Dictionary) -> void:
	var message = {
		"type": type,
		"payload": payload
	}
	
	if OS.has_feature("web"):
		var json_str = JSON.stringify(message)
		var escaped = json_str.c_escape()
		JavaScriptBridge.eval("""
			(function() {
				try {
					var raw = "%s";
					var msg = JSON.parse(raw);
					if (window.parent && window.parent !== window) {
						window.parent.postMessage(msg, '*');
					} else {
						window.postMessage(msg, '*');
					}
				} catch(e) {
					console.error('[VentraBridge] send_event hatası:', e);
				}
			})();
		""" % escaped)
	else:
		print("[VentraBridge OUT] ", message)

func send_ready_event() -> void:
	send_event("VENTRA_GAME_READY", {
		"gameId": "kesir_atolyesi",
		"gameVersion": "0.1.0",
		"loadedAt": Time.get_datetime_string_from_system(true)
	})

func send_game_completed(score: int, success: bool, stars: int, duration: int) -> void:
	send_event("VENTRA_GAME_COMPLETED", {
		"sessionId": "sess_%d" % int(Time.get_unix_time_from_system()),
		"gameId": "kesir_atolyesi",
		"levelId": 1,
		"outcomeId": "MATH.G4.FRAC.01",
		"score": score,
		"success": success,
		"starsEarned": stars,
		"metrics": {
			"durationSeconds": duration,
			"attemptsCount": 1,
			"accuracyRate": 1.0 if success else 0.4
		},
		"completedAt": Time.get_datetime_string_from_system(true)
	})

func send_fraction_workshop_completed(level_id: int, outcome_id: String, skill_id: String, score: int, success: bool, stars: int, duration: int, attempts: int, wrong_attempts: int, hints: int) -> void:
	var accuracy = 1.0 if wrong_attempts == 0 else max(0.2, 1.0 - (wrong_attempts * 0.15))
	send_event("VENTRA_GAME_COMPLETED", {
		"sessionId": "sess_%d_%d" % [level_id, int(Time.get_unix_time_from_system())],
		"gameId": "kesir_atolyesi",
		"levelId": level_id,
		"outcomeId": outcome_id,
		"skillId": skill_id,
		"score": score,
		"success": success,
		"starsEarned": stars,
		"metrics": {
			"durationSeconds": duration,
			"attemptsCount": attempts,
			"accuracyRate": snappedf(accuracy, 0.01),
			"wrongAttempts": wrong_attempts,
			"hintsUsed": hints
		},
		"completedAt": Time.get_datetime_string_from_system(true)
	})

func send_fraction_bridge_completed(level_id: int, outcome_id: String, skill_id: String, score: int, success: bool, stars: int, duration: int, attempts: int, wrong_attempts: int, hints: int) -> void:
	var accuracy = 1.0 if wrong_attempts == 0 else max(0.2, 1.0 - (wrong_attempts * 0.15))
	send_event("VENTRA_GAME_COMPLETED", {
		"sessionId": "sess_bridge_%d_%d" % [level_id, int(Time.get_unix_time_from_system())],
		"gameId": "kesir_koprusu",
		"levelId": level_id,
		"outcomeId": outcome_id,
		"skillId": skill_id,
		"score": score,
		"success": success,
		"starsEarned": stars,
		"metrics": {
			"durationSeconds": duration,
			"attemptsCount": attempts,
			"accuracyRate": snappedf(accuracy, 0.01),
			"wrongAttempts": wrong_attempts,
			"hintsUsed": hints
		},
		"completedAt": Time.get_datetime_string_from_system(true)
	})

