ALTER TABLE "threed_plants" ADD COLUMN "model_type" varchar(50);--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "custom_model_url" text;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "model_scale" numeric(5, 2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "foliage_color" varchar(20) DEFAULT '#32CD32';--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "fruit_color" varchar(20) DEFAULT '#FF6347';