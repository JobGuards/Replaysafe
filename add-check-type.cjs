const fs = require("fs");
const path = require("path");

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (
      file === "node_modules" ||
      file === ".git" ||
      file === ".next" ||
      file === "dist"
    )
      continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === "package.json") {
      const hasTsConfig = fs.existsSync(path.join(dir, "tsconfig.json"));
      if (hasTsConfig) {
        const pkg = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        if (pkg.scripts && !pkg.scripts["check-type"]) {
          pkg.scripts["check-type"] = "tsc --noEmit";
          fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n");
          console.log(`Added check-type to ${fullPath}`);
        }
      }
    }
  }
}

processDir(process.cwd());
