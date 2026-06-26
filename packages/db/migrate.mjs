// Simple forward-only migration runner.
// Applies every .sql file in ./migrations in filename order, exactly once,
// inside a transaction. Tracks applied files in a _migrations table.
//
// Usage: node migrate.mjs            (uses DATABASE_URL from ../../.env or env)
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from repo root if present
dotenv.config({ path: join(__dirname, "..", "..", ".env") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("✗ DATABASE_URL is not set. Add it to .env (Supabase → Settings → Database).");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

const migrationsDir = join(__dirname, "migrations");

async function main() {
  await client.connect();
  await client.query(`
    create table if not exists _migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await client.query("select filename from _migrations")).rows.map((r) => r.filename)
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`• skip  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    process.stdout.write(`→ apply ${file} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migrations(filename) values ($1)", [file]);
      await client.query("commit");
      console.log("done");
      ran++;
    } catch (err) {
      await client.query("rollback");
      console.error(`\n✗ failed on ${file}:\n${err.message}`);
      process.exit(1);
    }
  }

  console.log(ran === 0 ? "\n✓ Database already up to date." : `\n✓ Applied ${ran} migration(s).`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
