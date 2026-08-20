import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const archiveDir = process.argv[2] || "dist-archive";
const logoUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663865592103/EDVDILXKnPoqWewI.png";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

let updated = 0;
for (const file of await walk(archiveDir)) {
  if (!file.endsWith(".html")) continue;
  let html = await readFile(file, "utf8");
  const before = html;

  html = html.replace(/href=["']https:\/\/discord\.gg\/studio87["'][^>]*>\s*discord\.gg\/studio87\s*<\/a>/gi, "");
  html = html.replace(/<a[^>]*href=["']https:\/\/discord\.gg\/studio87["'][^>]*>\s*(<img[^>]*>)\s*<\/a>/gi, "$1");
  html = html.replace(/This website is a community tribute to Rec Room built by Studio 87\.[\s\S]*?sneek peeks 👀/gi, "This website is a community tribute to Rec Room built by DreamRec.");
  html = html.replace(/Studio 87/g, "DreamRec");
  html = html.replace(/discord\.gg\/studio87/gi, "");
  html = html.replace(/(?:https?:\/\/[^"']+|\/[^"']*)NEW(?:%20|\s)Studio(?:%20|\s)87(?:%20|\s)icon\.png/gi, logoUrl);
  html = html.replace(/(<img\b[^>]*?)alt=["']Studio 87["']/gi, "$1alt=\"DreamRec\"");
  html = html.replace(/(<img\b[^>]*?)src=["'][^"']*studio87[^"']*["']/gi, `$1src="${logoUrl}"`);
  html = html.replace(/(<link\b[^>]*?rel=["']preload["'][^>]*?as=["']image["'][^>]*?)href=["'][^"']*studio87[^"']*["']/gi, `$1href="${logoUrl}"`);

  if (html !== before) {
    await writeFile(file, html, "utf8");
    updated += 1;
  }
}

console.log(`Applied DreamRec branding to ${updated} HTML files.`);
console.log(`Logo: ${logoUrl}`);
