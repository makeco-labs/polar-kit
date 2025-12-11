import { z } from 'zod';

import type { DatabaseAdapter } from './database-adapter.schemas';
import { databaseAdapterSchema } from './database-adapter.schemas';
import type { PolarPrice } from './polar-price.schemas';
import { polarPriceSchema } from './polar-price.schemas';
import {
  type PolarPriceCreateInput,
  type PolarProductCreateInput,
  polarProductSchema,
} from './polar-product.schemas';
import type { Prettify } from './utility.types';

// ========================================================================
// SUBSCRIPTION PLAN SCHEMA (COMBINES PRODUCT + PRICES)
// ========================================================================

export const subscriptionPlanSchema = z.object({
  // Product configuration
  product: polarProductSchema,

  // Associated prices
  prices: z.array(polarPriceSchema).min(1),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// ========================================================================
// POLAR MAPPER TYPES
// ========================================================================

export interface PolarPriceContext {
  polarProductId: string;
  internalProductId: string;
  planName: string;
  tier: string;
}

export interface PolarMappers {
  mapSubscriptionPlanToPolarProduct: (
    plan: SubscriptionPlan
  ) => PolarProductCreateInput;
  mapSubscriptionPlanToPolarPrice: (
    price: PolarPrice,
    context: PolarPriceContext
  ) => PolarPriceCreateInput;
}

// ========================================================================
// MAIN CONFIGURATION SCHEMA
// ========================================================================

export const configSchema = z.object({
  plans: z.array(subscriptionPlanSchema),
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
      managedByValue: z.string().default('@makeco/polar-kit'),
    })
    .default({
      productIdField: 'internal_product_id',
      priceIdField: 'internal_price_id',
      managedByField: 'managed_by',
      managedByValue: '@makeco/polar-kit',
    }),
});

export type Config = Prettify<
  Omit<z.infer<typeof configSchema>, 'adapters'> & {
    adapters: Record<string, DatabaseAdapter>;
  }
>;
