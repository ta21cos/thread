import { db } from "@/db";
import { channels, postReplies, posts, profiles } from "@/db/schema";
import { count } from "drizzle-orm";
import { parseArgs } from "util";

interface D1Export {
  channels: unknown[];
  messages: unknown[];
  thread_messages: unknown[];
}

async function main() {
  const { positionals, values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(`Usage: bun run scripts/verify-migration.ts <d1-export.json>

Compares the expected record counts from the D1 export JSON
against the actual counts in the Supabase database.

Requires DATABASE_URL env var to connect to Supabase.`);
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL env var is required.");
    process.exit(1);
  }

  const inputPath = positionals[0];
  const inputFile = Bun.file(inputPath);
  if (!(await inputFile.exists())) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  const data = (await inputFile.json()) as D1Export;

  const expected = {
    channels: data.channels.length,
    posts: data.messages.length,
    post_replies: data.thread_messages.length,
  };

  const [profileRows] = await db.select({ count: count() }).from(profiles);
  const [channelRows] = await db.select({ count: count() }).from(channels);
  const [postRows] = await db.select({ count: count() }).from(posts);
  const [replyRows] = await db.select({ count: count() }).from(postReplies);

  const actual = {
    profiles: profileRows.count,
    channels: channelRows.count,
    posts: postRows.count,
    post_replies: replyRows.count,
  };

  console.log("=== Migration Verification ===\n");
  console.log("Table            Expected  Actual    Status");
  console.log("───────────────  ────────  ────────  ──────");

  let hasDiscrepancy = false;

  const comparisons = [
    { table: "channels", expected: expected.channels, actual: actual.channels },
    { table: "posts", expected: expected.posts, actual: actual.posts },
    {
      table: "post_replies",
      expected: expected.post_replies,
      actual: actual.post_replies,
    },
  ];

  for (const { table, expected: exp, actual: act } of comparisons) {
    const match = exp === act;
    if (!match) hasDiscrepancy = true;
    const status = match ? "OK" : "MISMATCH";
    console.log(
      `${table.padEnd(17)}${String(exp).padEnd(10)}${String(act).padEnd(10)}${status}`,
    );
  }

  console.log(
    `${"profiles".padEnd(17)}${"—".padEnd(10)}${String(actual.profiles).padEnd(10)}(info)`,
  );

  console.log("");

  if (hasDiscrepancy) {
    console.log("RESULT: Discrepancies found. Please investigate.");
    process.exit(1);
  } else {
    console.log("RESULT: All counts match. Migration verified successfully.");
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
