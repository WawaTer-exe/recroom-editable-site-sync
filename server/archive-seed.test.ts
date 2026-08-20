import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Profile = { username: string; bio?: string | null };
type Room = { slug: string; creatorUsername?: string | null; coverUrl?: string | null; description?: string | null };
type RoomPhoto = { roomSlug: string; imageUrl: string };

describe("public archive seed integrity", () => {
  const seedDir = path.resolve(process.cwd(), "seed");
  const read = (name: string) => JSON.parse(fs.readFileSync(path.join(seedDir, name), "utf8"));

  it("keeps the expanded captured public profiles and Mystical bio", () => {
    const profiles = read("profiles_api_enriched.json") as Profile[];
    const mystical = profiles.find(profile => profile.username === "Mystical");
    expect(profiles).toHaveLength(172);
    expect(mystical?.bio).toContain("I have played since 2018");
  });

  it("contains a substantially expanded public photo archive", () => {
    const photos = read("profile_photos_live_full.json") as Array<{ username: string; imageUrl: string }>;
    expect(photos.length).toBeGreaterThan(500);
    expect(photos.every(photo => photo.username && photo.imageUrl.startsWith("https://img.recroom.network/"))).toBe(true);
  });

  it("contains the full attached room inventory and recovered metadata", () => {
    const rooms = read("rooms_live.json") as Room[];
    expect(rooms).toHaveLength(154);
    expect(rooms.filter(room => room.creatorUsername && room.coverUrl && room.description).length).toBeGreaterThanOrEqual(14);
    for (const slug of ["ValArtAcademy", "RecRoomGallery", "MakerPenClassQandA", "rp_unioncity", "ArmadiIIoPVP", "AnEveningStroll", "MonkeyTag-Remastered"]) expect(rooms.some(room => room.slug === slug)).toBe(true);
    expect(rooms.every(room => room.sourceUrl?.startsWith("https://recroom.network/room/") || room.slug)).toBe(true);
  });

  it("contains requested-room public image references", () => {
    const photos = read("room_photos_live.json") as RoomPhoto[];
    expect(photos.length).toBeGreaterThan(300);
    for (const slug of ["ValArtAcademy", "RecRoomGallery", "MakerPenClassQandA", "rp_unioncity", "ArmadiIIoPVP", "AnEveningStroll"]) {
      expect(photos.filter(photo => photo.roomSlug === slug).length).toBeGreaterThan(0);
      expect(photos.filter(photo => photo.roomSlug === slug).every(photo => photo.imageUrl.startsWith("https://img.recroom.network/"))).toBe(true);
    }
  });
});
