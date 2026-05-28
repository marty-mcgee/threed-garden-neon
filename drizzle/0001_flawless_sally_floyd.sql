CREATE TABLE "ai_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"recommendation_id" varchar(50) NOT NULL,
	"plant_id" integer,
	"bed_id" integer,
	"confidence" numeric(3, 2),
	"reasoning" text,
	"suggested_planting_date" timestamp,
	"companion_suggestions" text,
	"created_at" timestamp DEFAULT now(),
	"applied" boolean DEFAULT false,
	"raw_data" jsonb,
	CONSTRAINT "ai_recommendations_recommendation_id_unique" UNIQUE("recommendation_id")
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"bed_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"width_feet" numeric(5, 2),
	"length_feet" numeric(5, 2),
	"square_feet" numeric(8, 2),
	"shape" varchar(50) DEFAULT 'rectangle',
	"soil_type" varchar(50),
	"sun_exposure" varchar(50),
	"coordinates" jsonb,
	"position_x" numeric(8, 2),
	"position_y" numeric(8, 2),
	"position_z" numeric(8, 2),
	"rotation" numeric(8, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "beds_bed_id_unique" UNIQUE("bed_id")
);
--> statement-breakpoint
CREATE TABLE "farmbot_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"logged_at" timestamp DEFAULT now(),
	"device_id" varchar(100),
	"event_type" varchar(50),
	"sensor_data" jsonb,
	"status" varchar(20),
	"message" text,
	"raw_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "harvests" (
	"id" serial PRIMARY KEY NOT NULL,
	"harvest_id" varchar(50) NOT NULL,
	"planting_id" integer,
	"plant_id" integer,
	"quantity" numeric(8, 2),
	"unit" varchar(20) DEFAULT 'lbs',
	"weight_lbs" numeric(8, 2),
	"harvest_date" timestamp DEFAULT now(),
	"notes" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "harvests_harvest_id_unique" UNIQUE("harvest_id")
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" serial PRIMARY KEY NOT NULL,
	"planting_id" varchar(50) NOT NULL,
	"plant_id" integer,
	"bed_id" integer,
	"quantity" integer DEFAULT 1,
	"spacing_inches" integer,
	"position_x" numeric(8, 2),
	"position_y" numeric(8, 2),
	"position_z" numeric(8, 2),
	"planted_date" timestamp,
	"expected_harvest_date" timestamp,
	"actual_harvest_date" timestamp,
	"status" varchar(20) DEFAULT 'planting',
	"growth_stage" varchar(50),
	"health" varchar(20) DEFAULT 'good',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "plantings_planting_id_unique" UNIQUE("planting_id")
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" varchar(50) NOT NULL,
	"common_name" varchar(200) NOT NULL,
	"scientific_name" varchar(200),
	"variety" varchar(100),
	"family" varchar(100),
	"type" varchar(50),
	"growth_habit" varchar(50),
	"sunlight" varchar(50),
	"water_needs" varchar(50),
	"soil_type" text,
	"soil_ph" numeric(3, 1),
	"days_to_maturity" integer,
	"days_to_germination" integer,
	"spacing_inches" integer,
	"row_spacing_inches" integer,
	"planting_depth_inches" numeric(3, 1),
	"frost_tolerant" boolean DEFAULT false,
	"perennial" boolean DEFAULT false,
	"hardiness_zone" varchar(10),
	"image_url" text,
	"description" text,
	"care_instructions" text,
	"harvest_instructions" text,
	"companion_plants" text,
	"avoid_plants" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "plants_plant_id_unique" UNIQUE("plant_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" varchar(50) NOT NULL,
	"planting_id" integer,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(50),
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'pending',
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "weather_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_at" timestamp DEFAULT now(),
	"temperature" numeric(5, 1),
	"humidity" numeric(5, 1),
	"rainfall_inches" numeric(5, 2),
	"soil_moisture" numeric(5, 1),
	"sunlight_hours" numeric(4, 1),
	"frost_warning" boolean DEFAULT false,
	"heat_warning" boolean DEFAULT false,
	"raw_data" jsonb
);
--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_planting_id_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."plantings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_planting_id_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."plantings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_recommendation_id" ON "ai_recommendations" USING btree ("recommendation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_beds_bed_id" ON "beds" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_beds_active" ON "beds" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_farmbot_logged_at" ON "farmbot_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_farmbot_event_type" ON "farmbot_logs" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_harvests_harvest_id" ON "harvests" USING btree ("harvest_id");--> statement-breakpoint
CREATE INDEX "idx_harvests_planting" ON "harvests" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_harvests_date" ON "harvests" USING btree ("harvest_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plantings_planting_id" ON "plantings" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_plantings_plant" ON "plantings" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_plantings_bed" ON "plantings" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_plantings_status" ON "plantings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plants_plant_id" ON "plants" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_plants_common_name" ON "plants" USING btree ("common_name");--> statement-breakpoint
CREATE INDEX "idx_plants_type" ON "plants" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tasks_task_id" ON "tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_planting" ON "tasks" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_weather_recorded_at" ON "weather_logs" USING btree ("recorded_at");