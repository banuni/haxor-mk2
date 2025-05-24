CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`from_name` text NOT NULL,
	`from_role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`cleared_at` integer
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text,
	`task_type` text NOT NULL,
	`status` text NOT NULL,
	`goal` text,
	`started_at` integer,
	`probability` integer,
	`estimated_seconds_to_complete` integer,
	`target_name` text NOT NULL,
	`algorithm_name` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`archived_at` integer
);
