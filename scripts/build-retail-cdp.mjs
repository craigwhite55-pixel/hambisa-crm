import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(
  path.join(__dirname, "..", "supabase", "migrations", "004_retail_phase1.sql"),
  "utf8"
);

const expression = `(() => {
  const sql = ${JSON.stringify(sql)};
  const editor = window.monaco.editor.getEditors()[0];
  if (!editor) return "no editor";
  editor.setValue(sql);
  editor.focus();
  return editor.getValue().length;
})()`;

fs.writeFileSync(path.join(__dirname, "cdp-retail-migration.txt"), expression, "utf8");
console.log("length:", expression.length);
