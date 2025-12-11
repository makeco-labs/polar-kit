import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Products table - mirrors the Stripe product structure
export const products = pgTable('products', {
  id: text('id').primaryKey(), // Internal product ID
  stripeId: text('stripe_id').unique(), // Stripe product ID
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  type: text('type').default('service'),
  features: jsonb('features'), // Store features as JSON
  marketingFeatures: jsonb('marketing_features'), // Store marketing features
  metadata: jsonb('metadata'), // Additional metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Prices table - mirrors the Stripe price structure
export const prices = pgTable('prices', {
  id: text('id').primaryKey(), // Internal price ID
  stripeId: text('stripe_id').unique(), // Stripe price ID
  productId: text('product_id').references(() => products.id),
  stripeProductId: text('stripe_product_id'),
  currency: text('currency').notNull(),
  unitAmount: integer('unit_amount'), // Amount in cents
  interval: text('interval'), // month, year, etc
  intervalCount: integer('interval_count').default(1),
  nickname: text('nickname'),
  active: boolean('active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;
