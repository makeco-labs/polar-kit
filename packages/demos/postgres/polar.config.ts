import { defineConfig } from '@makeco/polar-kit';

import type { ProductCreate } from '@makeco/polar-kit';
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
      name: 'Free Plan',
      description: 'Perfect for getting started',
      recurringInterval: 'month',
      prices: [{ amountType: 'free' }],
      metadata: { internal_product_id: 'free' },
    },
    {
      name: 'Pro Plan (Monthly)',
      description: 'For growing businesses',
      recurringInterval: 'month',
      prices: [
        {
          amountType: 'fixed',
          priceAmount: 2999, // $29.99
          priceCurrency: 'usd',
        },
      ],
      metadata: { internal_product_id: 'pro-monthly' },
    },
    {
      name: 'Pro Plan (Annual)',
      description: 'For growing businesses - save with annual billing',
      recurringInterval: 'year',
      prices: [
        {
          amountType: 'fixed',
          priceAmount: 29999, // $299.99 (save ~17%)
          priceCurrency: 'usd',
        },
      ],
      metadata: { internal_product_id: 'pro-yearly' },
    },
    {
      name: 'Enterprise Plan (Monthly)',
      description: 'For large organizations',
      recurringInterval: 'month',
      prices: [
        {
          amountType: 'fixed',
          priceAmount: 9999, // $99.99
          priceCurrency: 'usd',
        },
      ],
      metadata: { internal_product_id: 'enterprise-monthly' },
    },
    {
      name: 'Enterprise Plan (Annual)',
      description: 'For large organizations - save with annual billing',
      recurringInterval: 'year',
      prices: [
        {
          amountType: 'fixed',
          priceAmount: 99999, // $999.99 (save ~17%)
          priceCurrency: 'usd',
        },
      ],
      metadata: { internal_product_id: 'enterprise-yearly' },
    },
  ] satisfies ProductCreate[],

  // Environment variables
  env: {
    polarAccessToken,
    organizationId: polarOrganizationId,
  },

  // Database adapters using Drizzle ORM
  adapters: {
    postgres: postgresAdapter,
  },

  // Map internal plan IDs to product identifiers (optional)
  productIds: {
    free: 'free',
    'pro-monthly': 'pro-monthly',
    'pro-yearly': 'pro-yearly',
    'enterprise-monthly': 'enterprise-monthly',
    'enterprise-yearly': 'enterprise-yearly',
  },

  // Metadata configuration (uses defaults)
  metadata: {
    productIdField: 'internal_product_id',
    priceIdField: 'internal_price_id',
    managedByField: 'managed_by',
    managedByValue: 'polar-kit-postgres-demo',
  },
});
