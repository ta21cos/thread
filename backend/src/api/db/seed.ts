import { db, notes, mentions } from './index';
import { generateId } from '../../domain/utils/id-generator';
import { sql } from 'drizzle-orm';

// NOTE: Seed script for test data
async function seed() {
  console.log('Seeding database...');

  // Clear existing data - handle foreign key constraints
  // First delete mentions (they reference notes)
  await db.delete(mentions);

  // Delete notes in reverse depth order to handle parentId foreign keys
  // First delete all child notes (with parentId)
  await db.run(sql`DELETE FROM notes WHERE parent_id IS NOT NULL`);
  // Then delete root notes
  await db.run(sql`DELETE FROM notes WHERE parent_id IS NULL`);

  // Create test data expected by tests
  // Test note with specific ID for contract tests
  await db.insert(notes).values({
    id: 'abc123',
    content: 'Test note for contract tests',
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Parent note for cascade delete test
  await db.insert(notes).values({
    id: 'parent',
    content: 'Parent note for cascade test',
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Child notes for cascade delete test
  await db.insert(notes).values({
    id: 'child1',
    content: 'Child note 1',
    parentId: 'parent',
    depth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(notes).values({
    id: 'child2',
    content: 'Child note 2',
    parentId: 'parent',
    depth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Note with no mentions for test
  await db.insert(notes).values({
    id: 'noment',
    content: 'Note with no mentions',
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create root note with generated ID
  const rootId = generateId();
  await db.insert(notes).values({
    id: rootId,
    content: 'Welcome to Thread Notes! This is your first note.',
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create reply with generated ID
  const replyId = generateId();
  await db.insert(notes).values({
    id: replyId,
    content: `This is a reply to @${rootId}`,
    parentId: rootId,
    depth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create mention
  await db.insert(mentions).values({
    id: generateId(),
    fromNoteId: replyId,
    toNoteId: rootId,
    position: 17,
    createdAt: new Date(),
  });

  // Add searchable content
  await db.insert(notes).values({
    id: generateId(),
    content: 'This note contains the word test for search functionality',
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✓ Database seeded with sample and test data');
}

seed().catch(console.error);
