CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementText` text NOT NULL,
	`announcementLink` varchar(500),
	`announcementVisible` boolean NOT NULL DEFAULT true,
	`featuredRoomSlugs` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
