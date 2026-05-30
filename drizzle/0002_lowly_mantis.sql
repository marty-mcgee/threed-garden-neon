CREATE TYPE "public"."threed_model_type" AS ENUM('procedural', 'gltf', 'glb', 'usdz', 'obj');--> statement-breakpoint
CREATE TYPE "public"."threed_watering_frequency" AS ENUM('daily', 'weekly', 'custom', 'moisture-based');--> statement-breakpoint
CREATE TABLE "threed_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" integer,
	"model_name" varchar(255) NOT NULL,
	"model_type" "threed_model_type" NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"scale" numeric(5, 2) DEFAULT '1.0',
	"rotation_y" numeric(5, 2) DEFAULT '0.0',
	"offset_x" numeric(5, 2) DEFAULT '0.0',
	"offset_y" numeric(5, 2) DEFAULT '0.0',
	"offset_z" numeric(5, 2) DEFAULT '0.0',
	"has_lod" boolean DEFAULT false,
	"lod_levels" jsonb DEFAULT '{}'::jsonb,
	"animations" jsonb DEFAULT '[]'::jsonb,
	"default_animation" varchar(50),
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"uploaded_by" varchar(255),
	"uploaded_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_watering_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"history_id" varchar(50) NOT NULL,
	"schedule_id" integer,
	"plant_id" integer,
	"farmbot_id" integer,
	"planting_id" integer,
	"status" varchar(20) NOT NULL,
	"duration_ms" integer,
	"volume_ml" integer,
	"skip_reason" text,
	"error_message" text,
	"soil_moisture_before" integer,
	"soil_moisture_after" integer,
	"temperature_at_time" numeric(5, 1),
	"weather_at_time" jsonb,
	"executed_at" timestamp DEFAULT now(),
	"executed_by" varchar(50) DEFAULT 'automated',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_watering_history_history_id_unique" UNIQUE("history_id")
);
--> statement-breakpoint
CREATE TABLE "threed_watering_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" varchar(50) NOT NULL,
	"plant_id" integer,
	"farmbot_id" integer,
	"bed_id" integer,
	"planting_id" integer,
	"frequency" "threed_watering_frequency" NOT NULL,
	"interval_days" integer,
	"days_of_week" integer[],
	"time_of_day" time,
	"duration_ms" integer NOT NULL,
	"volume_ml" integer,
	"moisture_threshold" integer,
	"next_watering" timestamp NOT NULL,
	"last_watering" timestamp,
	"is_active" boolean DEFAULT true,
	"skip_if_rain" boolean DEFAULT true,
	"max_temperature" integer,
	"min_temperature" integer,
	"max_wind_speed" integer,
	"repeat_count" integer,
	"times_executed" integer DEFAULT 0,
	"notes" text,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_watering_schedules_schedule_id_unique" UNIQUE("schedule_id")
);
--> statement-breakpoint
ALTER TABLE "threed_plants" ALTER COLUMN "common_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "threed_plants" ALTER COLUMN "scientific_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "threed_plants" ALTER COLUMN "model_type" SET DEFAULT 'procedural'::"public"."threed_model_type";--> statement-breakpoint
ALTER TABLE "threed_plants" ALTER COLUMN "model_type" SET DATA TYPE "public"."threed_model_type" USING "model_type"::"public"."threed_model_type";--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD COLUMN "custom_model_id" integer;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD COLUMN "model_scale" numeric(5, 2) DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD COLUMN "model_offset" jsonb DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "model_path" varchar(500);--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "model_metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "is_custom_model" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "model_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD COLUMN "watering_schedule_id" integer;--> statement-breakpoint
ALTER TABLE "threed_models" ADD CONSTRAINT "threed_models_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_schedule_id_threed_watering_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."threed_watering_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_threed_models_plant_id" ON "threed_models" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_models_type" ON "threed_models" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "idx_threed_models_active" ON "threed_models" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_watering_history_id" ON "threed_watering_history" USING btree ("history_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_schedule" ON "threed_watering_history" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_plant" ON "threed_watering_history" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_executed_at" ON "threed_watering_history" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_status" ON "threed_watering_history" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_watering_schedule_id" ON "threed_watering_schedules" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_plant" ON "threed_watering_schedules" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_farmbot" ON "threed_watering_schedules" USING btree ("farmbot_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_next" ON "threed_watering_schedules" USING btree ("next_watering");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_active" ON "threed_watering_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_next_active" ON "threed_watering_schedules" USING btree ("next_watering","is_active");--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_custom_model_id_threed_models_id_fk" FOREIGN KEY ("custom_model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_watering_schedule_id_threed_watering_schedules_id_fk" FOREIGN KEY ("watering_schedule_id") REFERENCES "public"."threed_watering_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_custom_model" ON "threed_plantings" USING btree ("custom_model_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_model_type" ON "threed_plants" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_watering" ON "threed_tasks" USING btree ("watering_schedule_id");