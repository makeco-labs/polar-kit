import { join } from 'node:path';
import { config } from 'dotenv';

// Load test environment variables
config({ path: join(__dirname, '../.env.test') });

// Ensure required environment variables are set
if (!process.env.POLAR_ACCESS_TOKEN) {
  console.warn(
    'Warning: POLAR_ACCESS_TOKEN not found in environment. Using default test token.'
  );
  process.env.POLAR_ACCESS_TOKEN = 'polar_at_test_your_token_here';
}

if (!process.env.POLAR_ORGANIZATION_ID) {
  console.warn(
    'Warning: POLAR_ORGANIZATION_ID not found in environment. Using default.'
  );
  process.env.POLAR_ORGANIZATION_ID = 'your_org_id_here';
}

if (!process.env.DATABASE_URL) {
  console.warn(
    'Warning: DATABASE_URL not found in environment. Using default.'
  );
  process.env.DATABASE_URL = 'file:./test-database.db';
}

// Set test environment
process.env.NODE_ENV = 'test';
