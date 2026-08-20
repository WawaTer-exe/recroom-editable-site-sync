import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join, normalize, posix } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = new URL("https://recroom.network/");
const allowedHosts = new Set(["recroom.network", "cdn.recroom.network", "img.recroom.network"]);
const outputDir = join(process.cwd(), "dist-archive");
const manifestPath = join(process.cwd(), "archive/routes.txt");
const maxRoutes = Number(process.env.ARCHIVE_MAX_ROUTES || 2500);
const maxAssets = Number(process.env.ARCHIVE_MAX_ASSETS || 5000);
const basePath = (process.env.ARCHIVE_BASE_PATH || "").replace(/\/$/, "");
const timeoutMs = Number(process.env.ARCHIVE_TIMEOUT_MS || 8000);

const fetchedRoutes = new Set();
const discoveredRoutes = new Map();
const downloadedAssets = new Set();
const failures = [];
const assetJobs = [];

function cleanPath(pathname) {
  const value = pathname.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (value === "/") return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function routeFile(url) {
  const pathname = cleanPath(url.pathname);
  return pathname === "/" ? join(outputDir, "index.html") : join(outputDir, pathname.slice(1), "index.html");
}

function assetFile(url) {
  const safeHost = url.hostname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const raw = url.pathname.replace(/^\/+/, "") || "index";
  const clean = normalize(raw).replace(/^\.\.(?:[\\/]|$)/g, "_");
  return join(outputDir, "_external", safeHost, clean);
}

function assetPublicPath(url) {
  const target = assetFile(url);
  return `${basePath}/${target.slice(outputDir.length + 1).split("\\").join("/")}`;
}

function routePublicPath(url) {
  const pathname = cleanPath(url.pathname);
  return `${basePath}${pathname}`;
}

function absoluteUrl(value, base) {
  try {
    const url = new URL(value, base);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

function extractReferences(html, base) {
  const refs = new Map();
  const pattern = /(?:href|src|srcset)=["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html))) {
    for (const part of match[1].split(",")) {
      const candidate = part.trim().split(/\s+/)[0];
      const url = absoluteUrl(candidate, base);
      if (url && allowedHosts.has(url.hostname)) refs.set(url.href, candidate);
    }
  }
  return refs;
}

function replaceAttributeReference(html, rawReference, marker) {
  const escaped = rawReference.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const pattern = new RegExp(`((?:href|src|srcset)\\s*=\\s*[\\\"'])${escaped}(?=(?:[\\\"']|\\s))`, "g");
  return html.replace(pattern, `$1${marker}`);
}

function routeFromUrl(url) {
  if (url.hostname !== root.hostname) return null;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/login")) return null;
  if (/\.(?:png|jpe?g|gif|webp|svg|ico|css|js|woff2?|ttf|map|json|mp4|webm|zip)$/i.test(url.pathname)) return null;
  return cleanPath(url.pathname);
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs + 250));
  try {
    return await Promise.race([fetch(url, { ...init, signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url) {
  const response = await fetchWithTimeout(url, { redirect: "follow", headers: { "user-agent": "recroom-network-public-archive/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return { response, text: await response.text() };
}

function downloadAsset(url) {
  if (downloadedAssets.has(url.href) || downloadedAssets.size >= maxAssets) return;
  downloadedAssets.add(url.href);
  assetJobs.push((async () => {
    const target = assetFile(url);
    try {
      await mkdir(dirname(target), { recursive: true });
      const response = await fetchWithTimeout(url, { redirect: "follow", headers: { "user-agent": "recroom-network-public-archive/1.0" } });
      if (!response.ok || !response.body) throw new Error(`${response.status} ${response.statusText}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
    } catch (error) {
      failures.push({ type: "asset", url: url.href, error: String(error) });
    }
  })());
}

async function crawlRoute(pathname, depth) {
  if (fetchedRoutes.has(pathname) || fetchedRoutes.size >= maxRoutes) return;
  fetchedRoutes.add(pathname);
  const url = new URL(pathname, root);
  try {
    const { text } = await fetchText(url);
    const file = routeFile(url);
    await mkdir(dirname(file), { recursive: true });
    let rewritten = text;
    const refs = [...extractReferences(text, url).entries()].sort((a, b) => b[1].length - a[1].length);
    const replacements = [];
    refs.forEach(([ref, rawReference], index) => {
      const refUrl = new URL(ref);
      const nextRoute = routeFromUrl(refUrl);
      const marker = `__ARCHIVE_REFERENCE_${index}__`;
      if (refUrl.hostname === root.hostname && nextRoute) {
        if (depth < 2) discoveredRoutes.set(nextRoute, depth + 1);
        rewritten = replaceAttributeReference(rewritten, rawReference, marker);
        replacements.push([marker, routePublicPath(refUrl)]);
      } else {
        downloadAsset(refUrl);
        rewritten = replaceAttributeReference(rewritten, rawReference, marker);
        replacements.push([marker, assetPublicPath(refUrl)]);
      }
    });
    for (const [marker, replacement] of replacements) rewritten = rewritten.split(marker).join(replacement);
    await writeFile(file, rewritten, "utf8");
  } catch (error) {
    failures.push({ type: "route", url: url.href, error: String(error) });
  }
}

await mkdir(outputDir, { recursive: true });
const initial = (await readFile(manifestPath, "utf8")).split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(value => new URL(value).pathname);
for (const path of initial) discoveredRoutes.set(cleanPath(path), 0);

for (let depth = 0; depth <= 2 && fetchedRoutes.size < maxRoutes; depth += 1) {
  const batch = [...discoveredRoutes.entries()]
    .filter(([path, routeDepth]) => routeDepth === depth && !fetchedRoutes.has(path))
    .slice(0, Math.max(0, maxRoutes - fetchedRoutes.size));
  await Promise.all(batch.map(([path, routeDepth]) => crawlRoute(path, routeDepth)));
}

await Promise.all(assetJobs);
await mkdir(join(outputDir, "_archive"), { recursive: true });
await writeFile(join(outputDir, "_archive", "routes.json"), JSON.stringify([...fetchedRoutes].sort(), null, 2));
await writeFile(join(outputDir, "_archive", "failures.json"), JSON.stringify(failures, null, 2));
await writeFile(join(outputDir, "_archive", "README.txt"), `Static public archive of recroom.network\n\nRoutes captured: ${fetchedRoutes.size}\nPublic assets attempted: ${downloadedAssets.size}\nFailures: ${failures.length}\n\nThis archive contains publicly retrievable pages only. Login-gated, private, deleted, API-only, and live interactive features are not included.\n`);
await writeFile(join(outputDir, ".nojekyll"), "");
await writeFile(join(outputDir, "404.html"), await readFile(join(outputDir, "index.html"), "utf8").catch(() => "<h1>Archive page unavailable</h1>"));
console.log(`Archived ${fetchedRoutes.size} public routes and attempted ${downloadedAssets.size} assets with ${failures.length} failures.`);
