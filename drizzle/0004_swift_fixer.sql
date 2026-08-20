CREATE TABLE `roomPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`caption` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roomPhotos_id` PRIMARY KEY(`id`)
);
