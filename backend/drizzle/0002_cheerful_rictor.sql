CREATE TABLE `user_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`note_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_bookmarks_user_id_idx` ON `user_bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_bookmarks_note_id_idx` ON `user_bookmarks` (`note_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_bookmarks_user_id_note_id_unique` ON `user_bookmarks` (`user_id`,`note_id`);--> statement-breakpoint
CREATE TABLE `external_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`email` text,
	`email_verified` integer,
	`metadata` text,
	`provider_created_at` integer,
	`provider_updated_at` integer,
	`last_synced_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_identities_provider_provider_user_id_unique` ON `external_identities` (`provider`,`provider_user_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`bio` text,
	`avatar_url` text,
	`preferences` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `notes` ADD `author_id` text REFERENCES profiles(id);