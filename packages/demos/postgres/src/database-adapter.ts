import { eq } from 'drizzle-orm';
import { db } from './db-connection';
import { prices, products } from './db-schema';

import type { DatabaseAdapter } from '@makeco/stripe-kit';

/**
 * PostgreSQL database adapter using Drizzle ORM
 * This demonstrates how to sync Stripe data to your database
 */
export const postgresAdapter: DatabaseAdapter = {
  async syncProducts(stripeProducts) {
    for (const stripeProduct of stripeProducts) {
      const internalId = stripeProduct.metadata?.internal_product_id;
      if (!internalId) {
        continue;
      }

      // Check if product exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, internalId))
        .limit(1);

      const productData = {
        id: internalId,
        stripeId: stripeProduct.id,
        name: stripeProduct.name,
        description: stripeProduct.description || null,
        active: stripeProduct.active ?? true,
        type: stripeProduct.type || 'service',
        features: stripeProduct.metadata?.features
          ? JSON.parse(stripeProduct.metadata.features)
          : null,
        marketingFeatures: stripeProduct.marketing_features || null,
        metadata: stripeProduct.metadata || null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing product
        await db
          .update(products)
          .set(productData)
          .where(eq(products.id, internalId));
      } else {
        // Insert new product
        await db.insert(products).values({
          ...productData,
          createdAt: new Date(),
        });
      }
    }
  },

  async syncPrices(stripePrices) {
    for (const stripePrice of stripePrices) {
      const internalId = stripePrice.metadata?.internal_price_id;
      const internalProductId = stripePrice.metadata?.internal_product_id;

      if (!(internalId || internalProductId)) {
        continue;
      }

      // Check if price exists
      const existing = await db
        .select()
        .from(prices)
        .where(eq(prices.id, internalId))
        .limit(1);

      const priceData = {
        id: internalId,
        stripeId: stripePrice.id,
        productId: internalProductId,
        stripeProductId:
          typeof stripePrice.product === 'string'
            ? stripePrice.product
            : stripePrice.product?.id,
        currency: stripePrice.currency,
        unitAmount: stripePrice.unit_amount || null,
        interval: stripePrice.recurring?.interval || null,
        intervalCount: stripePrice.recurring?.interval_count || 1,
        nickname: stripePrice.nickname || null,
        active: stripePrice.active ?? true,
        metadata: stripePrice.metadata || null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing price
        await db.update(prices).set(priceData).where(eq(prices.id, internalId));
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
