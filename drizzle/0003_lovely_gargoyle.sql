ALTER TABLE `rooms` ADD `creatorUsername` varchar(64);--> statement-breakpoint
ALTER TABLE `rooms` ADD `visitCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `rooms` ADD `capacity` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `platforms` varchar(120);--> statement-breakpoint
ALTER TABLE `rooms` ADD `tags` text;