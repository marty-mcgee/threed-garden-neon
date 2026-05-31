CREATE TYPE "public"."threed_character_emote" AS ENUM('none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep');--> statement-breakpoint
CREATE TYPE "public"."threed_character_movement_type" AS ENUM('stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport');--> statement-breakpoint
CREATE TYPE "public"."threed_character_weather_sensitivity" AS ENUM('all', 'sunny_only', 'rainy_only', 'no_rain', 'no_snow');--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "movement_type" "threed_character_movement_type" DEFAULT 'stationary';--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "patrol_waypoints" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "follow_target" varchar(50);--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "follow_distance" numeric(4, 2) DEFAULT '2.0';--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "teleport_positions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "teleport_interval" integer;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "default_emote" "threed_character_emote" DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "emote_on_interact" "threed_character_emote" DEFAULT 'happy';--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "active_start_hour" integer;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "active_end_hour" integer;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "weather_sensitivity" "threed_character_weather_sensitivity" DEFAULT 'all';--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "visible" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "visible_distance" numeric(5, 2) DEFAULT '30.0';--> statement-breakpoint
ALTER TABLE "threed_models" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
CREATE INDEX "idx_threed_characters_movement_type" ON "threed_characters" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_visible" ON "threed_characters" USING btree ("visible");