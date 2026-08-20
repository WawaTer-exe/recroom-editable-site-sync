import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const archiveDir = process.argv[2] || "dist-archive";
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
const style = `<style data-archive-ui>.archive-cookie{position:fixed;z-index:9999;left:24px;right:24px;bottom:24px;max-width:760px;margin:auto;background:#fff;color:#4a342d;border:1px solid #c85d35;border-radius:18px;box-shadow:0 12px 36px #0008;padding:24px}.archive-cookie h2{margin:0 0 8px;font-size:22px}.archive-cookie p{margin:0 0 18px;line-height:1.5}.archive-cookie-actions{display:flex;gap:12px;flex-wrap:wrap}.archive-cookie button{border:1px solid #c85d35;background:#ff6a28;color:#fff;border-radius:28px;padding:12px 22px;font-weight:700;cursor:pointer}.archive-cookie button.secondary{background:#fff;color:#b44e29}.archive-cookie-settings{display:none;margin-top:14px;border-top:1px solid #ead4ca;padding-top:14px}.archive-cookie-settings label{display:flex;gap:8px;align-items:center;margin:8px 0}.archive-toast{position:fixed;z-index:10000;right:24px;bottom:24px;background:#292929;color:#fff;padding:12px 16px;border-radius:10px;box-shadow:0 8px 24px #0007}.archive-valart{max-width:1120px;margin:24px auto;padding:24px;background:#292929;border:1px solid #555;border-radius:16px}.archive-valart img{width:100%;max-height:520px;object-fit:cover;border-radius:12px;display:block;margin:0 0 18px}.archive-valart .meta{color:#bbb}.archive-valart .tags{color:#ddd;line-height:1.6}</style>`;
const script = `<script data-archive-ui>(function(){const key='dreamrec-cookie-choice';function toast(text){let t=document.querySelector('.archive-toast');if(!t){t=document.createElement('div');t.className='archive-toast';document.body.appendChild(t)}t.textContent=text;setTimeout(()=>t.remove(),2400)}function close(){document.querySelector('.archive-cookie')?.remove()}function save(choice){try{localStorage.setItem(key,choice)}catch{}close();toast(choice==='accepted'?'Cookies accepted':'Cookies rejected')}function show(){if(localStorage.getItem(key))return;const b=document.createElement('aside');b.className='archive-cookie';b.innerHTML='<h2>Cookies</h2><p>By choosing an option, you control whether this read-only archive stores a small preference on your device to remember your choice. No account or backend is required.</p><div class="archive-cookie-actions"><button data-cookie="accept">Accept All Cookies</button><button class="secondary" data-cookie="reject">Reject All</button><button class="secondary" data-cookie="settings">Cookies Settings</button></div><div class="archive-cookie-settings"><label><input type="checkbox" checked disabled> Necessary preference storage</label><label><input type="checkbox"> Optional analytics preference</label></div>';b.addEventListener('click',e=>{const c=e.target.closest('[data-cookie]')?.dataset.cookie;if(c==='accept')save('accepted');if(c==='reject')save('rejected');if(c==='settings'){const s=b.querySelector('.archive-cookie-settings');s.style.display=s.style.display==='block'?'none':'block'}});document.body.appendChild(b)}function wire(){document.querySelectorAll('button').forEach(btn=>{if(btn.dataset.archiveWired)return;btn.dataset.archiveWired='1';const text=(btn.textContent||'').trim().toLowerCase();if(text==='login')btn.addEventListener('click',()=>toast('Login is unavailable in this read-only archive.'));else if(text.includes('search'))btn.addEventListener('click',()=>toast('Use the Profiles, Rooms, Creator Hub, and Directory links to browse the archive.'));else if(text.includes('download'))btn.addEventListener('click',()=>location.href='/recroom-editable-site-sync/download/');else if(text.includes('settings')||text==='⚙')btn.addEventListener('click',()=>toast('Archive settings are read-only.'))})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{show();wire()});else{show();wire()}new MutationObserver(wire).observe(document.documentElement,{subtree:true,childList:true})})();</script>`;
for (const file of await walk(archiveDir)) {
  if (!file.endsWith("index.html")) continue;
  let html = await readFile(file, "utf8");
  if (!html.includes("data-archive-ui")) html = html.replace(/<\/head>/i, `${style}</head>`).replace(/<\/body>/i, `${script}</body>`);
  const route = file.replaceAll("\\", "/");
  if (route.endsWith("/room/ValArtAcademy/index.html") && !html.includes("data-archive-valart")) {
    const valart = `<section class="archive-valart" data-archive-valart><img src="https://img.recroom.network/4xhgw1sse2n96exes3ys5b10f?width=1920" alt="ValArtAcademy public room image"><h2>^ValArtAcademy</h2><p class="meta">@InternetCat · Published 8/28/2018 · VR · Capacity 40</p><p>Join your friends and create art together! RR’s oldest active art community, established in 2018. Check the public room page for the archived community description and room activity.</p><p class="meta">5,200,000 visits · 56,928 cheers</p><p class="tags">#hangout #art #beta #draw #fun #casual #creative</p></section>`;
    html = html.replace(/<\/body>/i, `${valart}</body>`);
  }
  await writeFile(file, html, "utf8");
}
const valartDir = join(archiveDir, "room", "ValArtAcademy");
const valartFile = join(valartDir, "index.html");
try { await readFile(valartFile, "utf8"); } catch {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(valartDir, { recursive: true });
  const valart = `<section class="archive-valart" data-archive-valart><img src="https://img.recroom.network/4xhgw1sse2n96exes3ys5b10f?width=1920" alt="ValArtAcademy public room image"><h2>^ValArtAcademy</h2><p class="meta">@InternetCat · Published 8/28/2018 · VR · Capacity 40</p><p>Join your friends and create art together! RR’s oldest active art community, established in 2018. Check the public room page for the archived community description and room activity.</p><p class="meta">5,200,000 visits · 56,928 cheers</p><p class="tags">#hangout #art #beta #draw #fun #casual #creative</p></section>`;
  const valartHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ValArtAcademy · DreamRec archive</title>${style}</head><body><main class="archive-room"><p><a href="../../">Back to DreamRec archive</a></p><h1>ValArtAcademy</h1><p class="meta">Public room detail archived from recroom.network.</p>${valart}<p><a href="https://recroom.network/room/ValArtAcademy">Original public room page</a></p></main>${script}</body></html>`;
  await writeFile(valartFile, valartHtml, "utf8");
}
console.log("Applied archive UI, cookie consent, functional-control handlers, and ValArtAcademy detail block.");
