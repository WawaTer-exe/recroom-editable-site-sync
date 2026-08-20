CREATE TABLE `managedAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`avatarUrl` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `managedAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `managedAccounts_username_unique` UNIQUE(`username`)
);
