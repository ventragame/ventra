import type {LevelProgressRecord} from '@ventra/shared';

/**
 * Number of level slots each game reports even before anything is saved.
 *
 * Callers count "completed" levels by iterating 1..N, so every game keeps the
 * zero-filled range it always had. This table only controls padding: records
 * stored ABOVE the declared count are still returned (see buildLevelProgressMap),
 * so a game with more level IDs than declared can never read back as zero again.
 *
 * Before this module existed both repositories hard-coded the table and any
 * unlisted game was silently capped at 10 levels: Theme Town (72 level IDs) and
 * Alphabet Grove (36 level IDs) saved progress that always read back as empty.
 */
const DECLARED_LEVEL_COUNTS:Readonly<Record<string,number>>=Object.freeze({
 island_language_academy_atlas:6,
 island_word_garden_numbers:15,
 island_word_garden_food:15,
 island_word_garden_family:20,
 island_word_garden_temple:25,
 // 12 lessons × 3 English placements (alphabetLessonLevelId)
 island_word_garden_alphabet:36,
 // 8 themes × 3 placement bands × 3 curriculum tiers (themeLevelId)
 island_word_garden_theme_town:72
});
const DEFAULT_LEVEL_COUNT=10;

export function declaredLevelCount(gameId:string):number{
 return DECLARED_LEVEL_COUNTS[gameId]??DEFAULT_LEVEL_COUNT;
}

/** Primary key used by both repositories for a level record. */
export function levelRecordKey(profileId:string,gameId:string,levelId:number):string{
 return `${profileId}:${gameId}:${levelId}`;
}
/** Prefix shared by every level key of one profile + game (the trailing ':' keeps
 * `island_word_garden` from matching `island_word_garden_colors`). */
export function levelRecordPrefix(profileId:string,gameId:string):string{
 return `${profileId}:${gameId}:`;
}

export function emptyLevelProgress(gameId:string,levelId:number):LevelProgressRecord{
 return {
  gameId,levelId,bestStars:0,bestScore:0,bestAccuracy:0,
  attemptsCount:0,completedCount:0,firstCompletedAt:'',lastCompletedAt:''
 };
}

/**
 * Builds the level map from the stored records of ONE profile + game, given as
 * [primaryKey, record] pairs. Keys outside the prefix or with a non-integer
 * level suffix are ignored, so a malformed row can never shadow a real level.
 */
export function buildLevelProgressMap(
 gameId:string,prefix:string,
 stored:Iterable<readonly [string,LevelProgressRecord]>
):Record<number,LevelProgressRecord>{
 const result:Record<number,LevelProgressRecord>={};
 const count=declaredLevelCount(gameId);
 for(let levelId=1;levelId<=count;levelId++)result[levelId]=emptyLevelProgress(gameId,levelId);
 for(const [key,record] of stored){
  if(!key.startsWith(prefix)||!record)continue;
  const suffix=key.slice(prefix.length);
  if(!/^[1-9]\d{0,5}$/.test(suffix))continue;
  result[Number(suffix)]=record;
 }
 return result;
}
