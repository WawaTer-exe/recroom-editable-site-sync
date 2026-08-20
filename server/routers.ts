import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { hashPassword, verifyPassword } from "./passwords";
import { clearManagedSession, createManagedSession, setManagedSession } from "./managedSession";
import {
  adminList,
  createContent,
  createManagedAccount,
  createMediaAsset,
  deleteContent,
  deleteManagedAccount,
  deleteMediaAsset,
  getManagedAccountByUsername,
  getProfileByUsername,
  listBlogPosts,
  listDirectorySections,
  listMediaAssets,
  listManagedAccounts,
  listPhotoActivity,
  listNavigation,
  listProfilePhotos,
  listProfiles,
  listRooms,
  listRoomPhotos,
  getSiteSettings,
  updateSiteSettings,
  updateContent,
  bulkImportRooms,
} from "./db";
import { runPublicRoomSync } from "./roomSync";

const contentKind = z.enum(["profiles", "rooms", "blogPosts", "navigationItems", "directorySections"]);
const roomImportSchema = z.object({
  slug: z.string().regex(/^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/, "Use a room slug with letters, numbers, dots, underscores, or hyphens"),
  title: z.string().min(1).max(180),
  description: z.string().max(5000).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  creatorUsername: z.string().max(100).nullable().optional(),
  cheerCount: z.number().int().min(0).optional(),
  visitCount: z.number().int().min(0).optional(),
  publishedAt: z.string().nullable().optional(),
  capacity: z.number().int().min(0).max(1000).optional(),
  platforms: z.string().max(120).nullable().optional(),
  tags: z.array(z.string().min(1).max(80)).max(50).optional(),
  photoUrls: z.array(z.string().url()).max(300).optional(),
});
const bulkRoomPreviewInput = z.object({ rooms: z.array(z.unknown()).min(1).max(500) });
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      clearManagedSession(ctx.res, ctx.req);
      return { success: true } as const;
    }),
    managedLogin: publicProcedure.input(z.object({ username: z.string().min(1), password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const account = await getManagedAccountByUsername(input.username);
      if (!account || !account.active || !verifyPassword(input.password, account.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
      setManagedSession(ctx.res, ctx.req, await createManagedSession(account.id));
      return { success: true } as const;
    }),
  }),
  navigation: publicProcedure.query(() => listNavigation()),
  settings: router({
    public: publicProcedure.query(() => getSiteSettings()),
    admin: adminProcedure.query(() => getSiteSettings()),
    update: adminProcedure.input(z.object({ announcementText: z.string().min(1).max(2000), announcementLink: z.string().url().or(z.literal("")).nullable().optional(), announcementVisible: z.boolean(), featuredRoomSlugs: z.array(z.string().min(1).max(160)).max(12) })).mutation(({ input }) => updateSiteSettings({ ...input, announcementLink: input.announcementLink || null, featuredRoomSlugs: JSON.stringify(input.featuredRoomSlugs) })),
  }),
  directory: publicProcedure.query(() => listDirectorySections()),
  profiles: router({
    list: publicProcedure.input(z.object({ query: z.string().optional() }).optional()).query(({ input }) => listProfiles(input?.query)),
    byUsername: publicProcedure.input(z.object({ username: z.string().min(1) })).query(async ({ input }) => {
      const profile = await getProfileByUsername(input.username);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      const photos = await listProfilePhotos(profile.id);
      return { profile, photos };
    }),
  }),
  rooms: router({
    list: publicProcedure.query(() => listRooms()),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => {
      const room = (await listRooms()).find(item => item.slug === input.slug);
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      return { room, photos: await listRoomPhotos(room.id) };
    }),
  }),
  blog: publicProcedure.query(() => listBlogPosts()),
  activity: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional()).query(({ input }) => listPhotoActivity(input?.limit ?? 100)),
  media: router({
    list: adminProcedure.query(() => listMediaAssets()),
    upload: adminProcedure.input(z.object({ filename: z.string().min(1).max(255), contentType: z.string().min(1).max(120), data: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
      const bytes = Buffer.from(input.data, "base64");
      const uploaded = await storagePut(`recroom-media/${safeName}`, bytes, input.contentType);
      await createMediaAsset({ fileKey: uploaded.key, url: uploaded.url, filename: input.filename, mimeType: input.contentType, sizeBytes: bytes.byteLength, uploadedBy: ctx.user.id });
      return uploaded;
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteMediaAsset(input.id)),
  }),
  managedAccounts: router({
    list: adminProcedure.query(() => listManagedAccounts()),
    create: adminProcedure.input(z.object({ username: z.string().regex(/^[A-Za-z0-9_.-]{2,64}$/), displayName: z.string().min(1).max(160), password: z.string().min(8).max(200), avatarUrl: z.string().url().or(z.literal("")).optional(), role: z.enum(["user", "admin"]).default("user") })).mutation(({ input }) => createManagedAccount({ username: input.username, displayName: input.displayName, passwordHash: hashPassword(input.password), avatarUrl: input.avatarUrl || null, role: input.role })),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteManagedAccount(input.id)),
  }),
  admin: router({
    list: adminProcedure.input(z.object({ kind: contentKind })).query(({ input }) => adminList(input.kind)),
    bulkRoomPreview: adminProcedure.input(bulkRoomPreviewInput).query(async ({ input }) => {
      const existing = new Set((await listRooms()).map(room => room.slug));
      const seen = new Set<string>();
      const valid: z.infer<typeof roomImportSchema>[] = [];
      const invalid: Array<{ index: number; errors: string[]; value: unknown }> = [];
      input.rooms.forEach((value, index) => {
        const parsed = roomImportSchema.safeParse(value);
        if (!parsed.success) { invalid.push({ index, errors: parsed.error.issues.map(issue => issue.message), value }); return; }
        if (seen.has(parsed.data.slug)) { invalid.push({ index, errors: ["Duplicate slug in this import batch"], value }); return; }
        seen.add(parsed.data.slug);
        valid.push(parsed.data);
      });
      return { valid, duplicates: valid.filter(room => existing.has(room.slug)).map(room => room.slug), invalid };
    }),
    bulkRoomImport: adminProcedure.input(z.object({ rooms: z.array(roomImportSchema).min(1).max(500) })).mutation(({ input }) => bulkImportRooms(input.rooms)),
    syncStatus: adminProcedure.query(() => getSiteSettings()),
    syncNow: adminProcedure.mutation(() => runPublicRoomSync()),
    create: adminProcedure.input(z.object({ kind: contentKind, data: z.record(z.string(), z.any()) })).mutation(({ input }) => createContent(input.kind, input.data)),
    update: adminProcedure.input(z.object({ kind: contentKind, id: z.number().int().positive(), data: z.record(z.string(), z.any()) })).mutation(({ input }) => updateContent(input.kind, input.id, input.data)),
    delete: adminProcedure.input(z.object({ kind: contentKind, id: z.number().int().positive() })).mutation(({ input }) => deleteContent(input.kind, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
