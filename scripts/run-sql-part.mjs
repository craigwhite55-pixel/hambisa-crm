import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const part = process.argv[2];
if (!part) {
  console.error("Usage: node run-sql-part.mjs <part1|part2|part3>");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, `migration-${part}.sql`), "utf8");
const expression = `(() => {
  const sql = ${JSON.stringify(sql)};
  const editor = window.monaco.editor.getEditors()[0];
  editor.setValue(sql);
  editor.focus();
  return editor.getValue().length;
})()`;

const payload = {
  method: "Runtime.evaluate",
  params: { expression, returnByValue: true },
};
fs.writeFileSync(path.join(__dirname, "cdp-part.json"), JSON.stringify(payload));
console.log(JSON.stringify({ part, length: sql.length, exprLength: expression.length }));
