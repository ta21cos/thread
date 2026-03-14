import { db } from "@/db";
import { channels, postReplies, posts, profiles } from "@/db/schema";
import { parseArgs } from "util";

interface D1Channel {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface D1Message {
  id: string;
  channel_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface D1ThreadMessage {
  id: string;
  message_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface D1Export {
  channels: D1Channel[];
  messages: D1Message[];
  thread_messages: D1ThreadMessage[];
}

type UserMapping = Record<string, { profileId: string; authUserId: string }>;

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

function toTimestamptz(dateStr: string): string {
  if (dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return `${dateStr}+00:00`;
}

function generateSQL(data: D1Export, userMapping: UserMapping): string {
  const lines: string[] = [];
  lines.push("-- Migration: D1 (SQLite) → Supabase (PostgreSQL)");
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("BEGIN;");
  lines.push("");

  const uniqueProfileIds = new Set<string>();
  for (const mapping of Object.values(userMapping)) {
    if (!uniqueProfileIds.has(mapping.profileId)) {
      uniqueProfileIds.add(mapping.profileId);
      lines.push(
        `INSERT INTO profiles (id, auth_user_id, display_name, created_at, updated_at)` +
          ` VALUES ('${mapping.profileId}', '${mapping.authUserId}', 'User', NOW(), NOW())` +
          ` ON CONFLICT (id) DO NOTHING;`,
      );
    }
  }
  lines.push("");

  lines.push(`-- Channels (${data.channels.length} rows)`);
  for (const ch of data.channels) {
    const mapping = userMapping[ch.user_id];
    if (!mapping) {
      console.error(
        `WARNING: No user mapping for Clerk user_id=${ch.user_id} (channel=${ch.id})`,
      );
      continue;
    }
    lines.push(
      `INSERT INTO channels (id, name, description, sort_order, author_id, created_at, updated_at)` +
        ` VALUES ('${ch.id}', '${escapeSQL(ch.name)}', ${ch.description ? `'${escapeSQL(ch.description)}'` : "NULL"}, ${ch.sort_order}, '${mapping.profileId}', '${toTimestamptz(ch.created_at)}', '${toTimestamptz(ch.updated_at)}')` +
        ` ON CONFLICT (id) DO NOTHING;`,
    );
  }
  lines.push("");

  lines.push(`-- Posts (was messages, ${data.messages.length} rows)`);
  for (const msg of data.messages) {
    const mapping = userMapping[msg.user_id];
    if (!mapping) {
      console.error(
        `WARNING: No user mapping for Clerk user_id=${msg.user_id} (message=${msg.id})`,
      );
      continue;
    }
    lines.push(
      `INSERT INTO posts (id, channel_id, content, author_id, created_at, updated_at)` +
        ` VALUES ('${msg.id}', '${msg.channel_id}', '${escapeSQL(msg.content)}', '${mapping.profileId}', '${toTimestamptz(msg.created_at)}', '${toTimestamptz(msg.updated_at)}')` +
        ` ON CONFLICT (id) DO NOTHING;`,
    );
  }
  lines.push("");

  lines.push(
    `-- Post replies (was thread_messages, ${data.thread_messages.length} rows)`,
  );
  for (const tm of data.thread_messages) {
    const mapping = userMapping[tm.user_id];
    if (!mapping) {
      console.error(
        `WARNING: No user mapping for Clerk user_id=${tm.user_id} (thread_message=${tm.id})`,
      );
      continue;
    }
    lines.push(
      `INSERT INTO post_replies (id, post_id, content, author_id, created_at, updated_at)` +
        ` VALUES ('${tm.id}', '${tm.message_id}', '${escapeSQL(tm.content)}', '${mapping.profileId}', '${toTimestamptz(tm.created_at)}', '${toTimestamptz(tm.updated_at)}')` +
        ` ON CONFLICT (id) DO NOTHING;`,
    );
  }
  lines.push("");

  lines.push("COMMIT;");
  return lines.join("\n");
}

async function executeInserts(data: D1Export, userMapping: UserMapping) {
  const uniqueProfiles = new Map<
    string,
    { profileId: string; authUserId: string }
  >();
  for (const mapping of Object.values(userMapping)) {
    if (!uniqueProfiles.has(mapping.profileId)) {
      uniqueProfiles.set(mapping.profileId, mapping);
    }
  }

  console.log("Inserting profiles...");
  for (const { profileId, authUserId } of uniqueProfiles.values()) {
    await db
      .insert(profiles)
      .values({
        id: profileId,
        authUserId,
        displayName: "User",
      })
      .onConflictDoNothing();
  }

  console.log(`Inserting ${data.channels.length} channels...`);
  for (const ch of data.channels) {
    const mapping = userMapping[ch.user_id];
    if (!mapping) continue;
    await db
      .insert(channels)
      .values({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        sortOrder: ch.sort_order,
        authorId: mapping.profileId,
        createdAt: new Date(toTimestamptz(ch.created_at)),
        updatedAt: new Date(toTimestamptz(ch.updated_at)),
      })
      .onConflictDoNothing();
  }

  console.log(`Inserting ${data.messages.length} posts...`);
  for (const msg of data.messages) {
    const mapping = userMapping[msg.user_id];
    if (!mapping) continue;
    await db
      .insert(posts)
      .values({
        id: msg.id,
        channelId: msg.channel_id,
        content: msg.content,
        authorId: mapping.profileId,
        createdAt: new Date(toTimestamptz(msg.created_at)),
        updatedAt: new Date(toTimestamptz(msg.updated_at)),
      })
      .onConflictDoNothing();
  }

  console.log(`Inserting ${data.thread_messages.length} post replies...`);
  for (const tm of data.thread_messages) {
    const mapping = userMapping[tm.user_id];
    if (!mapping) continue;
    await db
      .insert(postReplies)
      .values({
        id: tm.id,
        postId: tm.message_id,
        content: tm.content,
        authorId: mapping.profileId,
        createdAt: new Date(toTimestamptz(tm.created_at)),
        updatedAt: new Date(toTimestamptz(tm.updated_at)),
      })
      .onConflictDoNothing();
  }

  console.log("Migration complete.");
}

async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      execute: { type: "boolean", default: false },
      "user-map": { type: "string" },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(`Usage: bun run scripts/migrate.ts [options] <d1-export.json>

Options:
  --user-map <file>   JSON file mapping Clerk user_id → { profileId, authUserId }
                      Example: { "clerk_abc": { "profileId": "uuid1", "authUserId": "uuid2" } }
  --execute           Directly insert into Supabase (requires DATABASE_URL env var)
                      Without this flag, SQL statements are printed to stdout.
  --help              Show this help message

Environment variables:
  USER_MAP            Alternative to --user-map flag (inline JSON string)
  DATABASE_URL        Required when using --execute`);
    process.exit(0);
  }

  const inputPath = positionals[0];
  const inputFile = Bun.file(inputPath);
  if (!(await inputFile.exists())) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  const data = (await inputFile.json()) as D1Export;

  if (!data.channels || !data.messages || !data.thread_messages) {
    console.error(
      "Error: Input JSON must have 'channels', 'messages', and 'thread_messages' keys.",
    );
    process.exit(1);
  }

  let userMapping: UserMapping;
  const userMapPath = values["user-map"];
  const userMapEnv = process.env.USER_MAP;

  if (userMapPath) {
    const mapFile = Bun.file(userMapPath);
    if (!(await mapFile.exists())) {
      console.error(`Error: User map file not found: ${userMapPath}`);
      process.exit(1);
    }
    userMapping = (await mapFile.json()) as UserMapping;
  } else if (userMapEnv) {
    userMapping = JSON.parse(userMapEnv) as UserMapping;
  } else {
    console.error(
      "Error: User mapping is required. Provide via --user-map <file> or USER_MAP env var.",
    );
    process.exit(1);
  }

  const allUserIds = new Set<string>();
  data.channels.forEach((ch) => allUserIds.add(ch.user_id));
  data.messages.forEach((msg) => allUserIds.add(msg.user_id));
  data.thread_messages.forEach((tm) => allUserIds.add(tm.user_id));

  const missingUsers = [...allUserIds].filter((uid) => !userMapping[uid]);
  if (missingUsers.length > 0) {
    console.error(
      `Error: Missing user mappings for: ${missingUsers.join(", ")}`,
    );
    process.exit(1);
  }

  if (values.execute) {
    if (!process.env.DATABASE_URL) {
      console.error(
        "Error: DATABASE_URL env var is required for --execute mode.",
      );
      process.exit(1);
    }
    await executeInserts(data, userMapping);
  } else {
    const sql = generateSQL(data, userMapping);
    console.log(sql);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
