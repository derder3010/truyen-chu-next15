CREATE TABLE `advertisements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image_url` text,
	`affiliate_url` text NOT NULL,
	`impression_count` integer DEFAULT 0,
	`click_count` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`display_frequency` integer DEFAULT 3,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `chapter_locks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`chapter_id` integer NOT NULL,
	`advertisement_id` integer NOT NULL,
	`is_unlocked` integer DEFAULT false,
	`unlock_expiry` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
