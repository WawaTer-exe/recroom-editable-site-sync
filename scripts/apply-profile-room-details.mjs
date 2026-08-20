import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const archiveDir = process.argv[2] || "dist-archive";
const mysticalRoomsFile = process.argv[3] || "seed/mystical/rooms.json";
const profilePhotosFile = process.argv[4] || "seed/mystical/photos.json";
const roomPhotosFile = process.argv[5] || "seed/room_photos_live.json";
const roomsFile = process.argv[6] || "seed/rooms_live.json";

const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeUrl = (value) => String(value ?? "").replaceAll("&amp;", "&");
const unique = (items) => [...new Set(items.filter(Boolean).map(safeUrl))];
const roomSlug = (room) => room.slug || room.roomSlug || room.name;
const roomDetailsStyle = `<style data-profile-room-style>
:root{color-scheme:dark}.archive-profile,.archive-room{box-sizing:border-box;max-width:1180px;margin:0 auto;padding:32px 24px 64px;color:#f4f0ec;background:#191919;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.5}.archive-profile a,.archive-room a{color:#ff7a45}.archive-profile h1,.archive-room h1{font-size:clamp(30px,5vw,54px);line-height:1.05;margin:12px 0 6px;color:#fff}.archive-profile h2,.archive-room h2{font-size:25px;margin:34px 0 14px;color:#fff}.archive-profile .profile-kicker,.archive-room .room-kicker{color:#bdb5af;margin:0 0 24px}.archive-profile-card,.archive-room-header{background:linear-gradient(145deg,#2b2b2b,#202020);border:1px solid #49433f;border-radius:18px;padding:24px;box-shadow:0 16px 40px #0005}.archive-profile-card{display:grid;grid-template-columns:130px 1fr;gap:22px;align-items:center}.archive-avatar{width:130px;height:130px;border-radius:50%;object-fit:cover;background:#333;border:3px solid #ff6a28}.archive-profile .meta,.archive-room .meta{color:#bcb4ae}.archive-bio{color:#eee;white-space:pre-line}.archive-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:18px}.archive-stat{background:#171717;border:1px solid #46403c;border-radius:12px;padding:12px}.archive-stat strong{display:block;font-size:18px;color:#fff}.archive-stat span{display:block;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:.06em}.archive-room-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:12px}.archive-room-link{display:flex;flex-direction:column;gap:5px;padding:15px;background:#292929;border:1px solid #4a443f;border-radius:12px;color:#f2eee9!important;text-decoration:none;transition:transform .18s ease,border-color .18s ease}.archive-room-link:hover{transform:translateY(-2px);border-color:#ff6a28}.archive-room-link span{color:#aaa;font-size:13px}.archive-room-link small{color:#ff9a70}.archive-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}.archive-photo-card{display:block;color:inherit;text-decoration:none;background:#252525;border-radius:12px;overflow:hidden;border:1px solid #403b37}.archive-photo-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:#303030}.archive-photo-card span{display:block;padding:8px 10px;color:#ccc;font-size:12px}.archive-metadata-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:20px 0}.archive-metadata-item{background:#242424;border:1px solid #443e39;border-radius:12px;padding:12px}.archive-metadata-item dt{color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:.06em}.archive-metadata-item dd{margin:3px 0 0;color:#fff;font-weight:600}.archive-tags{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0;list-style:none}.archive-tags li{background:#3a2a24;color:#ffb08c;border:1px solid #75432e;border-radius:999px;padding:5px 10px;font-size:12px}.archive-note{color:#9e9690;font-size:13px}.archive-cover{display:block;width:100%;max-height:520px;object-fit:cover;border-radius:14px;margin:20px 0}.archive-back{display:flex;gap:12px;flex-wrap:wrap;color:#bdb5af}.archive-profile-shell{background:#191919;min-height:100vh}@media(max-width:640px){.archive-profile,.archive-room{padding:22px 14px 48px}.archive-profile-card{grid-template-columns:1fr}.archive-avatar{width:96px;height:96px}.archive-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}
</style>`;

const [mysticalCatalog, profilePhotos, roomPhotos, rooms] = await Promise.all([
  readFile(mysticalRoomsFile, "utf8").then(JSON.parse),
  readFile(profilePhotosFile, "utf8").then(JSON.parse),
  readFile(roomPhotosFile, "utf8").then(JSON.parse),
  readFile(roomsFile, "utf8").then(JSON.parse),
]);
const roomMetadata = new Map(rooms.map((room) => [roomSlug(room), room]));
const roomGallery = new Map();
for (const photo of roomPhotos) {
  if (!photo.roomSlug || !photo.imageUrl) continue;
  const current = roomGallery.get(photo.roomSlug) || [];
  current.push(photo.imageUrl);
  roomGallery.set(photo.roomSlug, unique(current));
}
const profilePhotoUrls = unique(profilePhotos.filter((photo) => photo.username === "Mystical.....").map((photo) => photo.imageUrl));
const linkedRooms = (mysticalCatalog.rooms || []).filter((room) => roomSlug(room));
const roomCards = linkedRooms.map((room) => {
  const slug = roomSlug(room);
  const metadata = roomMetadata.get(slug);
  const description = metadata?.description || room.description || "Public room/game link from the Mystical..... profile.";
  const creator = metadata?.creatorUsername || "Not available in captured metadata";
  return `<a class="archive-room-link" href="../../room/${encodeURIComponent(slug)}/"><strong>${escapeHtml(metadata?.title || slug)}</strong><span>${escapeHtml(description)}</span><small>@${escapeHtml(creator)}</small></a>`;
}).join("");
const profilePhotoCards = profilePhotoUrls.map((url, index) => `<a class="archive-photo-card" href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><img loading="lazy" src="${escapeHtml(url)}" alt="Mystical..... public photo ${index + 1}"><span>Public photo ${index + 1}</span></a>`).join("");
const profileHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DJ Mystic @Mystical..... · DreamRec archive</title>${roomDetailsStyle}</head><body class="archive-profile-shell"><main class="archive-profile"><nav class="archive-back"><a href="../../">Back to DreamRec archive</a><a href="https://recroom.network/user/Mystical.....">Original public profile</a></nav><section class="archive-profile-card"><img class="archive-avatar" src="https://img.recroom.network/52rwyz4ab7j2miz617ryanmkz?cropSquare=true&amp;width=192&amp;height=192" alt="Mystical..... avatar"><div><h1>DJ Mystic</h1><p class="profile-kicker">@Mystical..... · Public profile archive</p><p class="archive-bio">Rec Room public profile captured from the supplied public URL.</p><div class="archive-stat-grid"><div class="archive-stat"><strong>474</strong><span>Subscribers</span></div><div class="archive-stat"><strong>August 02 2022</strong><span>Joined</span></div><div class="archive-stat"><strong>${linkedRooms.length}</strong><span>Public rooms</span></div><div class="archive-stat"><strong>${profilePhotoUrls.length}</strong><span>Public photos</span></div></div></div></section><h2>Public rooms and games</h2><div class="archive-room-list">${roomCards}</div><h2>Public photos</h2><div class="archive-photo-grid">${profilePhotoCards}</div><p class="archive-note">This read-only page contains publicly accessible references captured from the supplied profile URL. Items not exposed by the public page are not inferred.</p></main></body></html>`;
const profileDir = join(archiveDir, "user", "Mystical.....");
await mkdir(profileDir, { recursive: true });
await writeFile(join(profileDir, "index.html"), profileHtml, "utf8");

for (const room of linkedRooms) {
  const slug = roomSlug(room);
  const metadata = roomMetadata.get(slug) || {};
  const gallery = unique([...(roomGallery.get(slug) || []), metadata.coverUrl]);
  const photos = gallery.map((url, index) => `<a class="archive-photo-card" href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(slug)} public room image ${index + 1}"><span>Public room image ${index + 1}</span></a>`).join("");
  const tags = (metadata.tags || []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("");
  const creator = metadata.creatorUsername || "Not available in captured metadata";
  const description = metadata.description || room.description || "Public room information was not included in the captured metadata.";
  const metadataItems = [["Creator", `@${creator}`],["Published", metadata.publishedAt || "Not available in captured metadata"],["Visits", metadata.visitCount ? Number(metadata.visitCount).toLocaleString() : "Not available in captured metadata"],["Cheers", metadata.cheerCount ? Number(metadata.cheerCount).toLocaleString() : "Not available in captured metadata"],["Capacity", metadata.capacity || "Not available in captured metadata"],["Platforms", metadata.platforms || "Not available in captured metadata"]].map(([label, value]) => `<div class="archive-metadata-item"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
  const roomHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(slug)} · DreamRec archive</title>${roomDetailsStyle}</head><body class="archive-profile-shell"><main class="archive-room"><nav class="archive-back"><a href="../../user/Mystical...../">Back to Mystical.....</a><a href="../../">DreamRec archive</a><a href="https://recroom.network/room/${encodeURIComponent(slug)}">Original public room</a></nav><section class="archive-room-header"><p class="room-kicker">Public room/game linked from @Mystical.....</p><h1>${escapeHtml(metadata.title || slug)}</h1><p class="archive-bio">${escapeHtml(description)}</p><dl class="archive-metadata-grid">${metadataItems}</dl>${tags ? `<ul class="archive-tags">${tags}</ul>` : ""}</section><h2>Public room image gallery</h2><div class="archive-photo-grid">${photos || `<p class="archive-note">No public room-photo reference was available in the captured catalog.</p>`}</div><p class="archive-note">Metadata is shown only when available in the captured public room catalog. Room links and images are read-only archive references.</p></main></body></html>`;
  const roomDir = join(archiveDir, "room", encodeURIComponent(slug));
  await mkdir(roomDir, { recursive: true });
  await writeFile(join(roomDir, "index.html"), roomHtml, "utf8");
}
console.log(`Rebuilt Mystical..... profile and ${linkedRooms.length} linked room pages with shared CSS, metadata, and galleries.`);
