import { defineConfig } from '@makeco/polar-kit';
// This import chain should cause the ESM resolution issue:
// polar.config.ts -> ./src/database-adapter.ts -> @demo/esm-db (workspace package)
import { serverDatabaseAdapter } from './src/database-adapter';

export const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
export const polarOrganizationId = process.env.POLAR_ORGANIZATION_ID;

if (!polarAccessToken) {
  throw new Error('POLAR_ACCESS_TOKEN is not defined');
}

if (!polarOrganizationId) {
  throw new Error('POLAR_ORGANIZATION_ID is not defined');
}

export default defineConfig({
  plans: [
    {
      product: {
        id: 'basic',
        name: 'Basic Plan',
        description: 'ESM test plan',
        isRecurring: true,
        isArchived: false,
      },
      prices: [
        {
          id: 'basic-monthly',
          type: 'recurring',
          amountType: 'fixed',
          priceAmount: 999, // $9.99
          priceCurrency: 'usd',
          recurringInterval: 'month',
          isArchived: false,
        },
      ],
    },
  ],

  // Environment variables
  env: {
    polarAccessToken,
    organizationId: polarOrganizationId,
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
    managedByValue: 'polar-kit-esm-demo',
  },
});
