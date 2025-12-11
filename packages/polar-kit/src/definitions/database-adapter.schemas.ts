import type { Product } from '@polar-sh/sdk/models/components/product';
import type { ProductPrice } from '@polar-sh/sdk/models/components/productprice';
import { z } from 'zod';

// ========================================================================
// DATABASE ADAPTER TYPES & SCHEMAS
// ========================================================================

export interface DatabaseAdapter {
  syncProducts(products: Product[]): Promise<void>;
  syncPrices(prices: ProductPrice[]): Promise<void>;
  clearProducts(): Promise<void>;
  clearPrices(): Promise<void>;
  getProducts?(): Promise<unknown[]>;
  getPrices?(): Promise<unknown[]>;
}

// Schema for DatabaseAdapter - accepts any object with the required methods
export const databaseAdapterSchema = z.object({
  syncProducts: z.any().transform((t) => t as DatabaseAdapter['syncProducts']),
  syncPrices: z.any().transform((t) => t as DatabaseAdapter['syncPrices']),
  clearProducts: z
    .any()
    .transform((t) => t as DatabaseAdapter['clearProducts']),
  clearPrices: z.any().transform((t) => t as DatabaseAdapter['clearPrices']),
  getProducts: z
    .any()
    .transform((t) => t as DatabaseAdapter['getProducts'])
    .optional(),
  getPrices: z
    .any()
    .transform((t) => t as DatabaseAdapter['getPrices'])
    .optional(),
});

export type DatabaseAdapterSchema = z.infer<typeof databaseAdapterSchema>;
