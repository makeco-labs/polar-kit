import { eq } from 'drizzle-orm';
import { db } from './db-connection';
import { prices, products } from './db-schema';

import type { DatabaseAdapter } from '@makeco/polar-kit';

/**
 * PostgreSQL database adapter using Drizzle ORM
 * This demonstrates how to sync Polar data to your database
 */
export const postgresAdapter: DatabaseAdapter = {
  async syncProducts(polarProducts) {
    for (const polarProduct of polarProducts) {
      const internalId = polarProduct.metadata?.internal_product_id;
      if (!internalId) {
        continue;
      }

      // Check if product exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, String(internalId)))
        .limit(1);

      const productData = {
        id: String(internalId),
        polarId: polarProduct.id,
        name: polarProduct.name,
        description: polarProduct.description || null,
        active: !polarProduct.isArchived,
        type: 'service',
        features: null,
        marketingFeatures: null,
        metadata: polarProduct.metadata || null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing product
        await db
          .update(products)
          .set(productData)
          .where(eq(products.id, String(internalId)));
      } else {
        // Insert new product
        await db.insert(products).values({
          ...productData,
          createdAt: new Date(),
        });
      }
    }
  },

  async syncPrices(polarPrices) {
    for (const polarPrice of polarPrices) {
      const internalId = polarPrice.metadata?.internal_price_id;
      const internalProductId = polarPrice.metadata?.internal_product_id;

      if (!(internalId || internalProductId)) {
        continue;
      }

      // Check if price exists
      const existing = await db
        .select()
        .from(prices)
        .where(eq(prices.id, String(internalId)))
        .limit(1);

      const priceData = {
        id: String(internalId),
        polarId: polarPrice.id,
        productId: internalProductId ? String(internalProductId) : null,
        polarProductId: polarPrice.productId,
        currency: polarPrice.priceCurrency || 'usd',
        unitAmount: polarPrice.priceAmount || null,
        interval: polarPrice.recurringInterval || null,
        intervalCount: 1,
        nickname: null,
        active: !polarPrice.isArchived,
        metadata: polarPrice.metadata || null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing price
        await db.update(prices).set(priceData).where(eq(prices.id, String(internalId)));
      } else {
        // Insert new price
        await db.insert(prices).values({
          ...priceData,
          createdAt: new Date(),
        });
      }
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
