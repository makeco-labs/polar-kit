import { defineConfig } from '@makeco/polar-kit';
import { postgresAdapter } from './src/database-adapter';

export const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
export const polarOrganizationId = process.env.POLAR_ORGANIZATION_ID;

if (!polarAccessToken) {
  throw new Error('POLAR_ACCESS_TOKEN is not defined');
}

if (!polarOrganizationId) {
  throw new Error('POLAR_ORGANIZATION_ID is not defined');
}

export default defineConfig({
  // Complete subscription plan setup demonstrating all features
  plans: [
    {
      product: {
        id: 'free',
        name: 'Free Plan',
        description: 'Perfect for getting started',
      },
      prices: [
        {
          id: 'free-monthly',
          type: 'recurring',
          amountType: 'free',
          recurringInterval: 'month',
        },
      ],
    },
    {
      product: {
        id: 'pro',
        name: 'Pro Plan',
        description: 'For growing businesses',
      },
      prices: [
        {
          id: 'pro-monthly',
          type: 'recurring',
          amountType: 'fixed',
          priceAmount: 2999, // $29.99
          priceCurrency: 'usd',
          recurringInterval: 'month',
        },
        {
          id: 'pro-yearly',
          type: 'recurring',
          amountType: 'fixed',
          priceAmount: 29999, // $299.99 (save ~17%)
          priceCurrency: 'usd',
          recurringInterval: 'year',
        },
      ],
    },
    {
      product: {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'For large organizations',
      },
      prices: [
        {
          id: 'enterprise-monthly',
          type: 'recurring',
          amountType: 'fixed',
          priceAmount: 9999, // $99.99
          priceCurrency: 'usd',
          recurringInterval: 'month',
        },
        {
          id: 'enterprise-yearly',
          type: 'recurring',
          amountType: 'fixed',
          priceAmount: 99999, // $999.99 (save ~17%)
          priceCurrency: 'usd',
          recurringInterval: 'year',
        },
      ],
    },
  ],

  // Environment variables
  env: {
    polarAccessToken,
    polarOrganizationId,
  },

  // Database adapters using Drizzle ORM
  adapters: {
    postgres: postgresAdapter,
  },

  // Map internal plan IDs to product identifiers (optional)
  productIds: {
    free: 'free',
    pro: 'pro',
    enterprise: 'enterprise',
  },

  // Metadata configuration (uses defaults)
  metadata: {
    productIdField: 'internal_product_id',
    priceIdField: 'internal_price_id',
    managedByField: 'managed_by',
    managedByValue: 'polar-kit-postgres-demo',
  },
});
