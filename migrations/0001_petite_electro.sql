CREATE TABLE `event_log` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`details` text NOT NULL,
	`performed_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cost_price` real NOT NULL,
	`selling_price` real NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`vendor_id` text NOT NULL,
	`last_supply_date` text,
	`low_stock_threshold` integer,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supply_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`vendor_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`cost_price` real NOT NULL,
	`selling_price` real NOT NULL,
	`purchase_order_number` text NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` real NOT NULL,
	`price_at_sale` real NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`subtotal` real NOT NULL,
	`total` real NOT NULL,
	`payment_method` text NOT NULL,
	`cashier_id` text NOT NULL,
	`debtor_name` text,
	FOREIGN KEY (`cashier_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
ALTER TABLE `user` ADD `display_username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);