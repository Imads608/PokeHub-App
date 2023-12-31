import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateUserTable1647812387240 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
            CREATE TYPE "user-schema".user_account_enum AS ENUM
            ('google', 'regular');
            `
        );
        await queryRunner.query(
            `
            CREATE TABLE IF NOT EXISTS "user-schema"."user"
            (
                uid uuid NOT NULL DEFAULT uuid_generate_v4(),
                username character varying COLLATE pg_catalog."default" NOT NULL,
                "firstName" character varying COLLATE pg_catalog."default",
                "lastName" character varying COLLATE pg_catalog."default",
                password character varying COLLATE pg_catalog."default" NOT NULL,
                email character varying COLLATE pg_catalog."default" NOT NULL,
                "emailVerified" boolean NOT NULL DEFAULT false,
                "countUsernameChanged" integer NOT NULL DEFAULT 0,
                avatar text COLLATE pg_catalog."default",
                account "user-schema".user_account_enum NOT NULL DEFAULT 'regular'::"user-schema".user_account_enum,
                "statusId" integer,
                CONSTRAINT "PK_df955cae05f17b2bcf5045cc021" PRIMARY KEY (uid),
                CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE (username),
                CONSTRAINT "UQ_dc18daa696860586ba4667a9d31" UNIQUE ("statusId"),
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email),
                CONSTRAINT "FK_dc18daa696860586ba4667a9d31" FOREIGN KEY ("statusId")
                    REFERENCES "user-schema"."user-status" (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
            )
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('"user-schema"."user"');
    }

}
