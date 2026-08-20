import fs from "node:fs";
import path from "node:path";
import { bulkImportRooms, getSiteSettings, updateSyncStatus } from "./db";

const DIRECTORY_URL = "https://recroom.network/rooms";

export function discoverRoomSlugs(html: string) {
  const slugs = new Set<string>();
  const hrefPattern = /(?:href|data-href)=["']\/room\/([A-Za-z0-9._-]+)["']/g;
  const absolutePattern = /https:\/\/recroom\.network\/room\/([A-Za-z0-9._-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html))) slugs.add(match[1]);
  while ((match = absolutePattern.exec(html))) slugs.add(match[1]);
  return Array.from(slugs);
}

export async function runPublicRoomSync() {
  const startedAt = new Date();
  await updateSyncStatus({ syncLastRunAt: startedAt, syncLastStatus: "running", syncLastError: null });
  try {
    const response = await fetch(DIRECTORY_URL, { headers: { "user-agent": "RecRoomEditableSite public-room-sync/1.0" } });
    if (!response.ok) throw new Error(`Directory request failed with HTTP ${response.status}`);
    const html = await response.text();
    const slugs = discoverRoomSlugs(html);
    const items = slugs.map(slug => ({ slug, title: slug, description: null, coverUrl: null, creatorUsername: null, cheerCount: 0, visitCount: 0, publishedAt: null, capacity: 0, platforms: null, tags: [] as string[], photoUrls: [] as string[], preserveExisting: true }));
    const result = items.length ? await bulkImportRooms(items) : { imported: 0, photosImported: 0 };
    await updateSyncStatus({ syncLastStatus: "success", syncLastError: null, syncLastImported: result.imported, syncLastPhotos: result.photosImported });
    return { ...result, discovered: slugs.length, source: DIRECTORY_URL };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateSyncStatus({ syncLastStatus: "error", syncLastError: message, syncLastImported: 0, syncLastPhotos: 0 });
    throw error;
  }
}

export function getBundledRoomCatalog() {
  const file = path.resolve(process.cwd(), "seed/rooms_live.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) as unknown[] : [];
}

export async function scheduledPublicRoomSync(taskUid: string) {
  const settings = await getSiteSettings();
  if (!settings.scheduleCronTaskUid || settings.scheduleCronTaskUid !== taskUid || !settings.syncEnabled) return { skipped: "orphan-or-disabled" };
  return runPublicRoomSync();
}
