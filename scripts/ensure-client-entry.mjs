import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryPath = resolve(projectRoot, "client/index.html");

if (!existsSync(entryPath)) {
  mkdirSync(dirname(entryPath), { recursive: true });
  writeFileSync(
    entryPath,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Rec Room Editable Community Site</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script defer src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"></script>
  </body>
</html>
`,
    "utf8",
  );
  console.log("Created missing client/index.html entrypoint.");
}
