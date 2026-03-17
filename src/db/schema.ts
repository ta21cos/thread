import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: uuid("auth_user_id").notNull().unique(),
    displayName: text("display_name").notNull().default("User"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("profiles_select", {
      for: "select",
      using: sql`auth.uid() = ${table.authUserId}`,
    }),
    pgPolicy("profiles_insert", {
      for: "insert",
      withCheck: sql`auth.uid() = ${table.authUserId}`,
    }),
    pgPolicy("profiles_update", {
      for: "update",
      using: sql`auth.uid() = ${table.authUserId}`,
    }),
  ],
).enableRLS();

export const channels = pgTable(
  "channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("channels_select", {
      for: "select",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("channels_insert", {
      for: "insert",
      withCheck: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("channels_update", {
      for: "update",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("channels_delete", {
      for: "delete",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
  ],
).enableRLS();

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isPromoted: boolean("is_promoted").notNull().default(false),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("posts_select", {
      for: "select",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("posts_insert", {
      for: "insert",
      withCheck: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("posts_update", {
      for: "update",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("posts_delete", {
      for: "delete",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
  ],
).enableRLS();

export const postReplies = pgTable(
  "post_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("post_replies_select", {
      for: "select",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("post_replies_insert", {
      for: "insert",
      withCheck: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("post_replies_update", {
      for: "update",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("post_replies_delete", {
      for: "delete",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
  ],
).enableRLS();

export const stocks = pgTable(
  "stocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: text("status").notNull().default("inbox"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    group: text("group"),
    sourcePostIds: text("source_post_ids").notNull().default("[]"),
    sourceChannelId: uuid("source_channel_id").references(() => channels.id, {
      onDelete: "set null",
    }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("stocks_select", {
      for: "select",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("stocks_insert", {
      for: "insert",
      withCheck: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("stocks_update", {
      for: "update",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
    pgPolicy("stocks_delete", {
      for: "delete",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = ${table.authorId})`,
    }),
  ],
).enableRLS();

export const stockTags = pgTable(
  "stock_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stockId: uuid("stock_id")
      .notNull()
      .references(() => stocks.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    unique("stock_tags_stock_id_tag_unique").on(table.stockId, table.tag),
    pgPolicy("stock_tags_select", {
      for: "select",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = ${table.stockId}))`,
    }),
    pgPolicy("stock_tags_insert", {
      for: "insert",
      withCheck: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = ${table.stockId}))`,
    }),
    pgPolicy("stock_tags_update", {
      for: "update",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = ${table.stockId}))`,
    }),
    pgPolicy("stock_tags_delete", {
      for: "delete",
      using: sql`auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = ${table.stockId}))`,
    }),
  ],
).enableRLS();
