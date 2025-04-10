CREATE TABLE `exoplanet_library` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`planet_name` text NOT NULL,
	`planet_data` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exoplanet_library_planet_name_unique` ON `exoplanet_library` (`planet_name`);--> statement-breakpoint
CREATE TABLE `planets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`planet_name` text NOT NULL,
	`planet_data` text NOT NULL,
	`generated_features` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `planets_date_unique` ON `planets` (`date`);