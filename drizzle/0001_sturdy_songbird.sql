CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200) NOT NULL,
	`title` varchar(240) NOT NULL,
	`category` varchar(100) NOT NULL,
	`author` varchar(160) NOT NULL,
	`publishDate` timestamp,
	`body` text NOT NULL,
	`coverUrl` text,
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogPosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogPosts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `directorySections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`href` varchar(240),
	`sortOrder` int NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	CONSTRAINT `directorySections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(120),
	`sizeBytes` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`),
	CONSTRAINT `mediaAssets_fileKey_unique` UNIQUE(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE `navigationItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(80) NOT NULL,
	`href` varchar(240) NOT NULL,
	`sortOrder` int NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	CONSTRAINT `navigationItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profilePhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`caption` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profilePhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`bannerUrl` text,
	`joinedAt` timestamp,
	`subscriberCount` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`coverUrl` text,
	`playerCount` int NOT NULL DEFAULT 0,
	`cheerCount` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rooms_slug_unique` UNIQUE(`slug`)
);
