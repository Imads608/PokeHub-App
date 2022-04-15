import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateParticipantsTable1649476672238 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
            CREATE SCHEMA IF NOT EXISTS "chat-schema"
            AUTHORIZATION postgres;
            `
        );
        await queryRunner.query(
            `
            CREATE TABLE IF NOT EXISTS "chat-schema".participant
            (
            uid character varying COLLATE pg_catalog."default" NOT NULL,
            "isActive" boolean NOT NULL,
            "roomId" uuid NOT NULL,
            CONSTRAINT "PK_a71aae9893a79572e9ed2b8e6bd" PRIMARY KEY (uid, "roomId"),
            CONSTRAINT "FK_88cc2da357cc7b7f59fc5960d0c" FOREIGN KEY ("roomId")
            REFERENCES "chat-schema".room (id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE NO ACTION
            )
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('"chat-schema"."participant"');
    }

}
