import { z } from 'zod';

// ========================================================================
// POLAR PRODUCT SCHEMAS
// ========================================================================

// ------------------ Benefit Reference ------------------
export const benefitSchema = z.object({
  id: z.string(),
});

export type Benefit = z.infer<typeof benefitSchema>;

// ------------------ Media Reference ------------------
export const mediaSchema = z.object({
  id: z.string(),
});

export type Media = z.infer<typeof mediaSchema>;

// ========================================================================
// MAIN POLAR PRODUCT SCHEMA
// ========================================================================

export const polarProductSchema = z.object({
  // Required fields
  id: z.string(),
  name: z.string(),

  // Optional core fields
  description: z.string().optional(),

  // Polar-specific configuration
  isRecurring: z.boolean().default(true),
  isArchived: z.boolean().default(false),

  // Organization (required for API calls)
  organizationId: z.string().optional(),

  // Recurring configuration
  recurringInterval: z.enum(['month', 'year']).optional(),

  // Associated benefits and media
  benefits: z.array(z.string()).optional(),
  medias: z.array(z.string()).optional(),

  // Extensibility
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export type PolarProduct = z.infer<typeof polarProductSchema>;

// ========================================================================
// POLAR PRODUCT CREATE INPUT TYPE
// ========================================================================

export interface PolarProductCreateInput {
  name: string;
  organizationId?: string;
  recurringInterval?: 'month' | 'year';
  description?: string;
  metadata?: Record<string, string | number | boolean>;
  prices?: Array<PolarPriceCreateInput>;
  medias?: string[];
  attachedCustomFields?: Array<{ customFieldId: string; required: boolean }>;
}

export interface PolarPriceCreateInput {
  type: 'one_time' | 'recurring';
  amountType: 'free' | 'fixed' | 'custom';
  recurringInterval?: 'month' | 'year' | 'week' | 'day';
  priceCurrency?: string;
  priceAmount?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  presetAmount?: number;
}

// ========================================================================
// MAPPER TYPES
// ========================================================================

export interface PolarProductMapperContext {
  internalProductId: string;
  organizationId: string;
}

export type PolarProductMapper = (
  product: PolarProduct,
  context: PolarProductMapperContext
) => PolarProductCreateInput;
