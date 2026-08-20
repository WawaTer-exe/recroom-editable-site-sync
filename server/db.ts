import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  blogPosts,
  directorySections,
  navigationItems,
  profilePhotos,
  roomPhotos,
  mediaAssets,
  managedAccounts,
  profiles,
  rooms,
  siteSettings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listProfiles(query?: string) {
  const db = await getDb(); if (!db) return [];
  if (!query?.trim()) return db.select().from(profiles).orderBy(desc(profiles.featured), asc(profiles.username));
  const q = `%${query.trim()}%`;
  return db.select().from(profiles).where(or(like(profiles.username, q), like(profiles.displayName, q))).orderBy(asc(profiles.username));
}
export async function getProfileByUsername(username: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1); return result[0];
}
export async function listProfilePhotos(profileId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(profilePhotos).where(eq(profilePhotos.profileId, profileId)).orderBy(asc(profilePhotos.sortOrder), desc(profilePhotos.createdAt));
}
export async function listPhotoActivity(limit = 100) {
  const db = await getDb(); if (!db) return [];
  return db.select({ photo: profilePhotos, profile: profiles }).from(profilePhotos).innerJoin(profiles, eq(profilePhotos.profileId, profiles.id)).orderBy(desc(profilePhotos.createdAt), asc(profilePhotos.sortOrder)).limit(limit);
}
export async function listRooms() { const db = await getDb(); return db ? db.select().from(rooms).orderBy(desc(rooms.featured), desc(rooms.visitCount), desc(rooms.playerCount)) : []; }
export async function getSiteSettings() {
  const db = await getDb();
  if (!db) return { id: 1, announcementText: "This website is a community tribute to Rec Room built by Studio 87.", announcementLink: "https://discord.gg/studio87", announcementVisible: true, featuredRoomSlugs: '["Paintball","MyLittleMonsters","RunTheBlock"]', scheduleCronTaskUid: null, syncEnabled: false, syncCron: "0 */30 * * * *", syncLastRunAt: null, syncLastStatus: null, syncLastError: null, syncLastImported: 0, syncLastPhotos: 0 };
  const rows = await db.select().from(siteSettings).limit(1);
  return rows[0] ?? { id: 1, announcementText: "This website is a community tribute to Rec Room built by Studio 87.", announcementLink: "https://discord.gg/studio87", announcementVisible: true, featuredRoomSlugs: '["Paintball","MyLittleMonsters","RunTheBlock"]', scheduleCronTaskUid: null, syncEnabled: false, syncCron: "0 */30 * * * *", syncLastRunAt: null, syncLastStatus: null, syncLastError: null, syncLastImported: 0, syncLastPhotos: 0 };
}
export async function updateSyncStatus(data: { syncEnabled?: boolean; syncCron?: string; scheduleCronTaskUid?: string | null; syncLastRunAt?: Date | null; syncLastStatus?: string | null; syncLastError?: string | null; syncLastImported?: number; syncLastPhotos?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(siteSettings).limit(1);
  if (existing[0]) await db.update(siteSettings).set(data).where(eq(siteSettings.id, existing[0].id));
  else await db.insert(siteSettings).values({ id: 1, announcementText: "Rec Room Community", featuredRoomSlugs: "[]", ...data });
  return true;
}

export async function updateSiteSettings(data: { announcementText: string; announcementLink?: string | null; announcementVisible: boolean; featuredRoomSlugs: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(siteSettings).limit(1);
  if (existing[0]) await db.update(siteSettings).set(data).where(eq(siteSettings.id, existing[0].id));
  else await db.insert(siteSettings).values({ id: 1, ...data });
  return true;
}
export async function listRoomPhotos(roomId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(roomPhotos).where(eq(roomPhotos.roomId, roomId)).orderBy(asc(roomPhotos.sortOrder), desc(roomPhotos.createdAt));
}
export async function listBlogPosts() { const db = await getDb(); return db ? db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishDate), desc(blogPosts.createdAt)) : []; }
export async function listNavigation() { const db = await getDb(); return db ? db.select().from(navigationItems).where(eq(navigationItems.visible, true)).orderBy(asc(navigationItems.sortOrder)) : []; }
export async function listDirectorySections() { const db = await getDb(); return db ? db.select().from(directorySections).where(eq(directorySections.visible, true)).orderBy(asc(directorySections.sortOrder)) : []; }

export async function createMediaAsset(data: { fileKey: string; url: string; filename: string; mimeType?: string | null; sizeBytes?: number | null; uploadedBy: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(mediaAssets).values(data);
  return true;
}

export async function listMediaAssets() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
}
export async function deleteMediaAsset(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return true;
}
export async function getManagedAccountByUsername(username: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(managedAccounts).where(eq(managedAccounts.username, username)).limit(1);
  return result[0];
}
export async function getManagedAccountById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(managedAccounts).where(eq(managedAccounts.id, id)).limit(1);
  return result[0];
}
export async function listManagedAccounts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: managedAccounts.id, username: managedAccounts.username, displayName: managedAccounts.displayName, avatarUrl: managedAccounts.avatarUrl, role: managedAccounts.role, active: managedAccounts.active, createdAt: managedAccounts.createdAt }).from(managedAccounts).orderBy(asc(managedAccounts.username));
}
export async function createManagedAccount(data: { username: string; displayName: string; passwordHash: string; avatarUrl?: string | null; role?: "user" | "admin" }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(managedAccounts).values(data);
  return true;
}
export async function deleteManagedAccount(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(managedAccounts).where(eq(managedAccounts.id, id));
  return true;
}

export async function adminList(kind: "profiles" | "rooms" | "blogPosts" | "navigationItems" | "directorySections") {
  const db = await getDb(); if (!db) return [];
  if (kind === "profiles") return db.select().from(profiles).orderBy(asc(profiles.username));
  if (kind === "rooms") return db.select().from(rooms).orderBy(asc(rooms.title));
  if (kind === "blogPosts") return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  if (kind === "navigationItems") return db.select().from(navigationItems).orderBy(asc(navigationItems.sortOrder));
  return db.select().from(directorySections).orderBy(asc(directorySections.sortOrder));
}

export type BulkRoomInput = { slug: string; title: string; description?: string | null; coverUrl?: string | null; creatorUsername?: string | null; cheerCount?: number; visitCount?: number; publishedAt?: string | null; capacity?: number; platforms?: string | null; tags?: string[]; photoUrls?: string[]; preserveExisting?: boolean };

export async function bulkImportRooms(items: BulkRoomInput[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  let photosImported = 0;
  for (const room of items) {
    const existing = (await db.select().from(rooms).where(eq(rooms.slug, room.slug)).limit(1))[0];
    const preserve = room.preserveExisting && existing;
    const title = preserve && existing.title ? existing.title : room.title;
    const description = preserve ? (room.description || existing.description || null) : (room.description ?? null);
    const coverUrl = preserve ? (room.coverUrl || existing.coverUrl || null) : (room.coverUrl ?? null);
    const creatorUsername = preserve ? (room.creatorUsername || existing.creatorUsername || null) : (room.creatorUsername ?? null);
    const cheerCount = preserve && !room.cheerCount ? existing.cheerCount : (room.cheerCount ?? 0);
    const visitCount = preserve && !room.visitCount ? existing.visitCount : (room.visitCount ?? 0);
    const publishedAt = preserve ? (room.publishedAt ? new Date(room.publishedAt) : existing.publishedAt) : (room.publishedAt ? new Date(room.publishedAt) : null);
    const capacity = preserve && !room.capacity ? existing.capacity : (room.capacity ?? 0);
    const platforms = preserve ? (room.platforms || existing.platforms || null) : (room.platforms ?? null);
    const tags = preserve ? (room.tags?.length ? JSON.stringify(room.tags) : existing.tags) : (room.tags?.length ? JSON.stringify(room.tags) : null);
    await db.insert(rooms).values({ slug: room.slug, title, description, coverUrl, creatorUsername, cheerCount, visitCount, publishedAt, capacity, platforms, tags, playerCount: existing?.playerCount ?? 0, featured: existing?.featured ?? false }).onDuplicateKeyUpdate({ set: { title, description, coverUrl, creatorUsername, cheerCount, visitCount, publishedAt, capacity, platforms, tags } });
    const saved = (await db.select().from(rooms).where(eq(rooms.slug, room.slug)).limit(1))[0];
    if (!saved) continue;
    const existingPhotos = await db.select().from(roomPhotos).where(eq(roomPhotos.roomId, saved.id));
    const photoUrls = room.photoUrls ?? [];
    for (let index = 0; index < photoUrls.length; index += 1) {
      const url = photoUrls[index];
      if (!url || existingPhotos.some(photo => photo.imageUrl === url)) continue;
      await db.insert(roomPhotos).values({ roomId: saved.id, imageUrl: url, caption: room.title, sortOrder: index });
      photosImported += 1;
    }
  }
  return { imported: items.length, photosImported };
}

export async function createContent(kind: string, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (kind === "profiles") { await db.insert(profiles).values(data); return true; }
  if (kind === "rooms") { await db.insert(rooms).values(data); return true; }
  if (kind === "blogPosts") { await db.insert(blogPosts).values(data); return true; }
  if (kind === "navigationItems") { await db.insert(navigationItems).values(data); return true; }
  if (kind === "directorySections") { await db.insert(directorySections).values(data); return true; }
  throw new Error("Unsupported content type");
}
export async function updateContent(kind: string, id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const table: any = { profiles, rooms, blogPosts, navigationItems, directorySections }[kind];
  if (!table) throw new Error("Unsupported content type");
  await db.update(table).set(data).where(eq(table.id, id)); return true;
}
export async function deleteContent(kind: string, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const table: any = { profiles, rooms, blogPosts, navigationItems, directorySections }[kind];
  if (!table) throw new Error("Unsupported content type");
  await db.delete(table).where(eq(table.id, id)); return true;
}
