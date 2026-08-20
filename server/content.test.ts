import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const ctx = (role: "admin" | "user") => ({
  user: { id: 1, role, openId: role, name: role, email: `${role}@example.test` },
  req: {} as any,
  res: {} as any,
} as any);

describe("content contracts", () => {
  it("parses the captured profile seed with 167 unique usernames", () => {
    const file = path.resolve(process.cwd(), "seed/profiles.json");
    const profiles = JSON.parse(fs.readFileSync(file, "utf8")) as Array<{ username: string; displayName: string; joinedAt: string }>;
    expect(profiles).toHaveLength(167);
    expect(new Set(profiles.map(profile => profile.username)).size).toBe(167);
    expect(profiles.every(profile => profile.username && profile.displayName && profile.joinedAt)).toBe(true);
  });

  it("allows a public profile read for a seeded user", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    const result = await caller.profiles.byUsername({ username: ".25a" });
    expect(result.profile.username).toBe(".25a");
    expect(result.profile.displayName).toBeTruthy();
  });

  it("allows an admin content listing", async () => {
    const caller = appRouter.createCaller(ctx("admin"));
    const result = await caller.admin.list({ kind: "profiles" });
    expect(result.length).toBeGreaterThanOrEqual(167);
  });

  it("exposes the homepage settings publicly with an ordered featured-room list", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    const settings = await caller.settings.public();
    expect(settings.announcementText).toBeTruthy();
    expect(JSON.parse(settings.featuredRoomSlugs)).toEqual(expect.arrayContaining(["ValArtAcademy", "RecRoomGallery"]));
  });

  it("allows admins to update announcement and featured-room settings", async () => {
    const caller = appRouter.createCaller(ctx("admin"));
    const before = await caller.settings.admin();
    const result = await caller.settings.update({ announcementText: before.announcementText, announcementLink: before.announcementLink || "", announcementVisible: before.announcementVisible, featuredRoomSlugs: JSON.parse(before.featuredRoomSlugs) });
    expect(result).toBe(true);
  });

  it("rejects regular users from admin settings access", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    await expect(caller.settings.admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("previews bulk rooms with valid, duplicate, and invalid results", async () => {
    const caller = appRouter.createCaller(ctx("admin"));
    const result = await caller.admin.bulkRoomPreview({ rooms: [{ slug: "AnEveningStroll", title: "AnEveningStroll" }, { slug: "AnEveningStroll", title: "Duplicate" }, { slug: "bad slug", title: "Invalid" }] });
    expect(result.valid).toHaveLength(1);
    expect(result.duplicates).toContain("AnEveningStroll");
    expect(result.invalid[0].errors.length).toBeGreaterThan(0);
  });

  it("imports an existing room idempotently and preserves duplicate photos", async () => {
    const caller = appRouter.createCaller(ctx("admin"));
    const existing = (await caller.admin.list({ kind: "rooms" })).find(room => room.slug === "AnEveningStroll");
    expect(existing).toBeTruthy();
    const details = await caller.rooms.bySlug({ slug: "AnEveningStroll" });
    const result = await caller.admin.bulkRoomImport({ rooms: [{ slug: existing!.slug, title: existing!.title, description: existing!.description, coverUrl: existing!.coverUrl, creatorUsername: existing!.creatorUsername, cheerCount: existing!.cheerCount, visitCount: existing!.visitCount, capacity: existing!.capacity, platforms: existing!.platforms, photoUrls: details.photos.slice(0, 1).map(photo => photo.imageUrl) }] });
    expect(result.imported).toBe(1);
    expect(result.photosImported).toBe(0);
  });

  it("rejects regular users from bulk room preview and import", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    await expect(caller.admin.bulkRoomPreview({ rooms: [{ slug: "UnauthorizedRoom", title: "UnauthorizedRoom" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.bulkRoomImport({ rooms: [{ slug: "UnauthorizedRoom", title: "UnauthorizedRoom" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects regular users from admin content listing", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    await expect(caller.admin.list({ kind: "profiles" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
