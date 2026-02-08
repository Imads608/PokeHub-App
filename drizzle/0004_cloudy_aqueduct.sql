CREATE TABLE "battle_replays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"format" varchar(50) NOT NULL,
	"player1_id" uuid NOT NULL,
	"player2_id" uuid NOT NULL,
	"player1_team_id" uuid NOT NULL,
	"player2_team_id" uuid NOT NULL,
	"winner_id" uuid,
	"battle_log" jsonb NOT NULL,
	"seed" varchar(100) NOT NULL,
	"played_at" timestamp NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "battle_replays" ADD CONSTRAINT "battle_replays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_replays" ADD CONSTRAINT "battle_replays_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_replays" ADD CONSTRAINT "battle_replays_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_replays" ADD CONSTRAINT "battle_replays_player1_team_id_teams_id_fk" FOREIGN KEY ("player1_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_replays" ADD CONSTRAINT "battle_replays_player2_team_id_teams_id_fk" FOREIGN KEY ("player2_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_replays" ADD CONSTRAINT "battle_replays_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_battle_replays_user" ON "battle_replays" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_replays_battle" ON "battle_replays" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "idx_battle_replays_saved_at" ON "battle_replays" USING btree ("saved_at" DESC NULLS LAST);