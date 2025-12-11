import type { ProductCreate } from '@polar-sh/sdk/models/components/productcreate';
import { z } from 'zod';
import type { DatabaseAdapter } from './database-adapter.schemas';
import { databaseAdapterSchema } from './database-adapter.schemas';
import type { Prettify } from './utility.types';

// ========================================================================
// MAIN CONFIGURATION SCHEMA
// ========================================================================

export const configSchema = z.object({
  // Plans are ProductCreate[] from Polar SDK - validated at runtime by SDK
  plans: z.array(z.any()),
  env: z.object({
    polarAccessToken: z.string(),
    organizationId: z.string().optional(),
  }),
  adapters: z.record(z.string(), databaseAdapterSchema),
  productIds: z.record(z.string(), z.string()).optional(),
  metadata: z
    .object({
      productIdField: z.string().default('internal_product_id'),
      priceIdField: z.string().default('internal_price_id'),
      managedByField: z.string().default('managed_by'),
      managedByValue: z.string().default('polar-kit'),
    })
    .default({
      productIdField: 'internal_product_id',
      priceIdField: 'internal_price_id',
      managedByField: 'managed_by',
      managedByValue: 'polar-kit',
    }),
});

export type Config = Prettify<
  Omit<z.infer<typeof configSchema>, 'adapters' | 'plans'> & {
    adapters: Record<string, DatabaseAdapter>;
    plans: ProductCreate[];
  }
>;
