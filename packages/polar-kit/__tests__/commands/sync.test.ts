import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupTestDatabase,
  cli,
  createSQLiteAdapter,
  createTestDatabase,
  getTestOrganizationId,
  getTestPolarToken,
  products,
} from '../helpers';

describe('polar-kit sync', () => {
  let testDb: ReturnType<typeof createTestDatabase>['db'];
  let testDbPath: string;
  let sqlite: ReturnType<typeof createTestDatabase>['sqlite'];
  let configPath: string;

  beforeEach(() => {
    const db = createTestDatabase();
    testDb = db.db;
    testDbPath = db.path;
    sqlite = db.sqlite;

    configPath = cli.createTempConfig({
      plans: [
        {
          product: { id: 'sync-test', name: 'Sync Test' },
          prices: [
            {
              id: 'sync-test-price',
              amountType: 'fixed',
              priceCurrency: 'usd',
              priceAmount: 1999,
              recurringInterval: 'month',
            },
          ],
        },
      ],
      env: {
        polarAccessToken: getTestPolarToken(),
        organizationId: getTestOrganizationId(),
      },
      adapters: { sqlite: createSQLiteAdapter(testDb) },
      metadata: { managedByValue: '@makeco/polar-kit-sync-test' },
    });
  });

  afterEach(() => {
    cleanupTestDatabase(testDbPath, sqlite);
    cli.cleanupTempConfig(configPath);
  });

  it('syncs Polar data to database', async () => {
    // First create products
    cli.create({ env: 'test', config: configPath });

    // Then sync
    const result = cli.sync({
      env: 'test',
      adapter: 'sqlite',
      config: configPath,
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('sync');

    // Verify database has data
    const productsResult = await testDb.select().from(products);
    expect(productsResult.length).toBeGreaterThan(0);
  });
});
