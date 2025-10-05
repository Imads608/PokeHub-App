export interface PostgresDBConfiguration {
  db: DBCredentials;
}

interface DBCredentials {
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
}
