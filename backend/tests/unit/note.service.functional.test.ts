import { describe, it, expect, vi } from 'vitest';
import { ok, err, okAsync, errAsync } from 'neverthrow';
import {
  validateContentLength,
  extractMentionIds,
  detectCircularReference,
  createNote,
  getNoteById,
  getRootNotes,
  updateNote,
  type NoteRepository,
  type MentionRepository,
} from '../../src/services/note.service.functional';
import {
  contentEmptyError,
  contentTooLongError,
  circularReferenceError,
  noteNotFoundError,
  parentNoteNotFoundError,
  depthLimitExceededError,
  databaseError,
  type NoteError,
} from '../../src/errors/domain-errors';
import type { Note, NewNote, NewMention } from '../../src/db';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';

// ==========================================
// Test Helpers - Mock Factories
// ==========================================

const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'abc123',
  content: 'Test note',
  parentId: null,
  authorId: null,
  depth: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockNoteRepository = (
  overrides: Partial<NoteRepository> = {}
): NoteRepository => ({
  findById: vi.fn(() => okAsync(undefined)),
  create: vi.fn((note: NewNote) =>
    okAsync(createMockNote({ id: note.id, content: note.content }))
  ),
  update: vi.fn((id: string, content: string) =>
    okAsync(createMockNote({ id, content }))
  ),
  findRootNotes: vi.fn(() => okAsync([])),
  countRootNotes: vi.fn(() => okAsync(0)),
  ...overrides,
});

const createMockMentionRepository = (
  overrides: Partial<MentionRepository> = {}
): MentionRepository => ({
  create: vi.fn(() => okAsync(undefined)),
  deleteByNoteId: vi.fn(() => okAsync(undefined)),
  getAllMentions: vi.fn(() => okAsync(new Map())),
  ...overrides,
});

// ==========================================
// Pure Function Tests
// ==========================================

describe('validateContentLength (純粋関数)', () => {
  it('空のコンテンツはエラーを返す', () => {
    const result = validateContentLength('');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('ContentEmptyError');
    }
  });

  it('最大長を超えるコンテンツはエラーを返す', () => {
    const longContent = 'a'.repeat(MAX_NOTE_LENGTH + 1);
    const result = validateContentLength(longContent);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('ContentTooLongError');
      expect((result.error as { actualLength: number }).actualLength).toBe(MAX_NOTE_LENGTH + 1);
    }
  });

  it('有効なコンテンツはOkを返す', () => {
    const result = validateContentLength('Valid content');

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe('Valid content');
    }
  });

  it('境界値: ちょうど最大長のコンテンツは有効', () => {
    const content = 'a'.repeat(MAX_NOTE_LENGTH);
    const result = validateContentLength(content);

    expect(result.isOk()).toBe(true);
  });
});

describe('extractMentionIds (純粋関数)', () => {
  it('メンションがない場合は空配列を返す', () => {
    const result = extractMentionIds('Hello world');
    expect(result).toEqual([]);
  });

  it('単一のメンションを抽出する', () => {
    const result = extractMentionIds('Hello @abc123');
    expect(result).toEqual(['abc123']);
  });

  it('複数のメンションを抽出する', () => {
    const result = extractMentionIds('@abc123 and @def456 mentioned');
    expect(result).toContain('abc123');
    expect(result).toContain('def456');
  });

  it('重複したメンションは1つにまとめる', () => {
    const result = extractMentionIds('@abc123 and @abc123 again');
    expect(result).toEqual(['abc123']);
  });
});

describe('detectCircularReference (純粋関数)', () => {
  it('空のグラフでは循環なし', () => {
    const graph = new Map<string, string[]>();
    const result = detectCircularReference(graph, 'A', ['B']);

    expect(result.isOk()).toBe(true);
  });

  it('自己参照は循環として検出される', () => {
    const graph = new Map<string, string[]>();
    const result = detectCircularReference(graph, 'A', ['A']);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('CircularReferenceError');
    }
  });

  it('直接循環を検出する (A -> B -> A)', () => {
    const graph = new Map<string, string[]>([['B', ['A']]]);
    const result = detectCircularReference(graph, 'A', ['B']);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('CircularReferenceError');
    }
  });

  it('間接循環を検出する (A -> B -> C -> A)', () => {
    const graph = new Map<string, string[]>([
      ['B', ['C']],
      ['C', ['A']],
    ]);
    const result = detectCircularReference(graph, 'A', ['B']);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('CircularReferenceError');
    }
  });

  it('循環しないパスは許可される', () => {
    const graph = new Map<string, string[]>([
      ['B', ['C']],
      ['C', ['D']],
    ]);
    const result = detectCircularReference(graph, 'A', ['B']);

    expect(result.isOk()).toBe(true);
  });
});

// ==========================================
// Service Function Tests (with Mocks)
// ==========================================

describe('createNote (サービス関数)', () => {
  it('有効な入力でノートを作成する', async () => {
    const noteRepo = createMockNoteRepository();
    const mentionRepo = createMockMentionRepository();

    const result = await createNote(noteRepo, mentionRepo)({
      content: 'Test note',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe('Test note');
    }
    expect(noteRepo.create).toHaveBeenCalled();
  });

  it('空のコンテンツはエラーを返す', async () => {
    const noteRepo = createMockNoteRepository();
    const mentionRepo = createMockMentionRepository();

    const result = await createNote(noteRepo, mentionRepo)({
      content: '',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('ContentEmptyError');
    }
    expect(noteRepo.create).not.toHaveBeenCalled();
  });

  it('存在しない親IDはエラーを返す', async () => {
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => okAsync(undefined)),
    });
    const mentionRepo = createMockMentionRepository();

    const result = await createNote(noteRepo, mentionRepo)({
      content: 'Reply',
      parentId: 'nonexistent',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('ParentNoteNotFoundError');
    }
  });

  it('深度制限を超える場合はエラーを返す', async () => {
    const parentNote = createMockNote({ id: 'parent', depth: 1 });
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => okAsync(parentNote)),
    });
    const mentionRepo = createMockMentionRepository();

    const result = await createNote(noteRepo, mentionRepo)({
      content: 'Nested reply',
      parentId: 'parent',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('DepthLimitExceededError');
    }
  });

  it('メンション付きノートを作成する', async () => {
    const noteRepo = createMockNoteRepository();
    const mentionRepo = createMockMentionRepository();

    const result = await createNote(noteRepo, mentionRepo)({
      content: 'Mentioning @abc123',
    });

    expect(result.isOk()).toBe(true);
    expect(mentionRepo.create).toHaveBeenCalled();
  });
});

describe('getNoteById (サービス関数)', () => {
  it('存在するノートを返す', async () => {
    const note = createMockNote({ id: 'test123', content: 'Found' });
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => okAsync(note)),
    });

    const result = await getNoteById(noteRepo)('test123');

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe('test123');
      expect(result.value.content).toBe('Found');
    }
  });

  it('存在しないノートはエラーを返す', async () => {
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => okAsync(undefined)),
    });

    const result = await getNoteById(noteRepo)('nonexistent');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('NoteNotFoundError');
      expect((result.error as { noteId: string }).noteId).toBe('nonexistent');
    }
  });

  it('データベースエラーを適切にラップする', async () => {
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => errAsync(databaseError('Connection failed'))),
    });

    const result = await getNoteById(noteRepo)('test');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('DatabaseError');
    }
  });
});

describe('getRootNotes (サービス関数)', () => {
  it('ルートノートのリストを返す', async () => {
    const mockNotes = [
      createMockNote({ id: 'a' }),
      createMockNote({ id: 'b' }),
    ];
    const noteRepo = createMockNoteRepository({
      findRootNotes: vi.fn(() => okAsync(mockNotes)),
      countRootNotes: vi.fn(() => okAsync(2)),
    });

    const result = await getRootNotes(noteRepo)(20, 0);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.notes).toHaveLength(2);
      expect(result.value.total).toBe(2);
      expect(result.value.hasMore).toBe(false);
    }
  });

  it('hasMoreが正しく計算される', async () => {
    const mockNotes = Array.from({ length: 20 }, (_, i) =>
      createMockNote({ id: `note${i}` })
    );
    const noteRepo = createMockNoteRepository({
      findRootNotes: vi.fn(() => okAsync(mockNotes)),
      countRootNotes: vi.fn(() => okAsync(50)),
    });

    const result = await getRootNotes(noteRepo)(20, 0);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.hasMore).toBe(true);
    }
  });
});

describe('updateNote (サービス関数)', () => {
  it('ノートを更新する', async () => {
    const existingNote = createMockNote({ id: 'test', content: 'Old' });
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => okAsync(existingNote)),
      update: vi.fn((id, content) => okAsync(createMockNote({ id, content }))),
    });
    const mentionRepo = createMockMentionRepository();

    const result = await updateNote(noteRepo, mentionRepo)('test', {
      content: 'New content',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe('New content');
    }
    expect(mentionRepo.deleteByNoteId).toHaveBeenCalledWith('test');
  });

  it('存在しないノートの更新はエラー', async () => {
    const noteRepo = createMockNoteRepository({
      findById: vi.fn(() => okAsync(undefined)),
    });
    const mentionRepo = createMockMentionRepository();

    const result = await updateNote(noteRepo, mentionRepo)('nonexistent', {
      content: 'Updated',
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error._tag).toBe('NoteNotFoundError');
    }
  });
});

// ==========================================
// Error Type Tests
// ==========================================

describe('Domain Errors', () => {
  it('エラーコンストラクタは正しい型を生成する', () => {
    const errors = [
      contentEmptyError(),
      contentTooLongError(1000, 1500),
      circularReferenceError('A', ['B', 'C']),
      noteNotFoundError('abc123'),
      parentNoteNotFoundError('parent123'),
      depthLimitExceededError(1),
      databaseError('Connection failed'),
    ];

    const tags = errors.map((e) => e._tag);
    expect(tags).toEqual([
      'ContentEmptyError',
      'ContentTooLongError',
      'CircularReferenceError',
      'NoteNotFoundError',
      'ParentNoteNotFoundError',
      'DepthLimitExceededError',
      'DatabaseError',
    ]);
  });

  it('エラーメッセージは説明的である', () => {
    const error = contentTooLongError(1000, 1500);
    expect(error.message).toContain('1000');
    expect(error.message).toContain('1500');
  });
});
