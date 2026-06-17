import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "004_retail_phase1.sql"
);

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  (process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.zqtjeludpkfsbwkkkptx.supabase.co:5432/postgres`
    : null);

if (!connectionString) {
  console.error(
    "Set DATABASE_URL or SUPABASE_DB_PASSWORD (Supabase → Settings → Database)."
  );
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    "SELECT dept_no, name FROM retail_major_departments ORDER BY dept_no"
  );
  console.log("Retail migration OK. Major departments:", rows.length);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
