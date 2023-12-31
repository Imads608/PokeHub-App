import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "pokehub",
    database: "users",
    synchronize: false,
    schema: 'user-schema',
    logging: true, 
    migrations: ["libs/user/database/src/lib/migration/*.ts"],
})