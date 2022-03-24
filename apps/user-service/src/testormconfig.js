module.exports = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'pokehub',
    migrationsTableName: 'migrations',
    migrations: ['database/migrations/generated/*.js'],
    cli: {
      migrationsDir: 'database/migrations/src',
    },
    synchronize: false,
};
/*
const config = {
  type: 'postgres',
  host: process.env.RDS_HOST,
  port: Number(process.env.RDS_PORT),
  username: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
  dropSchema: false,
  logging: process.env.NODE_ENV === 'development' ? true : false,
  entities: [`${__dirname}/src/**//**.entity{.ts,.js}`],
  migrations: [`${__dirname}/src/migrations/**//*{.ts,.js}`],
  cli: {
    migrationsDir: 'src/migrations',
  },
}

module.exports = config
*/