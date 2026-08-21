import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const archiveDir = process.argv[2] || "dist-archive";
const userDir = join(archiveDir, "user");
const logoUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663865592103/EDVDILXKnPoqWewI.png";
const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

const style = `<style data-universal-profile-layout>
:root{color-scheme:dark}
html,body{margin:0;background:#191919;color:#f6f4f2;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body.archive-universal-profile{min-height:100vh;overflow-x:hidden}
.archive-universal-topbar{height:172px;box-sizing:border-box;background:#191919;border-bottom:1px solid #454545;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 7vw;gap:28px}
.archive-universal-logo{justify-self:start;display:block;width:78px;height:78px;object-fit:contain;filter:saturate(1.1)}
.archive-universal-actions{display:flex;align-items:center;justify-content:flex-end;gap:38px}
.archive-universal-search{font-size:54px;line-height:1;color:#fff;text-decoration:none;font-family:Arial,sans-serif;transform:rotate(-18deg);display:inline-block}
.archive-universal-login{min-width:160px;padding:18px 28px;border:2px solid #87503d;border-radius:20px;color:#ff7950;text-decoration:none;text-align:center;font-size:24px;font-weight:700}
.archive-universal-download{font-size:54px;line-height:1;color:#fff;text-decoration:none;font-family:Arial,sans-serif}
.archive-universal-profile-shell{max-width:1125px;margin:0 auto;padding:68px 50px 86px;box-sizing:border-box}
.archive-universal-profile-shell h1{font-size:clamp(44px,7vw,72px);line-height:1.04;margin:0 0 18px;color:#fff;letter-spacing:-.04em}
.archive-universal-profile-shell h2{font-size:28px;line-height:1.15;margin:42px 0 18px;color:#fff}
.archive-universal-profile-shell p{font-size:22px;line-height:1.45;color:#f0eeec}
.archive-universal-profile-shell a{color:#ff7950}
.archive-universal-profile-shell .archive-profile-card,.archive-universal-profile-shell .archive-card,.archive-universal-profile-shell .shirt-card{display:grid;grid-template-columns:170px 1fr;gap:28px;align-items:center;background:transparent;border:0;border-radius:0;padding:0;box-shadow:none}
.archive-universal-profile-shell .archive-avatar,.archive-universal-profile-shell .shirt-avatar{width:170px;height:170px;border-radius:50%;object-fit:cover;border:3px solid #ff6a28;background:#333}
.archive-universal-profile-shell .archive-stat-grid,.archive-universal-profile-shell .archive-stats,.archive-universal-profile-shell .shirt-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:28px}
.archive-universal-profile-shell .archive-stat,.archive-universal-profile-shell .archive-stat,.archive-universal-profile-shell .shirt-stat{background:#2a2a2a;border:1px solid #525252;border-radius:12px;padding:14px}
.archive-universal-profile-shell .archive-stat strong,.archive-universal-profile-shell .shirt-stat strong{display:block;color:#fff;font-size:22px}
.archive-universal-profile-shell .archive-stat span,.archive-universal-profile-shell .shirt-stat span{display:block;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-top:4px}
.archive-universal-profile-shell .archive-room-list,.archive-universal-profile-shell .archive-room-grid,.archive-universal-profile-shell .shirt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.archive-universal-profile-shell .archive-room-link,.archive-universal-profile-shell .archive-room-link,.archive-universal-profile-shell .shirt-room{display:block;overflow:hidden;background:#242424;border:1px solid #4e4e4e;border-radius:12px;color:#fff!important;text-decoration:none;transition:transform .16s ease,border-color .16s ease}
.archive-universal-profile-shell .archive-room-link:hover,.archive-universal-profile-shell .shirt-room:hover{transform:translateY(-2px);border-color:#ff7950}
.archive-universal-profile-shell .archive-room-thumb,.archive-universal-profile-shell .archive-room-link img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#303030}
.archive-universal-profile-shell .archive-room-copy{display:flex;flex-direction:column;gap:7px;padding:16px;font-size:16px}
.archive-universal-profile-shell .archive-room-copy strong{font-size:22px;color:#fff}
.archive-universal-profile-shell .archive-room-copy span{color:#d5d0cc}
.archive-universal-profile-shell .archive-room-copy small,.archive-universal-profile-shell .archive-room-stats,.archive-universal-profile-shell .shirt-room small{color:#ff9a70;font-size:13px}
.archive-universal-profile-shell .archive-photo-grid,.archive-universal-profile-shell .archive-photo-grid,.archive-universal-profile-shell .shirt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.archive-universal-profile-shell .archive-photo-card,.archive-universal-profile-shell .archive-photo,.archive-universal-profile-shell .shirt-photo{display:block;overflow:hidden;background:#242424;border:1px solid #454545;border-radius:12px;color:#fff!important;text-decoration:none}
.archive-universal-profile-shell .archive-photo-card img,.archive-universal-profile-shell .archive-photo img,.archive-universal-profile-shell .shirt-photo img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:#303030}
.archive-universal-profile-shell .archive-photo-card span,.archive-universal-profile-shell .archive-photo span,.archive-universal-profile-shell .shirt-photo span{display:block;padding:10px 12px;color:#ccc;font-size:13px}
.archive-universal-profile-shell .archive-metadata-grid,.archive-universal-profile-shell .archive-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:26px 0}
.archive-universal-profile-shell .archive-metadata-item,.archive-universal-profile-shell .archive-meta-item{background:#242424;border:1px solid #4e4e4e;border-radius:12px;padding:14px}
.archive-universal-profile-shell .archive-metadata-item dt,.archive-universal-profile-shell .archive-meta-item dt{color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
.archive-universal-profile-shell .archive-metadata-item dd,.archive-universal-profile-shell .archive-meta-item dd{margin:4px 0 0;color:#fff;font-size:18px;font-weight:700}
.archive-universal-profile-shell .archive-tags{display:flex;flex-wrap:wrap;gap:10px;padding:0;margin:20px 0;list-style:none}
.archive-universal-profile-shell .archive-tags li{background:#3a2a24;color:#ffb08c;border:1px solid #75432e;border-radius:999px;padding:8px 14px;font-size:15px}
.archive-universal-profile-shell .archive-cover{display:block;width:100%;max-height:none;object-fit:cover;border-radius:12px;margin:26px 0}
.archive-universal-profile-shell .archive-back,.archive-universal-profile-shell .shirt-back{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:34px;font-size:15px}
.archive-universal-profile-shell .archive-note{color:#aaa;font-size:14px}
@media(max-width:700px){.archive-universal-topbar{height:172px;padding:0 40px;grid-template-columns:1fr auto 1fr;gap:10px}.archive-universal-logo{width:84px;height:84px}.archive-universal-actions{gap:26px}.archive-universal-search,.archive-universal-download{font-size:48px}.archive-universal-login{min-width:110px;padding:16px 18px;font-size:21px}.archive-universal-profile-shell{padding:68px 50px 80px}.archive-universal-profile-shell .archive-profile-card,.archive-universal-profile-shell .archive-card,.archive-universal-profile-shell .shirt-card{grid-template-columns:1fr;gap:22px}.archive-universal-profile-shell .archive-avatar,.archive-universal-profile-shell .shirt-avatar{width:128px;height:128px}.archive-universal-profile-shell .archive-stat-grid,.archive-universal-profile-shell .archive-stats,.archive-universal-profile-shell .shirt-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.archive-universal-profile-shell .archive-room-list,.archive-universal-profile-shell .archive-room-grid,.archive-universal-profile-shell .shirt-grid{grid-template-columns:1fr}.archive-universal-profile-shell h1{font-size:48px}.archive-universal-profile-shell p{font-size:20px}}
</style>`;

const topbar = `<header class="archive-universal-topbar"><a href="../../" aria-label="DreamRec home"><img class="archive-universal-logo" src="${logoUrl}" alt="DreamRec"></a><span></span><nav class="archive-universal-actions" aria-label="Profile actions"><a class="archive-universal-search" href="../../" aria-label="Search archive">⌕</a><a class="archive-universal-login" href="../../" aria-label="Login unavailable in read-only archive">Login</a><a class="archive-universal-download" href="../../download/" aria-label="Download">↓</a></nav></header>`;

const dirs = await readdir(userDir, { withFileTypes: true });
let updated = 0;
for (const entry of dirs) {
  if (!entry.isDirectory()) continue;
  const file = join(userDir, entry.name, "index.html");
  let html;
  try { html = await readFile(file, "utf8"); } catch { continue; }
  if (html.includes("data-universal-profile-layout")) continue;
  html = html.replace(/<body([^>]*)>/i, '<body$1 class="archive-universal-profile">');
  html = html.replace(/<body([^>]*)class="([^"]*)"([^>]*)>/i, '<body$1class="$2 archive-universal-profile"$3>');
  html = html.replace(/<body[^>]*>/i, (match) => `${match}${topbar}`);
  html = html.replace(/<main([^>]*)>/i, '<div class="archive-universal-profile-shell"><main$1>');
  html = html.replace(/<\/main>/i, '</main></div>');
  html = html.replace(/<\/head>/i, `${style}</head>`);
  await writeFile(file, html, "utf8");
  updated += 1;
}
console.log(`Applied the shared reference-style profile layout to ${updated} archived profile routes.`);
