import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db-schema';

export type Database = typeof db;

// Create the database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

// Create the postgres.js client
const client = postgres(connectionString);

// Create the Drizzle database instance
export const db = drizzle(client, { schema });
