import { describe, expect, it, vi } from "vitest";
import { verifyPassword, hashPassword } from "./passwords";
import { createManagedSession, getManagedUser } from "./managedSession";
import { createContext } from "./_core/context";

const { createManagedAccount, deleteManagedAccount, deleteMediaAsset, createMediaAsset, listMediaAssets, getManagedAccountByUsername, getManagedAccountById } = vi.hoisted(() => ({
  createManagedAccount: vi.fn().mockResolvedValue(true),
  deleteManagedAccount: vi.fn().mockResolvedValue(true),
  deleteMediaAsset: vi.fn().mockResolvedValue(true),
  createMediaAsset: vi.fn().mockResolvedValue(true),
  listMediaAssets: vi.fn().mockResolvedValue([{ id: 8, filename: "photo.png", url: "/manus-storage/photo.png" }]),
  getManagedAccountByUsername: vi.fn(),
  getManagedAccountById: vi.fn(),
}));

vi.mock("./db", () => ({
  adminList: vi.fn().mockResolvedValue([]),
  createContent: vi.fn().mockResolvedValue(true),
  createManagedAccount,
  createMediaAsset,
  deleteContent: vi.fn().mockResolvedValue(true),
  deleteManagedAccount,
  deleteMediaAsset,
  getManagedAccountByUsername,
  getManagedAccountById,
  getProfileByUsername: vi.fn(),
  listBlogPosts: vi.fn().mockResolvedValue([]),
  listDirectorySections: vi.fn().mockResolvedValue([]),
  listMediaAssets,
  listManagedAccounts: vi.fn().mockResolvedValue([]),
  listNavigation: vi.fn().mockResolvedValue([]),
  listPhotoActivity: vi.fn().mockResolvedValue([]),
  listProfilePhotos: vi.fn().mockResolvedValue([]),
  listProfiles: vi.fn().mockResolvedValue([]),
  listRooms: vi.fn().mockResolvedValue([]),
  updateContent: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({ storagePut: vi.fn().mockResolvedValue({ key: "recroom-media/photo.png", url: "/manus-storage/photo.png" }) }));

const { appRouter } = await import("./routers");
const context = (role: "admin" | "user") => ({ user: { id: 1, role }, req: { protocol: "https", headers: {} } as any, res: {} as any } as any);

describe("managed account and media authorization", () => {
  it("hashes and stores a created account password with its avatar URL", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const password = process.env.INITIAL_MANAGED_ACCOUNT_PASSWORD;
    expect(password).toBeTruthy();
    await caller.managedAccounts.create({ username: "photo-user", displayName: "Photo User", password, avatarUrl: "https://example.com/avatar.png", role: "user" });
    const payload = createManagedAccount.mock.calls.at(-1)?.[0];
    expect(payload.passwordHash).not.toBe(password);
    expect(verifyPassword(password, payload.passwordHash)).toBe(true);
    expect(payload.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("restores managed sessions through createContext and auth.me", async () => {
    const account = { id: 32, username: "context-admin", displayName: "Context Admin", passwordHash: "unused", avatarUrl: null, role: "admin" as const, active: true, createdAt: new Date(), updatedAt: new Date() };
    getManagedAccountById.mockResolvedValue(account);
    const token = await createManagedSession(account.id);
    const ctx = await createContext({ req: { protocol: "https", headers: { cookie: `recroom_managed_session=${token}` } } as any, res: {} as any, info: {} as any });
    expect(ctx.user?.role).toBe("admin");
    expect(await appRouter.createCaller(ctx).auth.me()).toMatchObject({ openId: "managed:32", role: "admin" });
  });

  it("restores a non-admin session through createContext and forbids admin procedures", async () => {
    const account = { id: 33, username: "context-user", displayName: "Context User", passwordHash: "unused", avatarUrl: null, role: "user" as const, active: true, createdAt: new Date(), updatedAt: new Date() };
    getManagedAccountById.mockResolvedValue(account);
    const token = await createManagedSession(account.id);
    const ctx = await createContext({ req: { protocol: "https", headers: { cookie: `recroom_managed_session=${token}` } } as any, res: {} as any, info: {} as any });
    expect(ctx.user?.role).toBe("user");
    expect(await appRouter.createCaller(ctx).auth.me()).toMatchObject({ openId: "managed:33", role: "user" });
    await expect(appRouter.createCaller(ctx).admin.list({ kind: "profiles" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("restores managed-session roles and applies admin RBAC", async () => {
    const account = { id: 31, username: "admin-user", displayName: "Admin User", passwordHash: "unused", avatarUrl: null, role: "admin" as const, active: true, createdAt: new Date(), updatedAt: new Date() };
    getManagedAccountById.mockResolvedValue(account);
    const token = await createManagedSession(account.id);
    const managedUser = await getManagedUser({ headers: { cookie: `recroom_managed_session=${token}` } } as any);
    expect(managedUser?.role).toBe("admin");
    const caller = appRouter.createCaller({ ...context("admin"), user: managedUser });
    await caller.admin.list({ kind: "profiles" });
    getManagedAccountById.mockResolvedValue({ ...account, role: "user" });
    const userToken = await createManagedSession(account.id);
    const regularUser = await getManagedUser({ headers: { cookie: `recroom_managed_session=${userToken}` } } as any);
    await expect(appRouter.createCaller({ ...context("user"), user: regularUser }).admin.list({ kind: "profiles" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("logs managed accounts in with a signed session cookie", async () => {
    const password = process.env.INITIAL_MANAGED_ACCOUNT_PASSWORD;
    expect(password).toBeTruthy();
    getManagedAccountByUsername.mockResolvedValue({ id: 22, username: "photo-user", displayName: "Photo User", passwordHash: hashPassword(password), avatarUrl: null, role: "admin", active: true, createdAt: new Date(), updatedAt: new Date() });
    const cookies: unknown[] = [];
    const caller = appRouter.createCaller({ ...context("user"), res: { cookie: (...args: unknown[]) => cookies.push(args) } as any });
    await caller.auth.managedLogin({ username: "photo-user", password });
    expect(cookies).toHaveLength(1);
    expect((cookies[0] as unknown[])[0]).toBe("recroom_managed_session");
  });

  it("allows admins to upload and browse photo assets", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const result = await caller.media.upload({ filename: "photo.png", contentType: "image/png", data: "aGVsbG8=" });
    const library = await caller.media.list();
    expect(result.url).toBe("/manus-storage/photo.png");
    expect(createMediaAsset).toHaveBeenCalledWith(expect.objectContaining({ filename: "photo.png", mimeType: "image/png", url: "/manus-storage/photo.png" }));
    expect(library[0]?.filename).toBe("photo.png");
  });

  it("allows admins to remove accounts and media records", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await caller.managedAccounts.delete({ id: 4 });
    await caller.media.delete({ id: 8 });
    expect(deleteManagedAccount).toHaveBeenCalledWith(4);
    expect(deleteMediaAsset).toHaveBeenCalledWith(8);
  });

  it("rejects regular users from account and media mutations", async () => {
    const caller = appRouter.createCaller(context("user"));
    const password = process.env.INITIAL_MANAGED_ACCOUNT_PASSWORD;
    expect(password).toBeTruthy();
    await expect(caller.managedAccounts.create({ username: "blocked", displayName: "Blocked", password, role: "user" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.managedAccounts.delete({ id: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.media.delete({ id: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
