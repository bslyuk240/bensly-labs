import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const sql = neon(dbUrl);
  const schema = readFileSync(join(process.cwd(), "lib/db/schema.sql"), "utf-8");

  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log("✓", stmt.split("\n")[0].substring(0, 60));
    } catch (err) {
      console.error("✗", stmt.substring(0, 60), err);
    }
  }

  console.log("\n✅ Migration complete!");
}

migrate().catch(console.error);
