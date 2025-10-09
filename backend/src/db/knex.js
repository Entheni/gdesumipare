import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Dreamerftg5582',
    database: process.env.DB_NAME || 'gdesumipare',
  },
  pool: { min: 0, max: 10 },
};

const db = knex(config);

export default db;

