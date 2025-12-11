import type { Config } from '@/definitions';
import {
  createSQLiteAdapter,
  type createTestDatabase,
  getTestStripeKey,
} from '../helpers';

/**
 * Creates a test configuration for real Stripe integration testing
 * Uses SQLite database with real Stripe API calls
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
          active: true,
          type: 'service',
          marketingFeatures: [
            { name: '5 projects' },
            { name: 'Basic support' },
            { name: '1GB storage' },
            { name: 'Community access' },
          ],
          features: {
            maxProjects: 5,
            storageGB: 1,
            supportLevel: 'basic',
            communityAccess: true,
            apiAccess: false,
            customIntegrations: false,
          },
          metadata: {
            plan_category: 'freemium',
            target_audience: 'individual',
            trial_eligible: 'false',
            popular_plan: 'false',
          },
        },
        prices: [
          {
            id: 'free-monthly',
            currency: 'usd',
            type: 'recurring',
            billingScheme: 'per_unit',
            unitAmount: 0, // Free tier
            recurring: {
              interval: 'month',
              intervalCount: 1,
              usageType: 'licensed',
            },
            nickname: 'Free Monthly',
            active: true,
            metadata: {
              billing_cycle: 'monthly',
              is_free_tier: 'true',
              discount_percent: '0',
            },
          },
        ],
      },
      {
        product: {
          id: 'pro',
          name: 'Pro Plan',
          description: 'For growing businesses',
          active: true,
          type: 'service',
          marketingFeatures: [
            { name: 'Unlimited projects' },
            { name: 'Priority support' },
            { name: '50GB storage' },
            { name: 'Advanced analytics' },
            { name: 'API access' },
            { name: 'Custom integrations' },
          ],
          features: {
            maxProjects: -1, // unlimited
            storageGB: 50,
            supportLevel: 'priority',
            communityAccess: true,
            apiAccess: true,
            customIntegrations: true,
            advancedAnalytics: true,
          },
          metadata: {
            plan_category: 'paid',
            target_audience: 'small-business',
            trial_eligible: 'true',
            popular_plan: 'true',
          },
        },
        prices: [
          {
            id: 'pro-monthly',
            currency: 'usd',
            type: 'recurring',
            billingScheme: 'per_unit',
            unitAmount: 2999, // $29.99
            recurring: {
              interval: 'month',
              intervalCount: 1,
              usageType: 'licensed',
            },
            nickname: 'Pro Monthly',
            active: true,
            taxBehavior: 'exclusive',
            metadata: {
              billing_cycle: 'monthly',
              is_promotional: 'false',
              discount_percent: '0',
            },
          },
          {
            id: 'pro-yearly',
            currency: 'usd',
            type: 'recurring',
            billingScheme: 'per_unit',
            unitAmount: 29_999, // $299.99 (save ~17%)
            recurring: {
              interval: 'year',
              intervalCount: 1,
              usageType: 'licensed',
            },
            nickname: 'Pro Annual',
            active: true,
            taxBehavior: 'exclusive',
            metadata: {
              billing_cycle: 'yearly',
              is_promotional: 'true',
              discount_percent: '17',
            },
          },
        ],
      },
    ],

    // Real test environment variables
    env: {
      stripeSecretKey: getTestStripeKey(),
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
      managedByValue: '@makeco/stripe-kit-integration-test',
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
      active: true,
      type: 'service',
    },
    prices: [
      {
        id: 'test-basic-monthly',
        currency: 'usd',
        type: 'recurring',
        billingScheme: 'per_unit',
        unitAmount: 999, // $9.99
        recurring: {
          interval: 'month',
          intervalCount: 1,
          usageType: 'licensed',
        },
        nickname: 'Test Basic Monthly',
        active: true,
      },
    ],
  },
] as const;
