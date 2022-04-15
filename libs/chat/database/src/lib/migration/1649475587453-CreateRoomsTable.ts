import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateRoomsTable1649475587453 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(
            `
            CREATE SCHEMA IF NOT EXISTS "chat-schema"
            AUTHORIZATION postgres;
            `
        );
        await queryRunner.query(
            `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            `
        )
        await queryRunner.query(
            `
            CREATE TYPE "chat-schema".room_roomtype_enum AS ENUM
            ('chat_room', 'dm', 'group_dm');
            `
        );
        await queryRunner.query(
            `
            CREATE TABLE IF NOT EXISTS "chat-schema".room
            (
            id uuid NOT NULL DEFAULT uuid_generate_v4(),
            name character varying COLLATE pg_catalog."default",
            description character varying COLLATE pg_catalog."default",
            "roomType" "chat-schema".room_roomtype_enum NOT NULL DEFAULT 'dm'::"chat-schema".room_roomtype_enum,
            CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY (id)
            )
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('"user-schema"."user"');
    }

}
