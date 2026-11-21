/**
 * Child/parent-facing activity log titles, keyed by the permanent game IDs.
 *
 * Titles are "<label> — Bölüm N". Daily quests count today's plays by matching
 * the label prefix against the rewards WORLD_GAMES labels, so a game missing
 * here was logged as the legacy math title "Kesir Atölyesi" and its plays never
 * counted (Cümle Meydanı, Diyalog Limanı, Yazı Atölyesi, Tema Kasabası, Harf
 * Korusu). Keep labels identical to WORLD_GAMES where a game appears there.
 */
const GAME_ACTIVITY_LABELS:Readonly<Record<string,string>>=Object.freeze({
 island_word_garden:'Hayvan Çayırı',
 island_word_garden_steps:'Hayvan Çayırı',
 phaser_exploration_island:'Hayvan Çayırı',
 island_word_garden_colors:'Renk Korusu',
 island_word_garden_numbers:'Sayı Vadisi',
 island_word_garden_food:'Lezzet Pazarı',
 island_word_garden_family:'Aile Köyü',
 island_word_garden_temple:'Keşif Tapınağı',
 island_word_garden_alphabet:'Harf Korusu',
 island_word_garden_theme_town:'Tema Kasabası',
 island_sentence_square_plaza:'Uyanan Meydan',
 island_story_forest_discover:'Hikâyeyi Keşfet',
 island_story_forest_sequence:'Sonra Ne Oldu?',
 island_story_forest_detective:'Hikâye Dedektifi',
 island_speaking_harbor_dialogue:'Diyalog Limanı',
 island_sentence_workshop_writing:'Yazı Atölyesi',
 island_language_academy_atlas:'Keşif Akademisi',
 island_language_academy_review:'Keşif Akademisi Tekrarı',
 // Historical records from the earlier fractions prototype keep their titles.
 kesir_atolyesi:'Kesir Atölyesi',
 kesir_koprusu:'Kesir Köprüsü'
});

export function gameActivityLabel(gameId:string|undefined|null):string{
 if(!gameId)return 'Kesir Atölyesi';
 return GAME_ACTIVITY_LABELS[gameId]??'Ventra İngilizce';
}
