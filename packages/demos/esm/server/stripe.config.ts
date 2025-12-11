import { defineConfig } from '@makeco/stripe-kit';
// This import chain should cause the ESM resolution issue:
// stripe.config.ts -> ./src/database-adapter.ts -> @demo/esm-db (workspace package)
import { serverDatabaseAdapter } from './src/database-adapter';

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export default defineConfig({
  plans: [
    {
      product: {
        id: 'basic',
        name: 'Basic Plan',
        description: 'ESM test plan',
        active: true,
        type: 'service',
        marketingFeatures: [
          { name: '10 projects' },
          { name: 'Basic support' },
        ],
        features: {
          maxProjects: 10,
          supportLevel: 'basic',
        },
        metadata: {
          plan_category: 'paid',
          target_audience: 'individual',
        },
      },
      prices: [
        {
          id: 'basic-monthly',
          currency: 'usd',
          type: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: 999, // $9.99
          recurring: {
            interval: 'month',
            intervalCount: 1,
            usageType: 'licensed',
          },
          nickname: 'Basic Monthly',
          active: true,
          metadata: {
            billing_cycle: 'monthly',
          },
        },
      ],
    },
  ],

  // Environment variables
  env: {
    stripeSecretKey,
  },

  // Use the server database adapter that imports from workspace package
  adapters: {
    postgres: serverDatabaseAdapter,
  },

  // Product mapping
  productIds: {
    basic: 'basic',
  },

  // Metadata configuration
  metadata: {
    productIdField: 'internal_product_id',
    priceIdField: 'internal_price_id',
    managedByField: 'managed_by',
    managedByValue: 'stripe-kit-esm-demo',
  },
});