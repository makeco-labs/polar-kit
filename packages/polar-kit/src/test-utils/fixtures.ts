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
        product: {
          id: 'free',
          name: 'Free Plan',
          description: 'Perfect for getting started',
          isRecurring: true,
          isArchived: false,
        },
        prices: [
          {
            id: 'free-monthly',
            type: 'recurring',
            amountType: 'free',
            priceCurrency: 'usd',
            recurringInterval: 'month',
            isArchived: false,
          },
        ],
      },
      {
        product: {
          id: 'pro',
          name: 'Pro Plan',
          description: 'For growing businesses',
          isRecurring: true,
          isArchived: false,
        },
        prices: [
          {
            id: 'pro-monthly',
            type: 'recurring',
            amountType: 'fixed',
            priceAmount: 2999, // $29.99
            priceCurrency: 'usd',
            recurringInterval: 'month',
            isArchived: false,
          },
          {
            id: 'pro-yearly',
            type: 'recurring',
            amountType: 'fixed',
            priceAmount: 29_999, // $299.99 (save ~17%)
            priceCurrency: 'usd',
            recurringInterval: 'year',
            isArchived: false,
          },
        ],
      },
    ],

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
      managedByValue: '@makeco/polar-kit-integration-test',
    },
  };
}

/**
 * Simple test plans for quick testing scenarios
 */
export const SIMPLE_TEST_PLANS = [
  {
    product: {
      id: 'test-basic',
      name: 'Test Basic Plan',
      description: 'Simple integration test plan',
      isRecurring: true,
      isArchived: false,
    },
    prices: [
      {
        id: 'test-basic-monthly',
        type: 'recurring',
        amountType: 'fixed',
        priceAmount: 999, // $9.99
        priceCurrency: 'usd',
        recurringInterval: 'month',
        isArchived: false,
      },
    ],
  },
] as const;
