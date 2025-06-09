CREATE TABLE `ebooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`author` text NOT NULL,
	`description` text,
	`cover_image` text,
	`genres` text,
	`status` text DEFAULT 'completed',
	`purchase_links` text,
	`view_count` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ebooks_slug_unique` ON `ebooks` (`slug`);