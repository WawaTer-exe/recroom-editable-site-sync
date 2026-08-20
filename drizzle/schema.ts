import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  bannerUrl: text("bannerUrl"),
  joinedAt: timestamp("joinedAt"),
  subscriberCount: int("subscriberCount").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const profilePhotos = mysqlTable("profilePhotos", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  caption: text("caption"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  creatorUsername: varchar("creatorUsername", { length: 64 }),
  visitCount: int("visitCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  capacity: int("capacity").default(0).notNull(),
  platforms: varchar("platforms", { length: 120 }),
  tags: text("tags"),
  playerCount: int("playerCount").default(0).notNull(),
  cheerCount: int("cheerCount").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const roomPhotos = mysqlTable("roomPhotos", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  caption: text("caption"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  author: varchar("author", { length: 160 }).notNull(),
  publishDate: timestamp("publishDate"),
  body: text("body").notNull(),
  coverUrl: text("coverUrl"),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  announcementText: text("announcementText").notNull(),
  announcementLink: varchar("announcementLink", { length: 500 }),
  announcementVisible: boolean("announcementVisible").default(true).notNull(),
  featuredRoomSlugs: text("featuredRoomSlugs").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  syncEnabled: boolean("syncEnabled").default(false).notNull(),
  syncCron: varchar("syncCron", { length: 80 }).default("0 */30 * * * *").notNull(),
  syncLastRunAt: timestamp("syncLastRunAt"),
  syncLastStatus: varchar("syncLastStatus", { length: 24 }),
  syncLastError: text("syncLastError"),
  syncLastImported: int("syncLastImported").default(0).notNull(),
  syncLastPhotos: int("syncLastPhotos").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const navigationItems = mysqlTable("navigationItems", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 80 }).notNull(),
  href: varchar("href", { length: 240 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  visible: boolean("visible").default(true).notNull(),
});

export const directorySections = mysqlTable("directorySections", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  href: varchar("href", { length: 240 }),
  sortOrder: int("sortOrder").notNull(),
  visible: boolean("visible").default(true).notNull(),
});

export const managedAccounts = mysqlTable("managedAccounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  avatarUrl: text("avatarUrl"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  fileKey: varchar("fileKey", { length: 512 }).notNull().unique(),
  url: text("url").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }),
  sizeBytes: int("sizeBytes"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type ManagedAccount = typeof managedAccounts.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;
export type RoomPhoto = typeof roomPhotos.$inferSelect;
export type InsertRoomPhoto = typeof roomPhotos.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
