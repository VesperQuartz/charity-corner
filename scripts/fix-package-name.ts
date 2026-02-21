import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const appDir = process.cwd();
const appName = basename(appDir);
const pkgPath = join(appDir, "package.json");

try {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = appName;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`✅ package.json name updated to "${appName}"`);
} catch (err) {
  if (err instanceof Error) {
    console.error("❌ Failed to update package.json:", err.message);
  }
}
