import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateUserStatusTable1647747738137 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(
            `
            CREATE TYPE "user-schema"."user-status_state_enum" AS ENUM
            ('online', 'offline', 'away', 'busy', 'appear_away', 'appear_busy', 'appear_offline');
            `
        );
        await queryRunner.query(
            `
            -- SEQUENCE: user-schema.user-status_id_seq
            -- DROP SEQUENCE IF EXISTS "user-schema"."user-status_id_seq";

            CREATE SEQUENCE IF NOT EXISTS "user-schema"."user-status_id_seq"
                INCREMENT 1
                START 1
                MINVALUE 1
                MAXVALUE 2147483647
                CACHE 1
            `
        );
        await queryRunner.query(
            `
            CREATE TABLE IF NOT EXISTS "user-schema"."user-status"
            (
                id integer NOT NULL DEFAULT nextval('"user-schema"."user-status_id_seq"'::regclass),
                state "user-schema"."user-status_state_enum" NOT NULL DEFAULT 'online'::"user-schema"."user-status_state_enum",
                "lastSeen" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_508a75a8d9b10b0e9d7fe941f16" PRIMARY KEY (id)
            )
            `
        );
        await queryRunner.query(
            `
            ALTER SEQUENCE IF EXISTS "user-schema"."user-status_id_seq" OWNED BY "user-schema"."user-status".id;
            `
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('"user-schema"."user-status"');
    }

}
