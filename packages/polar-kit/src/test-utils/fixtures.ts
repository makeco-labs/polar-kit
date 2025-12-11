import type { ProductCreate } from '@polar-sh/sdk/models/components/productcreate';

import type { Config } from '@/definitions';
import {
  createSQLiteAdapter,
  type createTestDatabase,
  getTestOrganizationId,
  getTestPolarToken,
} from './helpers';

/**
 * Creates a test configuration for real Polar integration testing
 * Uses SQLite database with real Polar API calls
 */
export function createTestConfig(
  db: ReturnType<typeof createTestDatabase>['db']
): Config {
  return {
    plans: [
      {
        name: 'Free Plan',
        description: 'Perfect for getting started',
        recurringInterval: 'month',
        prices: [{ amountType: 'free' }],
        metadata: {
          internal_product_id: 'free',
        },
      },
      {
        name: 'Pro Plan',
        description: 'For growing businesses',
        recurringInterval: 'month',
        prices: [
          {
            amountType: 'fixed',
            priceAmount: 2999, // $29.99
            priceCurrency: 'usd',
          },
        ],
        metadata: {
          internal_product_id: 'pro-monthly',
        },
      },
      {
        name: 'Pro Plan (Annual)',
        description: 'For growing businesses - save with annual billing',
        recurringInterval: 'year',
        prices: [
          {
            amountType: 'fixed',
            priceAmount: 29_999, // $299.99 (save ~17%)
            priceCurrency: 'usd',
          },
        ],
        metadata: {
          internal_product_id: 'pro-yearly',
        },
      },
    ] satisfies ProductCreate[],

    // Real test environment variables
    env: {
      polarAccessToken: getTestPolarToken(),
      organizationId: getTestOrganizationId(),
    },

    // SQLite adapter for testing
    adapters: {
      sqlite: createSQLiteAdapter(db),
    },

    // Test metadata configuration
    metadata: {
      productIdField: 'internal_product_id',
      priceIdField: 'internal_price_id',
      managedByField: 'managed_by',
      managedByValue: 'polar-kit-integration-test',
    },
  };
}

/**
 * Simple test plans for quick testing scenarios
 */
export const SIMPLE_TEST_PLANS: ProductCreate[] = [
  {
    name: 'Test Basic Plan',
    description: 'Simple integration test plan',
    recurringInterval: 'month',
    prices: [
      {
        amountType: 'fixed',
        priceAmount: 999, // $9.99
        priceCurrency: 'usd',
      },
    ],
    metadata: {
      internal_product_id: 'test-basic',
    },
  },
];
