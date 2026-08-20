import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const archiveDir = process.argv[2] || "dist-archive";
const profileFile = process.argv[3] || "seed/profile_photos_live_full.json";
const roomFile = process.argv[4] || "seed/room_photos_live.json";

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

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeUrl(value) {
  return String(value).replaceAll("&amp;", "&");
}

const profiles = JSON.parse(await readFile(profileFile, "utf8"));
const rooms = JSON.parse(await readFile(roomFile, "utf8"));
const profilePhotos = new Map();
for (const item of profiles) {
  if (!item.username || !item.imageUrl) continue;
  const list = profilePhotos.get(item.username) || [];
  const url = normalizeUrl(item.imageUrl);
  if (!list.includes(url)) list.push(url);
  profilePhotos.set(item.username, list);
}
const roomPhotos = new Map();
for (const item of rooms) {
  if (!item.roomSlug || !item.imageUrl) continue;
  const list = roomPhotos.get(item.roomSlug) || [];
  const url = normalizeUrl(item.imageUrl);
  if (!list.includes(url)) list.push(url);
  roomPhotos.set(item.roomSlug, list);
}

const style = `<style data-archive-media>\n.archive-media-fallback{margin:28px auto;max-width:1180px;padding:0 24px 36px}.archive-media-fallback h2{font-size:24px;margin:0 0 16px}.archive-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}.archive-media-grid img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;background:#252525}.archive-media-note{color:#aaa;font-size:13px;margin-top:10px}@media(max-width:640px){.archive-media-fallback{padding-inline:14px}.archive-media-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}\n</style>`;

let injected = 0;
for (const file of await walk(archiveDir)) {
  if (!file.endsWith("index.html")) continue;
  const route = "/" + relative(archiveDir, file).replace(/\\/g, "/").replace(/index\.html$/, "");
  const profileMatch = route.match(/^\/user\/([^/]+)\/?$/);
  const roomMatch = route.match(/^\/room\/([^/]+)\/?$/);
  const username = profileMatch ? decodeURIComponent(profileMatch[1]) : null;
  const roomSlug = roomMatch ? decodeURIComponent(roomMatch[1]) : null;
  const photos = username ? profilePhotos.get(username) : roomSlug ? roomPhotos.get(roomSlug) : null;
  if (!photos?.length) continue;
  let html = await readFile(file, "utf8");
  if (html.includes("data-archive-media")) continue;
  const title = username ? `${username} archived photos` : `${roomSlug} archived photos`;
  const cards = photos.slice(0, 48).map((url, index) => `<img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(title)} ${index + 1}" />`).join("");
  const block = `${style}<section class="archive-media-fallback" data-archive-media><h2>${escapeHtml(title)}</h2><div class="archive-media-grid">${cards}</div><p class="archive-media-note">Archived public media reference. Images are served from the original public image host.</p></section>`;
  html = html.replace(/<\/body>/i, `${block}</body>`);
  await writeFile(file, html, "utf8");
  injected += 1;
}

// Some public profile-photo pages were not present in the crawled HTML snapshot.
// Generate lightweight read-only archive pages for catalog entries so those photos
// remain browseable on GitHub Pages without a live backend.
for (const [username, photos] of profilePhotos) {
  if (!photos.length) continue;
  const profileDir = join(archiveDir, "user", encodeURIComponent(username), "photos");
  const profileFile = join(profileDir, "index.html");
  try {
    await readFile(profileFile, "utf8");
    continue;
  } catch {
    // Create the missing static route below.
  }
  await (await import("node:fs/promises")).mkdir(profileDir, { recursive: true });
  const title = `${username} archived photos`;
  const cards = photos.slice(0, 48).map((url, index) => `<img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(title)} ${index + 1}" />`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>${style}</head><body><main class="archive-media-fallback"><p><a href="../../../">Back to archive</a></p><h1>${escapeHtml(title)}</h1><div class="archive-media-grid">${cards}</div><p class="archive-media-note">Archived public media reference. Images are served from the original public image host.</p></main></body></html>`;
  await writeFile(profileFile, html, "utf8");
  injected += 1;
}
console.log(`Injected archived media into ${injected} route pages from ${profilePhotos.size} profiles and ${roomPhotos.size} rooms.`);
