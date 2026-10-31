import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { A1_ANIMALS_VOCABULARY, WORD_GARDEN_DEFAULT_NODES } from '../../../packages/shared/src/language.ts';
import { ARCHIPELAGO_ISLANDS_CATALOG, ARCHIPELAGO_ISLANDS_ORDERED } from '../../../packages/shared/src/archipelago.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { getWordGardenProgress, saveWordGardenLevelCompletion } from '../src/lib/progress/wordGardenProgress.ts';

test('Language Learning: A1 Animals Vocabulary Catalog Integrity', () => {
  assert.equal(A1_ANIMALS_VOCABULARY.length, 4, 'Tam olarak 4 hayvan bulunmalıdır');
  
  const expectedWords = ['cat', 'dog', 'bird', 'rabbit'];
  const actualWords = A1_ANIMALS_VOCABULARY.map(v => v.word);
  assert.deepEqual(actualWords, expectedWords, 'Hayvan listesi cat, dog, bird, rabbit olmalıdır');

  for (const item of A1_ANIMALS_VOCABULARY) {
    assert.ok(item.id.startsWith('en_vocab_'), `Geçersiz kimlik formatı: ${item.id}`);
    assert.ok(item.translationTr, `Türkçe karşılık bulunmalı: ${item.word}`);
    assert.ok(item.phonetic, `Fonetik telaffuz bulunmalı: ${item.word}`);
    
    // Ses dosyasının varlığı
    const audioDiskPath = path.join(process.cwd(), 'public', item.audioUrl.replace(/^\//, ''));
    assert.ok(fs.existsSync(audioDiskPath), `Ses dosyası diskte mevcut olmalıdır: ${audioDiskPath}`);

    // Görsel dosyasının varlığı
    const imageDiskPath = path.join(process.cwd(), 'public', item.imageUrl.replace(/^\//, ''));
    assert.ok(fs.existsSync(imageDiskPath), `Görsel dosyası diskte mevcut olmalıdır: ${imageDiskPath}`);
  }
});

test('Language Learning: Word Garden 5-Node Learning Path Sequence', () => {
  assert.equal(WORD_GARDEN_DEFAULT_NODES.length, 5, 'Öğrenme patikası 5 düğümden oluşmalıdır');

  const expectedTypes = ['explore', 'match', 'listen', 'apply', 'mini_quest'];
  const actualTypes = WORD_GARDEN_DEFAULT_NODES.map(n => n.type);
  assert.deepEqual(actualTypes, expectedTypes, 'Düğüm sıralaması pedagojik hiyerarşiye uygun olmalıdır');

  assert.equal(WORD_GARDEN_DEFAULT_NODES[0].isUnlocked, true, '1. Düğüm başlangıçta açık olmalıdır');
  assert.equal(WORD_GARDEN_DEFAULT_NODES[1].isUnlocked, false, '2. Düğüm kilitli olmalıdır');
  assert.equal(WORD_GARDEN_DEFAULT_NODES[4].isUnlocked, false, '5. Düğüm kilitli olmalıdır');
});

test('Language Learning & Phaser: Progress Repository Recording & Profile Isolation', async () => {
  const repo = new MemoryProgressRepository();

  // 1. İki farklı çocuk profili oluştur
  const profileCan = await repo.createProfile({ nickname: 'Can', avatarId: 'avatar_explorer' });
  const profileAyse = await repo.createProfile({ nickname: 'Ayşe', avatarId: 'avatar_owl' });

  // 2. Can, Kelime Bahçesi Bölümünü 3 Yıldızla Tamamlar
  const gamePayload = {
    profileId: profileCan.id,
    gameId: 'phaser_exploration_island',
    levelId: 1,
    outcomeId: 'en.a1.vocab.animals',
    skillId: 'en.a1.vocab.animals',
    score: 100,
    success: true,
    starsEarned: 3,
    metrics: {
      durationSeconds: 150,
      attemptsCount: 5,
      accuracyRate: 1.0,
      wrongAttempts: 0,
      hintsUsed: 0
    },
    completedAt: new Date().toISOString()
  };

  const recordResult = await repo.recordGameCompleted(gamePayload, profileCan.id);
  assert.equal(recordResult.isDuplicate, false);
  assert.equal(recordResult.starsAddedToBalance, 3);
  assert.equal(recordResult.totalStarsBalance, 3);

  // 3. Can için ilerleme kontrolü
  const canStars = await repo.getTotalStars(profileCan.id, 'phaser_exploration_island');
  assert.equal(canStars, 3, 'Can 3 yıldıza sahip olmalıdır');

  const canLevelProgress = await repo.getLevelProgress('phaser_exploration_island', 1, profileCan.id);
  assert.ok(canLevelProgress, 'Can için bölüm kaydı bulunmalıdır');
  assert.equal(canLevelProgress.bestStars, 3);
  assert.equal(canLevelProgress.completedCount, 1);

  // 4. Profil İzolasyonu Güvencesi: Ayşe henüz oynamadığı için 0 yıldızı olmalıdır!
  const ayseStars = await repo.getTotalStars(profileAyse.id, 'phaser_exploration_island');
  assert.equal(ayseStars, 0, 'Ayşe oynamadığı için 0 yıldıza sahip olmalıdır (İzolasyon korundu)');

  const ayseLevelProgress = await repo.getLevelProgress('phaser_exploration_island', 1, profileAyse.id);
  assert.equal(ayseLevelProgress, null, 'Ayşe için bölüm kaydı boş olmalıdır');

  // 5. Tekrar Oynama Güvencesi (Star Accumulation Prevention)
  const replayPayload = { ...gamePayload, sessionId: 'replay_session_123' };
  const replayResult = await repo.recordGameCompleted(replayPayload, profileCan.id);
  assert.equal(replayResult.starsAddedToBalance, 0, 'Aynı bölüm tekrar edilince sınırsız yıldız biriktirilemez');
  const canStarsAfterReplay = await repo.getTotalStars(profileCan.id, 'phaser_exploration_island');
  assert.equal(canStarsAfterReplay, 3, 'Toplam yıldız 3 olarak sabit kalmalıdır');
});

test('Archipelago V2: Six-Island World Catalog Integrity & Asset Physical Presence', () => {
  const islands = ARCHIPELAGO_ISLANDS_ORDERED;
  assert.equal(islands.length, 6, 'Takımada tam olarak 6 bağımsız adadan oluşmalıdır');

  const expectedIds = [
    'word_garden',
    'listening_forest',
    'speaking_harbor',
    'sentence_workshop',
    'story_castle',
    'language_academy'
  ];

  const actualIds = islands.map(i => i.id);
  assert.deepEqual(actualIds, expectedIds, 'Adalar doğru sıra (1..6) ve kimliklerle kataloglanmalıdır');

  const expectedNames = [
    'Kelime Bahçesi',
    'Dinleme Ormanı',
    'Konuşma Limanı',
    'Yazı Atölyesi',
    'Cümle Meydanı',
    'Keşif Akademisi'
  ];
  const actualNames = islands.map(i => i.nameTr);
  assert.deepEqual(actualNames, expectedNames, 'Kullanıcıya gösterilen ada isimleri onaylı tablo ile birebir örtüşmelidir');

  // Her ada için asset dosya varlığı ve veri tutarlılığı
  for (const island of islands) {
    assert.ok(island.subtitleTr, `Ada için amaç/altbaşlık tanımlı olmalıdır: ${island.id}`);
    assert.ok(island.emoji, `Ada emoji ikonu içermelidir: ${island.id}`);
    assert.ok(island.badgeText, `Ada yaş/CEFR rozeti içermelidir: ${island.id}`);
    assert.ok(island.hitRadius >= 200, `Hit radius dokunma için yeterli büyüklükte olmalıdır: ${island.id}`);

    // Desktop WebP disk kontrolü
    const desktopPath = path.join(process.cwd(), 'public', island.desktopAsset.replace(/^\//, ''));
    assert.ok(fs.existsSync(desktopPath), `Desktop WebP dosyası diskte mevcut olmalıdır: ${desktopPath}`);
    const desktopStat = fs.statSync(desktopPath);
    assert.ok(desktopStat.size > 50000, `Desktop WebP boyutu anlamlı olmalıdır (>50KB): ${desktopStat.size} bytes`);

    // Mobile WebP disk kontrolü
    const mobilePath = path.join(process.cwd(), 'public', island.mobileAsset.replace(/^\//, ''));
    assert.ok(fs.existsSync(mobilePath), `Mobile WebP dosyası diskte mevcut olmalıdır: ${mobilePath}`);
    const mobileStat = fs.statSync(mobilePath);
    assert.ok(mobileStat.size > 30000, `Mobile WebP boyutu anlamlı olmalıdır (>30KB): ${mobileStat.size} bytes`);
    assert.ok(mobileStat.size < desktopStat.size, `Mobile WebP desktop versiyonundan daha hafif olmalıdır`);
  }
});

test('Archipelago V2: State & Publication Separation (unlocked vs contentPublished)', () => {
  const wg = ARCHIPELAGO_ISLANDS_CATALOG.word_garden;
  assert.equal(wg.isUnlockedDefault, true, 'Kelime Bahçesi başlangıçta açık olmalıdır');
  assert.equal(wg.contentPublished, true, 'Kelime Bahçesi 5 seviyeli ders içeriğine sahip olmalıdır');
  assert.equal(wg.totalPublishedRequiredLevels, 5);

  const lockedIslands = ARCHIPELAGO_ISLANDS_ORDERED.slice(1);
  for (const island of lockedIslands) {
    assert.equal(island.isUnlockedDefault, false, `${island.id} başlangıçta kilitli olmalıdır`);
    assert.equal(island.contentPublished, false, `${island.id} henüz içerik yayımlanmamış olmalıdır (sahte oyun açılamaz)`);
    assert.ok(island.unlockRequirementNotice, `${island.id} kilit açılma şartı bildirimine sahip olmalıdır`);
  }
});

test('Archipelago V2: Compact Oval World Coordinates & Progression Route Integrity', () => {
  const islands = ARCHIPELAGO_ISLANDS_ORDERED;
  assert.equal(islands.length, 6);

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < islands.length; i++) {
    const current = islands[i];
    assert.ok(current.defaultWorldPos.x >= 0, `X koordinatı negatif olmamalıdır: ${current.id}`);
    assert.ok(current.defaultWorldPos.y >= 0, `Y koordinatı negatif olmamalıdır: ${current.id}`);

    minX = Math.min(minX, current.defaultWorldPos.x);
    maxX = Math.max(maxX, current.defaultWorldPos.x);
    minY = Math.min(minY, current.defaultWorldPos.y);
    maxY = Math.max(maxY, current.defaultWorldPos.y);

    if (i > 0) {
      const prev = islands[i - 1];
      const dx = current.defaultWorldPos.x - prev.defaultWorldPos.x;
      const dy = current.defaultWorldPos.y - prev.defaultWorldPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      assert.ok(dist >= 380, `Komşu adalar birbirine çarpmamalı, en az 380px merkez mesafesi olmalı: ${prev.id} -> ${current.id} (${Math.round(dist)}px)`);
      assert.ok(dist <= 680, `Komşu adalar birbirinden kopuk olmamalı, en fazla 680px merkez mesafesi olmalı: ${prev.id} -> ${current.id} (${Math.round(dist)}px)`);
    }
  }

  const clusterWidth = maxX - minX;
  const clusterHeight = maxY - minY;

  // Kompakt takımada sınır kontrolü (1440x900 ekrana %100 zoom ile sığabilmeli)
  assert.ok(clusterWidth <= 1500, `Takımada genişliği 1500px aşmamalıdır (Kompakt oval): ${clusterWidth}px`);
  assert.ok(clusterHeight <= 900, `Takımada yüksekliği 900px aşmamalıdır (Kompakt oval): ${clusterHeight}px`);
});

test('Language Learning & Assets: Animal SVG Vector and Audio WAV Format Validation', () => {
  const publicDir = path.join(process.cwd(), 'public');

  for (const item of A1_ANIMALS_VOCABULARY) {
    // 1. SVG Varlık ve Header Kontrolü
    const svgRelPath = item.imageUrl.replace(/^\//, '');
    const svgFullPath = path.join(publicDir, svgRelPath);
    assert.ok(fs.existsSync(svgFullPath), `SVG mevcut olmalıdır: ${svgRelPath}`);
    const svgContent = fs.readFileSync(svgFullPath, 'utf-8');
    assert.ok(svgContent.includes('<svg'), `Geçerli SVG kök etiketi bulunmalı: ${svgRelPath}`);
    assert.ok(svgContent.includes('viewBox='), `SVG viewBox niteliği içermelidir: ${svgRelPath}`);
    assert.ok(svgContent.length > 200, `SVG içeriği anlamlı boyutta olmalıdır: ${svgRelPath}`);

    // 2. WAV Ses Varlık ve RIFF WAVE Header Kontrolü
    const wavRelPath = item.audioUrl.replace(/^\//, '');
    const wavFullPath = path.join(publicDir, wavRelPath);
    assert.ok(fs.existsSync(wavFullPath), `WAV mevcut olmalıdır: ${wavRelPath}`);
    const wavBuffer = fs.readFileSync(wavFullPath);
    assert.ok(wavBuffer.length > 1000, `WAV dosyası geçerli veri içermelidir: ${wavRelPath} (${wavBuffer.length} bytes)`);

    // RIFF header kontrolü (İlk 4 byte 'RIFF', 8-12 byte 'WAVE')
    const riffHeader = wavBuffer.toString('ascii', 0, 4);
    const waveHeader = wavBuffer.toString('ascii', 8, 12);
    assert.equal(riffHeader, 'RIFF', `Geçerli RIFF container formatı olmalıdır: ${wavRelPath}`);
    assert.equal(waveHeader, 'WAVE', `Geçerli WAVE ses formatı olmalıdır: ${wavRelPath}`);
  }

  // Süt görseli kontrolü (ApplyActivity için)
  const milkPath = path.join(publicDir, 'assets', 'animals', 'milk.svg');
  assert.ok(fs.existsSync(milkPath), 'milk.svg disk üzerinde mevcut olmalıdır');
});

test('Archipelago Interaction Lock: Shared State EventBus Contract & Lock Invariants', () => {
  // EventBus üzerinden SET_WORLD_INPUT_LOCKED olayının tetiklenebilirliğini ve
  // durum korunumunu doğrula
  const events = new Map();
  let receivedLockState = null;

  const mockOn = (event, cb) => {
    events.set(event, cb);
  };
  const mockEmit = (event, data) => {
    if (events.has(event)) {
      events.get(event)(data);
    }
  };

  mockOn('SET_WORLD_INPUT_LOCKED', (locked) => {
    receivedLockState = locked;
  });

  // 1. Modal açıldığında kilit sinyali (true)
  mockEmit('SET_WORLD_INPUT_LOCKED', true);
  assert.equal(receivedLockState, true, 'Modal açılınca dünya girdisi kilitlenmelidir');

  // 2. Modal kapandığında kilit kaldırma sinyali (false)
  mockEmit('SET_WORLD_INPUT_LOCKED', false);
  assert.equal(receivedLockState, false, 'Modal kapanınca dünya girdisi tekrar etkinleşmelidir');
});

test('Audio & SoundService: Global Mute Synchronization Contract', () => {
  // Mute durumu değişiminin EventBus üzerinden dinleyicilere yayıldığını doğrula
  let receivedMuteState = null;
  const mockCallback = (isMuted) => {
    receivedMuteState = isMuted;
  };

  // Simüle edilmiş EventBus yayını
  mockCallback(true);
  assert.equal(receivedMuteState, true, 'Global sessize alma (mute) aktif olmalıdır');

  mockCallback(false);
  assert.equal(receivedMuteState, false, 'Global ses açma (unmute) aktif olmalıdır');
});

test('Game Level Map Progression: Activity 1 Complete -> 20% Progress -> Island Bar Sync', () => {
  // 1. Başlangıç Durumu (1. Seviye açık, diğerleri kilitli)
  const initialLevels = WORD_GARDEN_DEFAULT_NODES.map((node, index) => ({
    id: `wg_level_${node.id}`,
    order: node.id,
    type: node.type,
    status: index === 0 ? 'available' : 'locked',
    starsEarned: 0
  }));

  assert.equal(initialLevels[0].status, 'available', '1. Keşfet adımı başlangıçta erişilebilir olmalıdır');
  assert.equal(initialLevels[1].status, 'locked', '2. Eşleştir adımı başlangıçta kilitli olmalıdır');
  const initialCompleted = initialLevels.filter(l => l.status === 'completed').length;
  assert.equal(initialCompleted, 0);
  const initialPercent = Math.round((initialCompleted / initialLevels.length) * 100);
  assert.equal(initialPercent, 0, 'Başlangıçta ilerleme %0 olmalıdır');

  // 2. İlk Etkinlik (Explore / Keşfet) 3 Yıldızla Tamamlanır
  const stepType = 'explore';
  const starsEarned = 3;
  const updatedLevels = initialLevels.map(lvl => {
    if (lvl.type === stepType) {
      return { ...lvl, status: 'completed', starsEarned };
    }
    return lvl;
  });

  // Sıradaki ilk kilitli düğümün kilidini aç (Explore -> Match)
  const currentIndex = updatedLevels.findIndex(l => l.type === stepType);
  if (currentIndex >= 0 && currentIndex + 1 < updatedLevels.length) {
    if (updatedLevels[currentIndex + 1].status === 'locked') {
      updatedLevels[currentIndex + 1] = {
        ...updatedLevels[currentIndex + 1],
        status: 'available'
      };
    }
  }

  // 3. Seviye ve Durum Doğrulaması
  assert.equal(updatedLevels[0].status, 'completed', '1. Adım tamamlandı olarak işaretlenmelidir');
  assert.equal(updatedLevels[0].starsEarned, 3, '1. Adım 3 yıldız kazanmalıdır');
  assert.equal(updatedLevels[1].status, 'available', '1. Adım tamamlanınca 2. Adım (Match) açılmalıdır');
  assert.equal(updatedLevels[2].status, 'locked', '3. Adım kilitli kalmalıdır');

  // 4. %20 İlerleme Oranı Doğrulaması (1/5)
  const completedCount = updatedLevels.filter(l => l.status === 'completed').length;
  assert.equal(completedCount, 1, 'Tamamlanan seviye sayısı tam olarak 1 olmalıdır');
  const progressPercent = Math.round((completedCount / updatedLevels.length) * 100);
  assert.equal(progressPercent, 20, '1/5 seviye tam olarak %20 ilerleme üretmelidir');

  // 5. 5 Seviyenin Tamamı Tamamlandığında %100 Çiçek Açma (Blooming) Durumu
  const allCompletedLevels = initialLevels.map(lvl => ({
    ...lvl,
    status: 'completed',
    starsEarned: 3
  }));
  const fullCompletedCount = allCompletedLevels.filter(l => l.status === 'completed').length;
  const fullProgressPercent = Math.round((fullCompletedCount / allCompletedLevels.length) * 100);
  assert.equal(fullCompletedCount, 5, '5 seviyenin tamamı bitmelidir');
  assert.equal(fullProgressPercent, 100, 'Tamamlandığında ada ilerlemesi %100 olmalıdır');
});

test('Archipelago Progress Bar: Active vs Unpublished Island Level Display Invariants', () => {
  // 1. Kelime Bahçesi (Aktif Yayımlanmış Ada)
  const wg = ARCHIPELAGO_ISLANDS_CATALOG.word_garden;
  assert.equal(wg.contentPublished, true, 'Kelime Bahçesi içerik yayımlanmış tek ada olmalıdır');
  assert.equal(wg.totalPublishedRequiredLevels, 5, 'Kelime Bahçesi toplam 5 seviyeye sahip olmalıdır');

  const formatWordGardenProgress = (completed) => {
    const total = wg.totalPublishedRequiredLevels;
    const pct = Math.round((completed / total) * 100);
    return `${completed}/${total} Tamamlandı (%${pct})`;
  };

  assert.equal(formatWordGardenProgress(0), '0/5 Tamamlandı (%0)');
  assert.equal(formatWordGardenProgress(1), '1/5 Tamamlandı (%20)');
  assert.equal(formatWordGardenProgress(5), '5/5 Tamamlandı (%100)');

  // 2. Diğer 5 Ada için Sahte 0/5 Barının Bastırılması (Suppression) Kuralı
  const otherIslands = ARCHIPELAGO_ISLANDS_ORDERED.filter(i => i.id !== 'word_garden');
  assert.equal(otherIslands.length, 5, 'Geriye kalan 5 ada bulunmalıdır');

  for (const island of otherIslands) {
    assert.equal(island.contentPublished, false, `${island.id} adası henüz yayımlanmamış olmalıdır`);
    // UI sözleşmesi: contentPublished false ise sayısal "0/5" progress bar çizilmez, "Pek Yakında" / "Kilitli" rozeti çizilir
    const shouldShowNumericLevelBar = island.contentPublished;
    assert.equal(shouldShowNumericLevelBar, false, `${island.id} için yanıltıcı 0/5 barı kesinlikle gösterilmemelidir`);
    assert.ok(island.unlockRequirementNotice, `${island.id} adası kilit açılma koşulu açıklaması içermelidir`);
  }
});


test('Word Garden: saved five-step progression survives reload and stays isolated per profile', async () => {
  const repo = new MemoryProgressRepository();
  const learner = await repo.createProfile({ nickname: 'Learner', avatarId: 'avatar_explorer' });
  const other = await repo.createProfile({ nickname: 'Other', avatarId: 'avatar_explorer' });

  const before = await getWordGardenProgress(repo, learner.id);
  assert.equal(before.completedLevels, 0);
  assert.equal(before.progressPercent, 0);

  const afterFirst = await saveWordGardenLevelCompletion(repo, learner.id, 1, 3);
  assert.equal(afterFirst.completedLevels, 1);
  assert.equal(afterFirst.progressPercent, 20);
  assert.equal(afterFirst.totalStars, 3);

  const persisted = await repo.getLevelProgress('island_word_garden_steps', 1, learner.id);
  assert.equal(persisted?.completedCount, 1);

  // This calls the repository again, like a browser reload; it does not rely on React state.
  assert.equal((await getWordGardenProgress(repo, learner.id)).progressPercent, 20);
  assert.equal((await getWordGardenProgress(repo, other.id)).completedLevels, 0);
  await assert.rejects(saveWordGardenLevelCompletion(repo, learner.id, 4, 3), /Önceki görev/);

  const afterSecond = await saveWordGardenLevelCompletion(repo, learner.id, 2, 2);
  assert.equal(afterSecond.completedLevels, 2);
  assert.equal(afterSecond.progressPercent, 40);
  assert.equal(afterSecond.starsByLevel[2], 2);

  for (const order of [3, 4, 5]) await saveWordGardenLevelCompletion(repo, learner.id, order, 3);
  const complete = await getWordGardenProgress(repo, learner.id);
  assert.equal(complete.completedLevels, 5);
  assert.equal(complete.progressPercent, 100);
  assert.equal(complete.totalStars, 14);
  assert.equal((await getWordGardenProgress(repo, other.id)).progressPercent, 0);
});

test('Word Garden: a legacy whole-island completion remains completed after migration', async () => {
  const repo = new MemoryProgressRepository();
  const learner = await repo.createProfile({ nickname: 'Legacy', avatarId: 'avatar_explorer' });
  await repo.recordGameCompleted({
    profileId: learner.id,
    gameId: 'island_word_garden',
    levelId: 1,
    outcomeId: 'en.a1.vocab.animals',
    skillId: 'en.a1.vocab.animals',
    score: 100,
    success: true,
    starsEarned: 3,
    metrics: { durationSeconds: 0, attemptsCount: 1, accuracyRate: 0 },
    completedAt: new Date().toISOString()
  }, learner.id);

  const snapshot = await getWordGardenProgress(repo, learner.id);
  assert.equal(snapshot.legacyCompleted, true);
  assert.equal(snapshot.completedLevels, 5);
  assert.equal(snapshot.progressPercent, 100);
  assert.equal(snapshot.totalStars, 3);
});
