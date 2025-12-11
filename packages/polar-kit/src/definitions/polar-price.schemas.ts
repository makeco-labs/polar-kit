import { z } from 'zod';

// ========================================================================
// POLAR PRICE SCHEMAS
// ========================================================================

// ------------------ Recurring Configuration ------------------
export const recurringSchema = z.object({
  interval: z.enum(['day', 'month', 'week', 'year']),
  intervalCount: z.number().min(1).default(1),
});

export type Recurring = z.infer<typeof recurringSchema>;

// ========================================================================
// MAIN POLAR PRICE SCHEMA
// ========================================================================

export const polarPriceSchema = z.object({
  // Required fields
  id: z.string(),

  // Product ID (from Polar)
  productId: z.string().optional(),

  // Amount type: free, fixed, or custom
  amountType: z.enum(['free', 'fixed', 'custom']).default('fixed'),

  // Currency and amount (for fixed prices)
  priceCurrency: z.string().length(3).default('usd'),
  priceAmount: z.number().min(0).optional(),

  // For custom amount type
  minimumAmount: z.number().min(0).optional(),
  maximumAmount: z.number().min(0).optional(),
  presetAmount: z.number().min(0).optional(),

  // Price type
  type: z.enum(['one_time', 'recurring']).default('recurring'),

  // Recurring configuration
  recurringInterval: z.enum(['day', 'month', 'week', 'year']).optional(),

  // Status
  isArchived: z.boolean().default(false),

  // Extensibility
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export type PolarPrice = z.infer<typeof polarPriceSchema>;
