ALTER TABLE `siteSettings` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncCron` varchar(80) DEFAULT '0 */30 * * * *' NOT NULL;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncLastRunAt` timestamp;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncLastStatus` varchar(24);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncLastError` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncLastImported` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `syncLastPhotos` int DEFAULT 0 NOT NULL;