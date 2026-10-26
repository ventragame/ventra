extends SceneTree

const FractionMath = preload("res://scripts/FractionMath.gd")
const FractionLevelCatalog = preload("res://scripts/FractionLevelCatalog.gd")

func _init() -> void:
	print("--- FRACTION WORKSHOP UNIT TESTS (Godot Headless) ---")
	var success = true
	
	# 1. Test FractionMath.gcd
	assert(FractionMath.gcd(12, 8) == 4, "GCD 12, 8 should be 4")
	assert(FractionMath.gcd(7, 3) == 1, "GCD 7, 3 should be 1")
	assert(FractionMath.gcd(6, 6) == 6, "GCD 6, 6 should be 6")
	print("✓ FractionMath.gcd PASSED")
	
	# 2. Test simplify
	var simp = FractionMath.simplify(6, 8)
	assert(simp.num == 3 and simp.den == 4, "6/8 should simplify to 3/4")
	print("✓ FractionMath.simplify PASSED")
	
	# 3. Test are_equal
	assert(FractionMath.are_equal(1, 2, 2, 4), "1/2 == 2/4")
	assert(FractionMath.are_equal(3, 4, 6, 8), "3/4 == 6/8")
	assert(not FractionMath.are_equal(3, 4, 4, 5), "3/4 != 4/5")
	print("✓ FractionMath.are_equal PASSED")
	
	# 4. Test proper / improper / mixed
	assert(FractionMath.is_proper(3, 4), "3/4 is proper")
	assert(not FractionMath.is_proper(4, 4), "4/4 is not proper")
	assert(not FractionMath.is_proper(5, 4), "5/4 is not proper")
	assert(FractionMath.is_improper(4, 4), "4/4 is improper")
	assert(FractionMath.is_improper(5, 4), "5/4 is improper")
	
	var mixed = FractionMath.to_mixed(7, 3)
	assert(mixed.whole == 2 and mixed.num == 1 and mixed.den == 3, "7/3 = 2 1/3")
	var from_m = FractionMath.from_mixed(2, 1, 3)
	assert(from_m.num == 7 and from_m.den == 3, "2 1/3 = 7/3")
	print("✓ Proper/Improper/Mixed conversions PASSED")
	
	# 5. Test all 10 levels exist and are mathematically sound
	assert(FractionLevelCatalog.get_total_levels() == 10, "Total levels should be 10")
	var levels = FractionLevelCatalog.get_all_levels()
	assert(levels.size() == 10, "Should have 10 level configs")
	
	for lvl in levels:
		var lid = lvl.id
		var ftype = lvl.fraction_type
		var num = lvl.target_num
		var den = lvl.target_den
		var whole = lvl.target_whole
		var wholes_cnt = lvl.wholes_count
		var ppw = lvl.pieces_per_whole
		
		# Her bölümün toplam gereken parça sayısı
		var total_target_pieces = num
		if ftype == "mixed":
			total_target_pieces = (whole * den) + num
		
		# Parça kapasitesi yeterli mi?
		var capacity = wholes_cnt * ppw
		assert(capacity >= total_target_pieces, "Level %d: Capacity %d must be >= target pieces %d" % [lid, capacity, total_target_pieces])
		
		# Denominator tutarlı mı?
		assert(den == ppw, "Level %d: Target denominator %d must match pieces_per_whole %d" % [lid, den, ppw])
		print("  Level %d: '%s' (%s target: %s) -> OK (Needs %d pieces, capacity %d)" % [
			lid, lvl.title, ftype, 
			("%d tam %d/%d" % [whole, num, den]) if ftype == "mixed" else ("%d/%d" % [num, den]),
			total_target_pieces, capacity
		])
		
	print("✓ All 10 Levels validation PASSED")
	
	# 6. Test pedagogical guidance
	var feedback_under = FractionMath.get_pedagogical_guidance("proper", 3, 4, 0, 2, 4)
	assert(feedback_under.contains("1 parça daha"), "Guidance should suggest adding 1 piece")
	var feedback_over = FractionMath.get_pedagogical_guidance("proper", 3, 4, 0, 4, 4)
	assert(feedback_over.contains("Fazla"), "Guidance should report excess pieces")
	print("✓ Pedagogical feedback generation PASSED")
	
	print("\nALL PRELIMINARY MATH TESTS COMPLETED SUCCESSFULLY!")
	quit(0)
