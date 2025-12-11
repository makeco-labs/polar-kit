import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Product } from '@polar-sh/sdk/models/components/product';
import type { ProductPrice } from '@polar-sh/sdk/models/components/productprice';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { DatabaseAdapter } from '@/definitions';

// Products table - mirrors the Polar product structure
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), // Internal product ID
  polarId: text('polar_id').unique(), // Polar product ID
  name: text('name').notNull(),
  description: text('description'),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(true),
  organizationId: text('organization_id'),
  recurringInterval: text('recurring_interval'), // month, year
  metadata: text('metadata'), // JSON string for additional metadata
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Prices table - mirrors the Polar price structure
export const prices = sqliteTable('prices', {
  id: text('id').primaryKey(), // Internal price ID
  polarId: text('polar_id').unique(), // Polar price ID
  productId: text('product_id').references(() => products.id),
  polarProductId: text('polar_product_id'),
  amountType: text('amount_type').notNull(), // free, fixed, custom
  priceCurrency: text('price_currency'),
  priceAmount: integer('price_amount'), // Amount in cents
  recurringInterval: text('recurring_interval'), // month, year
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type ProductRecord = typeof products.$inferSelect;
export type NewProductRecord = typeof products.$inferInsert;
export type PriceRecord = typeof prices.$inferSelect;
export type NewPriceRecord = typeof prices.$inferInsert;

/**
 * Creates a test SQLite database with schema
 */
export function createTestDatabase(): {
  db: ReturnType<typeof drizzle>;
  path: string;
  sqlite: Database.Database;
} {
  const dbPath = join(
    tmpdir(),
    `polar-kit-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`
  );
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Create tables
  sqlite.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      polar_id TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      is_archived BOOLEAN DEFAULT 0,
      is_recurring BOOLEAN DEFAULT 1,
      organization_id TEXT,
      recurring_interval TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE prices (
      id TEXT PRIMARY KEY,
      polar_id TEXT UNIQUE,
      product_id TEXT REFERENCES products(id),
      polar_product_id TEXT,
      amount_type TEXT NOT NULL,
      price_currency TEXT,
      price_amount INTEGER,
      recurring_interval TEXT,
      is_archived BOOLEAN DEFAULT 0,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return { db, path: dbPath, sqlite };
}

/**
 * Cleanup test database
 */
export function cleanupTestDatabase(
  dbPath: string,
  sqlite?: Database.Database
) {
  if (sqlite) {
    try {
      sqlite.close();
    } catch {
      // Database already closed
    }
  }

  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
    } catch {
      // File already deleted or in use
    }
  }
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Converts Polar product data to database format
 */
function buildProductData(polarProduct: Product, internalId: string) {
  return {
    id: internalId,
    polarId: polarProduct.id,
    name: polarProduct.name,
    description: polarProduct.description || null,
    isArchived: polarProduct.isArchived ?? false,
    isRecurring: polarProduct.isRecurring ?? true,
    organizationId: polarProduct.organizationId || null,
    recurringInterval: polarProduct.recurringInterval || null,
    metadata: polarProduct.metadata
      ? JSON.stringify(polarProduct.metadata)
      : null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Converts Polar price data to database format
 */
function buildPriceData(
  polarPrice: ProductPrice,
  internalId: string,
  internalProductId: string,
  polarProductId: string
) {
  const priceAny = polarPrice as Record<string, unknown>;
  return {
    id: internalId,
    polarId: priceAny.id as string,
    productId: internalProductId,
    polarProductId,
    amountType: priceAny.amountType as string,
    priceCurrency: (priceAny.priceCurrency as string) || null,
    priceAmount: (priceAny.priceAmount as number) || null,
    recurringInterval: null, // Recurring interval is on product, not price
    isArchived: (priceAny.isArchived as boolean) ?? false,
    metadata: priceAny.metadata ? JSON.stringify(priceAny.metadata) : null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates or inserts a product record
 */
async function upsertProduct(
  db: ReturnType<typeof drizzle>,
  productData: NewProductRecord,
  internalId: string
) {
  const existing = await db
    .select()
    .from(products)
    .where(eq(products.id, internalId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(products)
      .set(productData)
      .where(eq(products.id, internalId));
  } else {
    await db.insert(products).values({
      ...productData,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Updates or inserts a price record
 */
async function upsertPrice(
  db: ReturnType<typeof drizzle>,
  priceData: NewPriceRecord,
  internalId: string
) {
  const existing = await db
    .select()
    .from(prices)
    .where(eq(prices.id, internalId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(prices).set(priceData).where(eq(prices.id, internalId));
  } else {
    await db.insert(prices).values({
      ...priceData,
      createdAt: new Date().toISOString(),
    });
  }
}

// ========================================================================
// DATABASE ADAPTER
// ========================================================================

/**
 * SQLite database adapter for testing - mirrors postgres adapter structure
 */
export function createSQLiteAdapter(
  db: ReturnType<typeof drizzle>
): DatabaseAdapter {
  return {
    async syncProducts(polarProducts) {
      for (const polarProduct of polarProducts) {
        const internalId = polarProduct.metadata?.internal_product_id as
          | string
          | undefined;
        if (!internalId) {
          continue;
        }

        const productData = buildProductData(polarProduct, internalId);
        await upsertProduct(db, productData, internalId);
      }
    },

    async syncPrices(polarPrices) {
      for (const polarPrice of polarPrices) {
        const priceAny = polarPrice as Record<string, unknown>;
        const metadata = priceAny.metadata as
          | Record<string, unknown>
          | undefined;

        const internalId = metadata?.internal_price_id as string | undefined;
        const internalProductId = metadata?.internal_product_id as
          | string
          | undefined;

        if (!(internalId && internalProductId)) {
          continue;
        }

        const priceData = buildPriceData(
          polarPrice,
          internalId,
          internalProductId,
          '' // polarProductId not available from price alone
        );
        await upsertPrice(db, priceData, internalId);
      }
    },

    async clearProducts() {
      await db.delete(products);
    },

    async clearPrices() {
      await db.delete(prices);
    },

    async getProducts() {
      const allProducts = await db.select().from(products);
      return allProducts;
    },

    async getPrices() {
      const allPrices = await db.select().from(prices);
      return allPrices;
    },
  };
}
