import knex from 'knex';
import dotenv from 'dotenv';
import { getDatabaseConnection } from '../config/env.js';
dotenv.config();

const config = {
  client: 'pg',
  connection: getDatabaseConnection(),
  pool: { min: 0, max: 10 },
};

const db = knex(config);

export default db;
