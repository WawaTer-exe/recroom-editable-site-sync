import { describe, expect, it } from "vitest";
import { discoverRoomSlugs, scheduledPublicRoomSync } from "./roomSync";
import { adminList, bulkImportRooms } from "./db";

describe("room sync discovery", () => {
  it("deduplicates relative and absolute public room links", () => {
    const html = '<a href="/room/AlphaRoom">A</a><a data-href="/room/AlphaRoom">A</a><a href="https://recroom.network/room/BetaRoom">B</a>';
    expect(discoverRoomSlugs(html)).toEqual(["AlphaRoom", "BetaRoom"]);
  });

  it("returns no invented records from an app-shell response", () => {
    expect(discoverRoomSlugs("<!doctype html><html><body><div id=__next></div></body></html>")).toEqual([]);
  });

  it("skips callbacks that do not own the configured task", async () => {
    const result = await scheduledPublicRoomSync("not-the-configured-task");
    expect(result).toEqual({ skipped: "orphan-or-disabled" });
  });

  it("preserves existing metadata during link-only repeated imports", async () => {
    const rooms = await adminList("rooms");
    const before = rooms.find(room => room.slug === "AnEveningStroll");
    expect(before).toBeTruthy();
    await bulkImportRooms([{ slug: "AnEveningStroll", title: "AnEveningStroll", description: null, coverUrl: null, creatorUsername: null, cheerCount: 0, visitCount: 0, capacity: 0, preserveExisting: true }]);
    const after = (await adminList("rooms")).find(room => room.slug === "AnEveningStroll");
    expect(after?.title).toBe(before?.title);
    expect(after?.description).toBe(before?.description);
    expect(after?.coverUrl).toBe(before?.coverUrl);
  });
});
