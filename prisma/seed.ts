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
      name: 'Youssef',
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
  const existingCount = await prisma.kanjiLesson.count().catch(() => 0);

  if (!force && existingCount > 0) {
    console.log(`Kanji already seeded (${existingCount} lessons), skipping.`);
    console.log('Set SEED_KANJI_FORCE=1 to clear and reseed.\n');
    return;
  }

  if (force && existingCount > 0) {
    console.log('Clearing existing kanji data (SEED_KANJI_FORCE=1)...');
    await prisma.userVocabProgress.deleteMany().catch(() => {});
    await prisma.userKanjiProgress.deleteMany().catch(() => {});
    await prisma.userSettings.deleteMany().catch(() => {});
    await prisma.kanjiVocabulary.deleteMany().catch(() => {});
    await prisma.vocabulary.deleteMany().catch(() => {});
    await prisma.kanji.deleteMany().catch(() => {});
    await prisma.kanjiLesson.deleteMany().catch(() => {});
    console.log('Cleared.\n');
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
    // Create the lesson
    const lesson = await prisma.kanjiLesson.create({
      data: {
        level: level.level,
        title: level.title,
        description: level.description,
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
