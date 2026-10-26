class_name FractionMath
extends RefCounted

## VENTRA — Kesir Aritmetiği ve Pedagojik Değerlendirme Motoru
## 4. Sınıf MEB M.4.1.6.1 standardı ile tam uyumlu matematiksel doğrulama motoru.

# En Büyük Ortak Bölen (EBOB / GCD)
static func gcd(a: int, b: int) -> int:
	a = abs(a)
	b = abs(b)
	while b != 0:
		var temp = b
		b = a % b
		a = temp
	return a if a > 0 else 1

# Kesri en sade haline getirir
static func simplify(num: int, den: int) -> Dictionary:
	if den == 0:
		return {"num": 0, "den": 1}
	var divisor = gcd(num, den)
	return {
		"num": int(num / divisor),
		"den": int(den / divisor)
	}

# İki kesrin matematiksel denkliği (a/b == c/d <==> a*d == c*b)
static func are_equal(num1: int, den1: int, num2: int, den2: int) -> bool:
	if den1 == 0 or den2 == 0:
		return false
	return (num1 * den2) == (num2 * den1)

# Basit kesir kontrolü (Pay < Payda ve Pay > 0)
static func is_proper(num: int, den: int) -> bool:
	return den > 0 and num > 0 and num < den

# Bileşik kesir kontrolü (Pay >= Payda ve Payda > 0)
static func is_improper(num: int, den: int) -> bool:
	return den > 0 and num >= den

# Bileşik kesri tam sayılı kesre çevirir: 7/3 -> 2 tam 1/3
static func to_mixed(num: int, den: int) -> Dictionary:
	if den == 0:
		return {"whole": 0, "num": 0, "den": 1}
	var whole = int(num / den)
	var remainder = num % den
	return {
		"whole": whole,
		"num": remainder,
		"den": den
	}

# Tam sayılı kesri bileşik kesre çevirir: 2 tam 1/3 -> 7/3
static func from_mixed(whole: int, num: int, den: int) -> Dictionary:
	if den == 0:
		return {"num": 0, "den": 1}
	return {
		"num": (whole * den) + num,
		"den": den
	}

# Doğruluk oranı hesaplar (0.0 - 1.0)
static func calculate_accuracy(target_num: int, target_den: int, current_num: int, current_den: int) -> float:
	if target_den == 0 or current_den == 0:
		return 0.0
	var target_val = float(target_num) / float(target_den)
	var current_val = float(current_num) / float(current_den)
	if target_val <= 0.0:
		return 1.0 if current_val == 0.0 else 0.0
	var diff = abs(target_val - current_val)
	var acc = max(0.0, 1.0 - (diff / target_val))
	return snapped(acc, 0.01)

# Yıldız değerlendirmesi: Deneme sayısı ve ipucu kullanımına göre 1-3 yıldız
static func calculate_stars(wrong_attempts: int, hints_used: int) -> int:
	if wrong_attempts == 0 and hints_used == 0:
		return 3
	elif wrong_attempts <= 2 and hints_used <= 1:
		return 2
	else:
		return 1

# Puan hesabı (100 bazlı)
static func calculate_score(wrong_attempts: int, hints_used: int, duration_sec: int) -> int:
	var base_score = 100
	var penalty_wrong = wrong_attempts * 15
	var penalty_hint = hints_used * 10
	var time_bonus = max(0, 20 - int(duration_sec / 5))
	var score = base_score - penalty_wrong - penalty_hint + time_bonus
	return clampi(score, 30, 100)

# Pedagojik geri bildirim üretici (Hatalı çözümde öğretici ve yönlendirici Türkçe rehberlik)
static func get_pedagogical_guidance(target_type: String, target_num: int, target_den: int, target_whole: int, current_num: int, current_den: int) -> String:
	if current_num == 0:
		return "Parçaları bütüne yerleştirmek için aşağıdaki parçalara dokun veya sürükle!"
		
	# Paydalar eşit mi?
	if current_den == target_den:
		# Hedef toplam pay değeri
		var expected_total_num = target_num
		if target_type == "mixed":
			expected_total_num = (target_whole * target_den) + target_num
			
		if current_num < expected_total_num:
			var missing = expected_total_num - current_num
			if target_type == "mixed":
				return "Şu an %d parça yerleştirdin. %d tam %d/%d için %d parça daha eklemelisin!" % [current_num, target_whole, target_num, target_den, missing]
			elif target_type == "improper":
				return "Şu an %d/%d oluşturdun. Bileşik kesir hedefine ulaşmak için %d parça daha eklemelisin!" % [current_num, target_den, missing]
			else:
				return "Şu an %d/%d oluşturdun. Hedefe (%d/%d) ulaşmak için %d parça daha koymalısın!" % [current_num, target_den, target_num, target_den, missing]
		elif current_num > expected_total_num:
			var extra = current_num - expected_total_num
			return "Biraz fazla parça koydun (%d/%d). Hedef %d/%d. Fazla olan %d parçayı üzerine dokunarak çıkarabilirsin." % [current_num, current_den, expected_total_num, target_den, extra]
	
	# Genel değer kıyaslaması
	var target_val = float(target_num) / float(target_den)
	if target_type == "mixed":
		target_val = float(target_whole) + (float(target_num) / float(target_den))
	var current_val = float(current_num) / float(current_den)
	
	if current_val < target_val:
		return "Mevcut model hedeften daha küçük bir değeri gösteriyor. Biraz daha parça eklemelisin."
	elif current_val > target_val:
		return "Mevcut model hedeften daha büyük bir değeri gösteriyor. Fazla parçaları çıkarmalısın."
	else:
		return "Tebrikler! Hedef kesri başarıyla modelleyip tamamladın!"

