import fs from "node:fs";
import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { directorySections, navigationItems, profilePhotos, profiles, roomPhotos, rooms, siteSettings } from "../drizzle/schema";

type SeedProfile = {
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  joinedAt?: string | null;
  subscriberCount?: number;
  featured?: boolean;
};
type SeedPhoto = { username: string; imageId?: string; imageUrl: string; caption?: string | null; sortOrder?: number };
type SeedRoom = { slug: string; title: string; description?: string | null; coverUrl?: string | null; creatorUsername?: string | null; cheerCount?: number; visitCount?: number; publishedAt?: string | null; capacity?: number; platforms?: string | null; tags?: string[] };

function loadJson<T>(filename: string, fallback: T): T {
  const file = path.resolve(process.cwd(), "seed", filename);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) as T : fallback;
}
function cleanImageUrl(value: string) {
  return value.replaceAll("&amp;", "&").replace(/[\\\"]+$/g, "");
}
function dateOrNull(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function main() {
  const seedProfiles = loadJson<SeedProfile[]>("profiles_api_enriched.json", loadJson<SeedProfile[]>("profiles_enriched.json", loadJson<SeedProfile[]>("profiles.json", [])));
  const oldPhotos = loadJson<SeedPhoto[]>("profile_photos.json", []);
  const livePhotos = loadJson<SeedPhoto[]>("profile_photos_live_full.json", []);
  const seedPhotos = [...oldPhotos, ...livePhotos]
    .map(photo => ({ ...photo, imageUrl: cleanImageUrl(photo.imageUrl) }))
    .filter(photo => photo.imageUrl && !photo.imageUrl.includes("cropSquare") && !photo.imageUrl.includes("DefaultProfileImage"));
  const seedRooms = loadJson<SeedRoom[]>("rooms_live.json", []);
  const seedRoomPhotos = loadJson<Array<{ roomSlug: string; imageUrl: string; caption?: string | null; sortOrder?: number }>>("room_photos_live.json", []);
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is unavailable");

  for (const profile of seedProfiles) {
    await db.insert(profiles).values({
      username: profile.username,
      displayName: profile.displayName || profile.username,
      bio: profile.bio ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      bannerUrl: profile.bannerUrl ?? null,
      joinedAt: dateOrNull(profile.joinedAt),
      subscriberCount: profile.subscriberCount ?? 0,
      featured: profile.featured ?? false,
    }).onDuplicateKeyUpdate({
      set: {
        displayName: sql`VALUES(displayName)`, bio: sql`VALUES(bio)`, avatarUrl: sql`VALUES(avatarUrl)`, bannerUrl: sql`VALUES(bannerUrl)`,
        joinedAt: sql`VALUES(joinedAt)`, subscriberCount: sql`VALUES(subscriberCount)`, featured: sql`VALUES(featured)`,
      },
    });
  }

  for (const photo of seedPhotos) {
    const profile = (await db.select().from(profiles).where(eq(profiles.username, photo.username)).limit(1))[0];
    if (!profile) continue;
    const existing = await db.select().from(profilePhotos).where(eq(profilePhotos.profileId, profile.id));
    if (!existing.some(item => item.imageUrl === photo.imageUrl)) {
      await db.insert(profilePhotos).values({ profileId: profile.id, imageUrl: photo.imageUrl, caption: photo.caption ?? (photo.imageId ? `Recovered public photo ${photo.imageId}` : null), sortOrder: photo.sortOrder ?? existing.length });
    }
  }

  for (const room of seedRooms) {
    await db.insert(rooms).values({
      slug: room.slug, title: room.title || room.slug, description: room.description ?? null, coverUrl: room.coverUrl ?? null,
      creatorUsername: room.creatorUsername ?? null, visitCount: room.visitCount ?? 0, publishedAt: dateOrNull(room.publishedAt),
      capacity: room.capacity ?? 0, platforms: room.platforms ?? null, tags: room.tags?.length ? JSON.stringify(room.tags) : null,
      playerCount: 0, cheerCount: room.cheerCount ?? 0, featured: true,
    }).onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(title)`, description: sql`VALUES(description)`, coverUrl: sql`VALUES(coverUrl)`, creatorUsername: sql`VALUES(creatorUsername)`,
        visitCount: sql`VALUES(visitCount)`, publishedAt: sql`VALUES(publishedAt)`, capacity: sql`VALUES(capacity)`, platforms: sql`VALUES(platforms)`,
        tags: sql`VALUES(tags)`, cheerCount: sql`VALUES(cheerCount)`, featured: sql`VALUES(featured)`,
      },
    });
    const savedRoom = (await db.select().from(rooms).where(eq(rooms.slug, room.slug)).limit(1))[0];
    if (savedRoom) {
      const existingPhotos = await db.select().from(roomPhotos).where(eq(roomPhotos.roomId, savedRoom.id));
      for (const photo of seedRoomPhotos.filter(item => item.roomSlug === room.slug)) {
        const imageUrl = cleanImageUrl(photo.imageUrl);
        if (!imageUrl || existingPhotos.some(item => item.imageUrl === imageUrl)) continue;
        await db.insert(roomPhotos).values({ roomId: savedRoom.id, imageUrl, caption: photo.caption ?? room.title, sortOrder: photo.sortOrder ?? existingPhotos.length });
        existingPhotos.push({ id: -1, roomId: savedRoom.id, imageUrl, caption: photo.caption ?? room.title, sortOrder: photo.sortOrder ?? existingPhotos.length, createdAt: new Date() });
      }
    }
  }

  const existingSettings = await db.select().from(siteSettings).limit(1);
  if (!existingSettings.length) await db.insert(siteSettings).values({ id: 1, announcementText: "This website is a community tribute to Rec Room built by Studio 87. If you would like to learn more about what we've been working on, please join our Discord community at discord.gg/studio87 for the latest details and sneak peeks 👀 Rec Room Baby 🎸", announcementLink: "https://discord.gg/studio87", announcementVisible: true, featuredRoomSlugs: JSON.stringify(["ValArtAcademy", "RecRoomGallery", "MakerPenClassQandA", "rp_unioncity", "ArmadiIIoPVP"]) });

  const nav = [["Home", "/", 0], ["Profiles", "/profiles", 1], ["Rooms", "/rooms", 2], ["Blog", "/blog", 3], ["Directory", "/directory", 4]] as const;
  for (const [label, href, sortOrder] of nav) {
    const existing = await db.select().from(navigationItems).where(and(eq(navigationItems.label, label), eq(navigationItems.href, href))).limit(1);
    if (!existing.length) await db.insert(navigationItems).values({ label, href, sortOrder, visible: true });
  }
  const sections = [["Profiles", "Browse public community profiles", "/profiles", 0], ["Rooms", "Explore rooms and featured spaces", "/rooms", 1], ["Blog", "News, updates, and creator stories", "/blog", 2]] as const;
  for (const [title, description, href, sortOrder] of sections) {
    const existing = await db.select().from(directorySections).where(and(eq(directorySections.title, title), eq(directorySections.href, href))).limit(1);
    if (!existing.length) await db.insert(directorySections).values({ title, description, href, sortOrder, visible: true });
  }
  console.log(JSON.stringify({ seededProfiles: seedProfiles.length, seededPhotos: seedPhotos.length, seededRooms: seedRooms.length, seededRoomPhotos: seedRoomPhotos.length, navigation: nav.length, directorySections: sections.length, requestedRooms: ["ValArtAcademy", "RecRoomGallery", "MakerPenClassQandA", "rp_unioncity", "ArmadiIIoPVP"].length }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
