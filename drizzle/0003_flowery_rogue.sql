CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"generation" integer NOT NULL,
	"format" varchar(50) NOT NULL,
	"pokemon" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_teams_user_id" ON "teams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teams_created_at" ON "teams" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_teams_user_list" ON "teams" USING btree ("user_id","generation","created_at" DESC NULLS LAST);