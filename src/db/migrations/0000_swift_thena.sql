CREATE TABLE `investments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_unique_name` text NOT NULL,
	`quality` integer DEFAULT 1 NOT NULL,
	`quantity` integer NOT NULL,
	`buy_price_per_unit` integer NOT NULL,
	`buy_city` text NOT NULL,
	`buy_date` integer NOT NULL,
	`target_sell_city` text,
	`expected_sell_price` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`sell_price_actual` integer,
	`sell_date` integer,
	`notes` text,
	FOREIGN KEY (`item_unique_name`) REFERENCES `items`(`unique_name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_inv_status` ON `investments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_inv_item` ON `investments` (`item_unique_name`);--> statement-breakpoint
CREATE TABLE `items` (
	`unique_name` text PRIMARY KEY NOT NULL,
	`localized_es` text NOT NULL,
	`localized_en` text NOT NULL,
	`normalized_es` text NOT NULL,
	`normalized_en` text NOT NULL,
	`tier` integer NOT NULL,
	`enchant` integer DEFAULT 0 NOT NULL,
	`category` text NOT NULL,
	`subcategory` text NOT NULL,
	`item_value` integer NOT NULL,
	`shop_category` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_items_norm_es` ON `items` (`normalized_es`);--> statement-breakpoint
CREATE INDEX `idx_items_norm_en` ON `items` (`normalized_en`);--> statement-breakpoint
CREATE INDEX `idx_items_tier` ON `items` (`tier`,`category`);--> statement-breakpoint
CREATE TABLE `price_cache` (
	`item_id` text NOT NULL,
	`city` text NOT NULL,
	`quality` integer NOT NULL,
	`sell_min` integer DEFAULT 0 NOT NULL,
	`sell_min_date` integer,
	`sell_max` integer DEFAULT 0 NOT NULL,
	`buy_min` integer DEFAULT 0 NOT NULL,
	`buy_max` integer DEFAULT 0 NOT NULL,
	`buy_max_date` integer,
	`updated_at` integer NOT NULL,
	`ttl_seconds` integer DEFAULT 300 NOT NULL,
	PRIMARY KEY(`item_id`, `city`, `quality`)
);
--> statement-breakpoint
CREATE INDEX `idx_price_updated` ON `price_cache` (`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
