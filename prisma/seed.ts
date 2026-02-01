/**
 * InitialJ Database Seed Script
 *
 * Seeds:
 * 1. Admin user (youssef@maisongenkai.com)
 * 2. JLPT Kanji + Vocabulary data from jlpt-levels.json
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Detect if using SQLite
const isSQLite = process.env.DATABASE_URL?.startsWith('file:');

// Helper for JSON fields - SQLite needs stringified JSON
function jsonField(value: unknown): string | unknown {
  return isSQLite ? JSON.stringify(value) : value;
}

interface JLPTLevel {
  level: number;
  title: string;
  description: string;
  kanji: Array<{
    character: string;
    readingsKun?: string[];
    readingsOn?: string[];
    meanings?: string[];
    grade?: number;
    jlpt?: number;
    strokes?: number;
  }>;
  vocabulary: Array<{
    word: string;
    reading: string;
    meanings?: string[];
    primaryMeaning?: string;
    partOfSpeech?: string;
    kanjiUsed?: string[];
  }>;
}

async function seedAdmin() {
  console.log('Seeding admin user...\n');

  const adminEmail = 'youssef@maisongenkai.com';
  const adminPassword = '2.Muchsauce';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

          const admin = await prisma.user.create({
            data: {
              email: adminEmail,
              password: hashedPassword,
              username: 'Youssef',
              role: 'ADMIN',
              subscription: {
                create: {
                  plan: 'YEARLY',
                  status: 'ACTIVE',
                },
              },
            },
          });

  console.log(`Created admin user: ${adminEmail}\n`);
  return admin;
}

async function seedHiraganaKatakana() {
  console.log('Seeding Hiragana & Katakana lesson...\n');

  // Check if hiragana/katakana lesson already exists
  const existing = await prisma.kanjiLesson.findFirst({
    where: { 
      OR: [
        { lessonType: 'HIRAGANA' },
        { lessonType: 'KATAKANA' }
      ]
    },
  });

  if (existing) {
    console.log('Hiragana & Katakana lesson already exists, skipping.\n');
    return;
  }

  // Check if level 0 is already taken - if so, shift all kanji lessons up by 1
  const level0Lesson = await prisma.kanjiLesson.findUnique({
    where: { level: 0 },
  });

  if (level0Lesson && level0Lesson.lessonType === 'KANJI') {
    console.log('Shifting existing kanji lessons to make room for hiragana/katakana...\n');
    // Get all kanji lessons ordered by level
    const kanjiLessons = await prisma.kanjiLesson.findMany({
      where: { lessonType: 'KANJI' },
      orderBy: { level: 'desc' },
    });

    // Shift each lesson up by 1 level
    for (const lesson of kanjiLessons) {
      await prisma.kanjiLesson.update({
        where: { id: lesson.id },
        data: { level: lesson.level + 1 },
      });
    }
    console.log(`Shifted ${kanjiLessons.length} kanji lessons up by 1 level.\n`);
  }

  // Hiragana characters with romaji
  const hiragana = [
    { char: 'あ', romaji: 'a' }, { char: 'い', romaji: 'i' }, { char: 'う', romaji: 'u' }, { char: 'え', romaji: 'e' }, { char: 'お', romaji: 'o' },
    { char: 'か', romaji: 'ka' }, { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' }, { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
    { char: 'さ', romaji: 'sa' }, { char: 'し', romaji: 'shi' }, { char: 'す', romaji: 'su' }, { char: 'せ', romaji: 'se' }, { char: 'そ', romaji: 'so' },
    { char: 'た', romaji: 'ta' }, { char: 'ち', romaji: 'chi' }, { char: 'つ', romaji: 'tsu' }, { char: 'て', romaji: 'te' }, { char: 'と', romaji: 'to' },
    { char: 'な', romaji: 'na' }, { char: 'に', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ね', romaji: 'ne' }, { char: 'の', romaji: 'no' },
    { char: 'は', romaji: 'ha' }, { char: 'ひ', romaji: 'hi' }, { char: 'ふ', romaji: 'fu' }, { char: 'へ', romaji: 'he' }, { char: 'ほ', romaji: 'ho' },
    { char: 'ま', romaji: 'ma' }, { char: 'み', romaji: 'mi' }, { char: 'む', romaji: 'mu' }, { char: 'め', romaji: 'me' }, { char: 'も', romaji: 'mo' },
    { char: 'や', romaji: 'ya' }, { char: 'ゆ', romaji: 'yu' }, { char: 'よ', romaji: 'yo' },
    { char: 'ら', romaji: 'ra' }, { char: 'り', romaji: 'ri' }, { char: 'る', romaji: 'ru' }, { char: 'れ', romaji: 're' }, { char: 'ろ', romaji: 'ro' },
    { char: 'わ', romaji: 'wa' }, { char: 'を', romaji: 'wo' }, { char: 'ん', romaji: 'n' },
    // Dakuten (voiced)
    { char: 'が', romaji: 'ga' }, { char: 'ぎ', romaji: 'gi' }, { char: 'ぐ', romaji: 'gu' }, { char: 'げ', romaji: 'ge' }, { char: 'ご', romaji: 'go' },
    { char: 'ざ', romaji: 'za' }, { char: 'じ', romaji: 'ji' }, { char: 'ず', romaji: 'zu' }, { char: 'ぜ', romaji: 'ze' }, { char: 'ぞ', romaji: 'zo' },
    { char: 'だ', romaji: 'da' }, { char: 'ぢ', romaji: 'ji' }, { char: 'づ', romaji: 'zu' }, { char: 'で', romaji: 'de' }, { char: 'ど', romaji: 'do' },
    { char: 'ば', romaji: 'ba' }, { char: 'び', romaji: 'bi' }, { char: 'ぶ', romaji: 'bu' }, { char: 'べ', romaji: 'be' }, { char: 'ぼ', romaji: 'bo' },
    // Handakuten (half-voiced)
    { char: 'ぱ', romaji: 'pa' }, { char: 'ぴ', romaji: 'pi' }, { char: 'ぷ', romaji: 'pu' }, { char: 'ぺ', romaji: 'pe' }, { char: 'ぽ', romaji: 'po' },
    // Yōon (contracted sounds)
    { char: 'きゃ', romaji: 'kya' }, { char: 'きゅ', romaji: 'kyu' }, { char: 'きょ', romaji: 'kyo' },
    { char: 'しゃ', romaji: 'sha' }, { char: 'しゅ', romaji: 'shu' }, { char: 'しょ', romaji: 'sho' },
    { char: 'ちゃ', romaji: 'cha' }, { char: 'ちゅ', romaji: 'chu' }, { char: 'ちょ', romaji: 'cho' },
    { char: 'にゃ', romaji: 'nya' }, { char: 'にゅ', romaji: 'nyu' }, { char: 'にょ', romaji: 'nyo' },
    { char: 'ひゃ', romaji: 'hya' }, { char: 'ひゅ', romaji: 'hyu' }, { char: 'ひょ', romaji: 'hyo' },
    { char: 'みゃ', romaji: 'mya' }, { char: 'みゅ', romaji: 'myu' }, { char: 'みょ', romaji: 'myo' },
    { char: 'りゃ', romaji: 'rya' }, { char: 'りゅ', romaji: 'ryu' }, { char: 'りょ', romaji: 'ryo' },
    { char: 'ぎゃ', romaji: 'gya' }, { char: 'ぎゅ', romaji: 'gyu' }, { char: 'ぎょ', romaji: 'gyo' },
    { char: 'じゃ', romaji: 'ja' }, { char: 'じゅ', romaji: 'ju' }, { char: 'じょ', romaji: 'jo' },
    { char: 'びゃ', romaji: 'bya' }, { char: 'びゅ', romaji: 'byu' }, { char: 'びょ', romaji: 'byo' },
    { char: 'ぴゃ', romaji: 'pya' }, { char: 'ぴゅ', romaji: 'pyu' }, { char: 'ぴょ', romaji: 'pyo' },
    // Small tsu
    { char: 'っ', romaji: 'tsu' },
  ];

  const lesson = await prisma.kanjiLesson.create({
    data: {
      level: 0,
      title: 'Hiragana',
      description: 'Learn the hiragana syllabary - the foundation of Japanese writing',
      lessonType: 'HIRAGANA',
      kanjiCount: 0,
      vocabCount: hiragana.length,
    },
  });

  for (let i = 0; i < hiragana.length; i++) {
    const h = hiragana[i];
    await prisma.vocabulary.create({
      data: {
        word: h.char,
        lessonId: lesson.id,
        reading: h.romaji,
        meanings: jsonField([h.romaji]) as string,
        primaryMeaning: h.romaji,
        sortOrder: i,
      },
    });
  }

  console.log(`Created Hiragana lesson with ${hiragana.length} characters\n`);
}


async function seedKanji() {
  const DATA_FILE = path.join(__dirname, 'data', 'jlpt-levels.json');

  // Check if data file exists
  if (!fs.existsSync(DATA_FILE)) {
    console.error('JLPT data file not found:', DATA_FILE);
    console.error('Please ensure prisma/data/jlpt-levels.json exists.');
    return;
  }

  // Check if already seeded (skip unless SEED_KANJI_FORCE=1)
  const force = process.env.SEED_KANJI_FORCE === '1' || process.env.SEED_KANJI_FORCE === 'true';
  const existingCount = await prisma.kanjiLesson.count({
    where: { lessonType: 'KANJI' },
  }).catch(() => 0);

  if (!force && existingCount > 0) {
    console.log(`Kanji already seeded (${existingCount} lessons), skipping.`);
    console.log('Set SEED_KANJI_FORCE=1 to clear and reseed.\n');
    return;
  }

  if (force) {
    console.log('Clearing existing kanji data (SEED_KANJI_FORCE=1)...');
    // First delete all related data
    await prisma.userVocabProgress.deleteMany().catch(() => {});
    await prisma.userKanjiProgress.deleteMany().catch(() => {});
    await prisma.userSettings.deleteMany().catch(() => {});
    await prisma.kanjiVocabulary.deleteMany().catch(() => {});
    await prisma.vocabulary.deleteMany({
      where: { lesson: { lessonType: 'KANJI' } },
    }).catch(() => {});
    await prisma.kanji.deleteMany().catch(() => {});
    // Clear all kanji lessons - delete by level range to be safe (levels 1-100)
    const deleted = await prisma.kanjiLesson.deleteMany({
      where: { level: { gte: 1, lte: 100 } },
    }).catch(() => ({ count: 0 }));
    console.log(`Cleared ${deleted.count || 0} kanji lessons.\n`);
  }

  console.log('Starting JLPT Kanji + Vocabulary seeding...\n');

  // Load processed JLPT data
  let levels: JLPTLevel[];
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    levels = JSON.parse(data);
  } catch (err) {
    console.error('Failed to read JLPT data file:', err);
    return;
  }

  console.log(`Loaded ${levels.length} levels from JLPT data\n`);

  // Track vocabulary to avoid duplicates across levels
  const vocabMap = new Map<string, { id: string; lessonId: string }>();

  for (const level of levels) {
    // Create the lesson (kanji lessons are 1-100, hiragana/katakana is 0)
    const lesson = await prisma.kanjiLesson.create({
      data: {
        level: level.level, // Kanji lessons are 1-100 (hiragana/katakana is at 0)
        title: level.title,
        description: level.description,
        lessonType: 'KANJI',
        kanjiCount: level.kanji.length,
        vocabCount: level.vocabulary.length,
      },
    });

    console.log(`Created ${level.title}: ${level.kanji.length} kanji, ${level.vocabulary.length} vocab`);

    // Create kanji
    for (let i = 0; i < level.kanji.length; i++) {
      const k = level.kanji[i];

      await prisma.kanji.create({
        data: {
          character: k.character,
          lessonId: lesson.id,
          kunYomi: jsonField(k.readingsKun || []) as string,
          onYomi: jsonField(k.readingsOn || []) as string,
          nanori: jsonField([]) as string,
          meanings: jsonField(k.meanings || []) as string,
          primaryMeaning: (k.meanings && k.meanings[0]) || 'unknown',
          grade: k.grade || null,
          jlpt: k.jlpt || null,
          strokeCount: k.strokes || null,
          sortOrder: i,
        },
      });
    }

    // Create vocabulary
    let vocabCreated = 0;
    for (let i = 0; i < level.vocabulary.length; i++) {
      const v = level.vocabulary[i];
      const vocabKey = `${v.word}-${v.reading}`;

      let vocabId: string;
      if (vocabMap.has(vocabKey)) {
        vocabId = vocabMap.get(vocabKey)!.id;
      } else {
        try {
          const vocab = await prisma.vocabulary.create({
            data: {
              word: v.word,
              lessonId: lesson.id,
              reading: v.reading,
              meanings: jsonField(v.meanings || []) as string,
              primaryMeaning: v.primaryMeaning || (v.meanings && v.meanings[0]) || 'unknown',
              partOfSpeech: v.partOfSpeech || null,
              sortOrder: i,
            },
          });
          vocabId = vocab.id;
          vocabMap.set(vocabKey, { id: vocab.id, lessonId: lesson.id });
          vocabCreated++;
        } catch {
          // Unique constraint: vocab already exists, find it
          const existing = await prisma.vocabulary.findFirst({
            where: { word: v.word, reading: v.reading },
          }).catch(() => null);
          if (existing) {
            vocabId = existing.id;
            vocabMap.set(vocabKey, { id: existing.id, lessonId: existing.lessonId });
          } else {
            console.warn(`  Skipped vocab: ${v.word} / ${v.reading}`);
            continue;
          }
        }
      }

      // Link vocabulary to kanji
      for (const kanjiChar of v.kanjiUsed || []) {
        const kanji = await prisma.kanji.findFirst({
          where: { character: kanjiChar },
        });
        if (kanji) {
          await prisma.kanjiVocabulary.create({
            data: { kanjiId: kanji.id, vocabularyId: vocabId },
          }).catch(() => {}); // Ignore duplicate link
        }
      }
    }

    // Update actual vocab count if different
    if (vocabCreated !== level.vocabulary.length) {
      await prisma.kanjiLesson.update({
        where: { id: lesson.id },
        data: { vocabCount: vocabCreated },
      });
    }
  }

  // Summary
  const totalKanji = await prisma.kanji.count();
  const totalVocab = await prisma.vocabulary.count();
  const totalLessons = await prisma.kanjiLesson.count();

  console.log('\n========================================');
  console.log('JLPT Kanji + Vocabulary seeding complete');
  console.log('========================================');
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Kanji: ${totalKanji}`);
  console.log(`Vocabulary: ${totalVocab}`);
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('InitialJ Database Seeding');
  console.log('========================================\n');

  await seedAdmin();
  await seedHiraganaKatakana();
  await seedKanji();

  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
