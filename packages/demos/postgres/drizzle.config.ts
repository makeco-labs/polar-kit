import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db-schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
