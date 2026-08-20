import { describe, expect, it, vi } from "vitest";

const createContent = vi.fn().mockResolvedValue(true);
const updateContent = vi.fn().mockResolvedValue(true);
const deleteContent = vi.fn().mockResolvedValue(true);

vi.mock("./db", () => ({
  adminList: vi.fn().mockResolvedValue([]),
  createContent,
  createMediaAsset: vi.fn().mockResolvedValue(true),
  deleteContent,
  getProfileByUsername: vi.fn(),
  listBlogPosts: vi.fn().mockResolvedValue([]),
  listDirectorySections: vi.fn().mockResolvedValue([]),
  listMediaAssets: vi.fn().mockResolvedValue([]),
  listNavigation: vi.fn().mockResolvedValue([]),
  listProfilePhotos: vi.fn().mockResolvedValue([]),
  listProfiles: vi.fn().mockResolvedValue([]),
  listRooms: vi.fn().mockResolvedValue([]),
  updateContent,
}));

const { appRouter } = await import("./routers");
const context = (role: "admin" | "user") => ({ user: { id: 1, role }, req: {} as any, res: {} as any } as any);

describe("admin CRUD authorization", () => {
  it("calls create, update, and delete content for admins", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await caller.admin.create({ kind: "rooms", data: { slug: "test-room", title: "Test room" } });
    await caller.admin.update({ kind: "rooms", id: 12, data: { title: "Updated room" } });
    await caller.admin.delete({ kind: "rooms", id: 12 });
    expect(createContent).toHaveBeenCalledWith("rooms", { slug: "test-room", title: "Test room" });
    expect(updateContent).toHaveBeenCalledWith("rooms", 12, { title: "Updated room" });
    expect(deleteContent).toHaveBeenCalledWith("rooms", 12);
  });

  it("rejects regular users from create, update, and delete", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.create({ kind: "rooms", data: { slug: "blocked", title: "Blocked" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.update({ kind: "rooms", id: 12, data: { title: "Blocked" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.delete({ kind: "rooms", id: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
