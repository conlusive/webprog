import 'dotenv/config';
import pgPromise from 'pg-promise';

export const pgp = pgPromise();

// Параметри підключення беруться зі змінних середовища (.env або compose.yaml)
const db = pgp({
  host: process.env.DB_HOST || 'localhost',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  connectionTimeoutMillis: 3000, // не чекати базу вічно
});

export default db;
