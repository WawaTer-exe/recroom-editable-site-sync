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

const style = `<style data-archive-media>\n.archive-media-fallback{margin:28px auto;max-width:1180px;padding:0 24px 36px}.archive-media-fallback h2{font-size:24px;margin:0 0 16px}.archive-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}.archive-media-grid img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;background:#252525}.archive-media-card{display:block;color:inherit;text-decoration:none}.archive-media-card span{display:block;padding:8px 2px;color:#ddd;font-size:13px}.archive-media-note{color:#aaa;font-size:13px}.archive-home-gallery{margin-top:18px}.archive-home-gallery + *{margin-top:0}@media(max-width:640px){.archive-media-fallback{padding-inline:14px}.archive-media-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}\n</style>`;

let injected = 0;
for (const file of await walk(archiveDir)) {
  if (!file.endsWith("index.html")) continue;
  const route = "/" + relative(archiveDir, file).replace(/\\/g, "/").replace(/index\.html$/, "");
  const profileMatch = route.match(/^\/user\/([^/]+)\/?$/);
  const roomMatch = route.match(/^\/room\/([^/]+)\/?$/);
  const username = profileMatch ? decodeURIComponent(profileMatch[1]) : null;
  const roomSlug = roomMatch ? decodeURIComponent(roomMatch[1]) : null;
  let html = await readFile(file, "utf8");
  if (html.includes("data-archive-media")) continue;

  if (route === "/") {
    const homepageCards = [...roomPhotos.entries()].flatMap(([slug, photos]) => photos.slice(0, 1).map((url, index) => ({ slug, url, index }))).slice(0, 24);
    if (!homepageCards.length) continue;
    const title = "Archived room photos";
    const cards = homepageCards.map(({ slug, url, index }) => `<a class="archive-media-card" href="room/${encodeURIComponent(slug)}/"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(slug)} archived room photo ${index + 1}" /><span>${escapeHtml(slug)}</span></a>`).join("");
    const runtimeCards = JSON.stringify(homepageCards.map(({ slug, url, index }) => ({ slug, url, index }))).replace(/</g, "\\u003c");
    const runtime = `<script data-archive-home-runtime>(function(){const cards=${runtimeCards};const run=function(){if(document.querySelector('.archive-home-gallery'))return;const heading=[...document.querySelectorAll('body *')].find(function(e){return e.children.length===0&&/^Featured Rooms$/i.test((e.textContent||'').trim())});if(!heading)return;const style=document.createElement('style');style.dataset.archiveHomeRepair='';style.textContent='body [aria-busy="true"]{display:none!important}.archive-home-gallery{margin:18px auto 28px;max-width:1180px;padding:0 24px 36px}.archive-home-gallery h2{font-size:24px;margin:0 0 16px}.archive-home-gallery .archive-media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}.archive-home-gallery img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;background:#252525}.archive-home-gallery a{display:block;color:inherit;text-decoration:none}.archive-home-gallery a span{display:block;padding:8px 2px;color:#ddd;font-size:13px}';document.head.appendChild(style);const section=document.createElement('section');section.className='archive-media-fallback archive-home-gallery';section.dataset.archiveMedia='';section.innerHTML='<h2>Archived room photos</h2><div class="archive-media-grid">'+cards.map(function(c){return '<a href="room/'+encodeURIComponent(c.slug)+'/" ><img loading="lazy" src="'+c.url.replace(/&/g,'&amp;')+'" alt="'+c.slug+' archived room photo '+(c.index+1)+'"><span>'+c.slug+'</span></a>';}).join('')+'</div><p>Archived public room media. Images are served from the original public image host.</p>';heading.parentElement.insertBefore(section,heading.parentElement.firstChild)};const observer=new MutationObserver(run);observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(run,250);setTimeout(function(){observer.disconnect()},30000)})();</script>`;
    const block = `${style}<style data-archive-home-repair>body [aria-busy="true"]{display:none!important}</style><section class="archive-media-fallback archive-home-gallery" data-archive-media><h2>${title}</h2><div class="archive-media-grid archive-media-room-grid">${cards}</div><p class="archive-media-note">Archived public room media. Images are served from the original public image host.</p></section>${runtime}`;
    const featuredIndex = html.search(/Featured Rooms/i);
    if (featuredIndex >= 0) html = html.slice(0, featuredIndex) + block + html.slice(featuredIndex);
    else html = html.replace(/<\/body>/i, `${block}</body>`);
    await writeFile(file, html, "utf8");
    injected += 1;
    continue;
  }

  const photos = username ? profilePhotos.get(username) : roomSlug ? roomPhotos.get(roomSlug) : null;
  if (!photos?.length) continue;
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
