import type { Context, PolarPrice, PolarProduct } from '@/definitions';

// Helper type for SDK product
interface SDKProduct {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  isArchived: boolean;
  organizationId: string;
  recurringInterval: string | null;
  metadata: Record<string, string | number | boolean>;
  prices?: Array<{
    id: string;
    amountType: string;
    type: string;
    isArchived: boolean;
    priceCurrency?: string;
    priceAmount?: number;
    recurringInterval?: string;
    metadata?: Record<string, string | number | boolean>;
  }>;
}

// ========================================================================
// FIND OPERATIONS (PRECISE SEARCH)
// ========================================================================

// ------------------ FIND POLAR PRODUCT ------------------
export async function findPolarProduct(
  ctx: Context,
  input: { internalProductId: string; organizationId: string }
): Promise<PolarProduct | null> {
  const { internalProductId, organizationId } = input;
  const { metadata } = ctx.config;

  // Polar doesn't have a search API like Stripe, so we list and filter
  const response = await ctx.polarClient.products.list({
    organizationId,
  });

  // Access items from the response
  const items = (response as unknown as { items: SDKProduct[] }).items || [];

  for (const product of items) {
    if (
      product.metadata?.[metadata.productIdField] === internalProductId &&
      product.metadata?.[metadata.managedByField] === metadata.managedByValue &&
      !product.isArchived
    ) {
      return {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        isRecurring: product.isRecurring,
        isArchived: product.isArchived,
        organizationId: product.organizationId,
        recurringInterval: (product.recurringInterval as 'month' | 'year') ?? undefined,
        metadata: product.metadata as Record<string, string | number | boolean>,
      };
    }
  }

  return null;
}

// ------------------ FIND POLAR PRICE ------------------
export async function findPolarPrice(
  ctx: Context,
  input: { internalPriceId: string; polarProductId: string }
): Promise<PolarPrice | null> {
  const { internalPriceId, polarProductId } = input;
  const { metadata } = ctx.config;

  // Get product to access its prices
  const product = (await ctx.polarClient.products.get({
    id: polarProductId,
  })) as unknown as SDKProduct;

  if (!product.prices) {
    return null;
  }

  // Find price by metadata
  for (const p of product.prices) {
    if (
      p.metadata?.[metadata.priceIdField] === internalPriceId &&
      p.metadata?.[metadata.managedByField] === metadata.managedByValue &&
      !p.isArchived
    ) {
      return {
        id: p.id,
        amountType: p.amountType as 'free' | 'fixed' | 'custom',
        type: p.type as 'one_time' | 'recurring',
        priceCurrency: p.priceCurrency || 'usd',
        priceAmount: p.priceAmount,
        recurringInterval: p.recurringInterval as
          | 'day'
          | 'month'
          | 'week'
          | 'year'
          | undefined,
        isArchived: p.isArchived,
        metadata: p.metadata as Record<string, string | number | boolean>,
      };
    }
  }

  return null;
}

// ========================================================================
// LIST OPERATIONS (BULK FETCH WITH PAGINATION)
// ========================================================================

// ------------------ LIST POLAR PRODUCTS ------------------
export async function listPolarProducts(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<PolarProduct[]> {
  const { showAll = false, organizationId } = options;
  ctx.logger.info(
    `Fetching ${showAll ? 'all' : 'managed'} products from Polar...`
  );

  const allPolarProducts: PolarProduct[] = [];

  const response = await ctx.polarClient.products.list({
    organizationId,
  });

  // Access items from the response
  const items = (response as unknown as { items: SDKProduct[] }).items || [];

  for (const product of items) {
    const isManaged =
      product.metadata?.[ctx.config.metadata.productIdField] &&
      product.metadata?.[ctx.config.metadata.managedByField] ===
        ctx.config.metadata.managedByValue;

    if (showAll || isManaged) {
      allPolarProducts.push({
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        isRecurring: product.isRecurring,
        isArchived: product.isArchived,
        organizationId: product.organizationId,
        recurringInterval: (product.recurringInterval as 'month' | 'year') ?? undefined,
        metadata: product.metadata as Record<string, string | number | boolean>,
      });
    }
  }

  return allPolarProducts;
}

// ------------------ LIST POLAR PRICES ------------------
export async function listPolarPrices(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<PolarPrice[]> {
  const { showAll = false, organizationId } = options;
  ctx.logger.info(
    `Fetching ${showAll ? 'all' : 'managed'} prices from Polar...`
  );

  const allPolarPrices: PolarPrice[] = [];

  // Get all products first, then extract prices
  const response = await ctx.polarClient.products.list({
    organizationId,
  });

  // Access items from the response
  const items = (response as unknown as { items: SDKProduct[] }).items || [];

  for (const product of items) {
    if (!product.prices) continue;

    for (const p of product.prices) {
      const isManaged =
        p.metadata?.[ctx.config.metadata.priceIdField] &&
        p.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      if (showAll || isManaged) {
        allPolarPrices.push({
          id: p.id,
          amountType: p.amountType as 'free' | 'fixed' | 'custom',
          type: p.type as 'one_time' | 'recurring',
          priceCurrency: p.priceCurrency || 'usd',
          priceAmount: p.priceAmount,
          recurringInterval: p.recurringInterval as
            | 'day'
            | 'month'
            | 'week'
            | 'year'
            | undefined,
          isArchived: p.isArchived,
          metadata: p.metadata as Record<string, string | number | boolean>,
          productId: product.id,
        });
      }
    }
  }

  return allPolarPrices;
}
