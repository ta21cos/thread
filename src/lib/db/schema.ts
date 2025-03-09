import { Generated, ColumnType } from 'kysely';

// Define the database schema
export interface Database {
  memos: MemoTable;
  users: UserTable;
}

// Define the memo table schema
export interface MemoTable {
  id: Generated<string>;
  content: string;
  user_id: string;
  parent_id: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

// Define the user table schema
export interface UserTable {
  id: string;
  email: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Define types for easier use in the application
export type Memo = {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type NewMemo = Omit<Memo, 'id' | 'created_at' | 'updated_at'>;
export type User = {
  id: string;
  email: string;
  created_at: Date;
};
