PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cost_price` real NOT NULL,
	`selling_price` real NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`vendor_id` text NOT NULL,
	`last_supply_date` text,
	`low_stock_threshold` integer,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "cost_price", "selling_price", "stock", "vendor_id", "last_supply_date", "low_stock_threshold") SELECT "id", "name", "cost_price", "selling_price", "stock", "vendor_id", "last_supply_date", "low_stock_threshold" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_supply_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`vendor_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`cost_price` real NOT NULL,
	`selling_price` real NOT NULL,
	`purchase_order_number` text NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_supply_entries`("id", "date", "vendor_id", "product_id", "quantity", "cost_price", "selling_price", "purchase_order_number", "is_paid") SELECT "id", "date", "vendor_id", "product_id", "quantity", "cost_price", "selling_price", "purchase_order_number", "is_paid" FROM `supply_entries`;--> statement-breakpoint
DROP TABLE `supply_entries`;--> statement-breakpoint
ALTER TABLE `__new_supply_entries` RENAME TO `supply_entries`;