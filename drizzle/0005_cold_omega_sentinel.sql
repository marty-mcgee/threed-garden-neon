CREATE TABLE "threed_model_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"texture_type" varchar(50),
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"is_binary_buffer" boolean DEFAULT false,
	"load_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "threed_models" ADD COLUMN "has_external_files" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "threed_models" ADD COLUMN "texture_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "threed_models" ADD COLUMN "main_model_file_id" integer;--> statement-breakpoint
ALTER TABLE "threed_model_files" ADD CONSTRAINT "threed_model_files_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_threed_model_files_model_id" ON "threed_model_files" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_threed_model_files_type" ON "threed_model_files" USING btree ("file_type");