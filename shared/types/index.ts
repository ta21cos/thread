/**
 * Shared TypeScript Interfaces
 *
 * These types are shared between frontend and backend.
 * They mirror the Drizzle schema types but are independent to avoid
 * coupling the frontend build to backend dependencies.
 */

// NOTE: Shared TypeScript interfaces for Note entities
export interface Note {
  id: string; // 6-char alphanumeric ID
  content: string; // Markdown content (max 1000 chars)
  parentId: string | null; // Reference to parent note (null for root)
  channelId: string; // Reference to channel (required)
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  depth: number; // Thread depth (0 for root)
  isHidden: boolean; // Whether note is hidden (only shown when setting enabled)
  replyCount?: number; // Number of direct replies (optional, included in list views)
  tags?: string[]; // Optional tags for categorization (UI-only for now)
  images?: string[]; // Optional image URLs (UI-only for now)
  pinned?: boolean; // Optional pinned status (UI-only for now)
  bookmarked?: boolean; // Optional bookmarked status (UI-only for now)
}

export interface Channel {
  id: string;
  authorId: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  noteId: string;
  authorId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  noteId: string;
  authorId: string;
  content: string;
  position: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScratchPad {
  id: string;
  authorId: string;
  channelId: string;
  content: string;
  updatedAt: string;
}

export interface DailyNote {
  id: string;
  noteId: string;
  authorId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Template {
  id: string;
  authorId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Mention {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  position: number; // Character position in content
  createdAt: string; // ISO 8601 string
}

export interface SearchIndex {
  noteId: string;
  content: string; // Preprocessed for search
  tokens: string[];
  mentions: string[];
  updatedAt: Date; // ISO 8601 string
}

// NOTE: API request/response types
export interface CreateNoteRequest {
  content: string;
  parentId?: string;
  channelId: string;
  isHidden?: boolean;
}

export interface CreateChannelRequest {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateChannelRequest {
  name?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface ChannelListResponse {
  channels: Channel[];
}

export interface UpdateNoteRequest {
  content: string;
}

export interface NoteListResponse {
  notes: Note[];
  total: number;
  hasMore: boolean;
}

export interface NoteDetailResponse {
  note: Note;
  thread: Note[];
}

export interface SearchResponse {
  results: Note[];
  total: number;
}

export interface MentionsResponse {
  mentions: Array<{
    note: Note;
    position: number;
  }>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}
