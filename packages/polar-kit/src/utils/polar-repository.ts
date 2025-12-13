import type { Product } from '@polar-sh/sdk/models/components/product';
import type { ProductPrice } from '@polar-sh/sdk/models/components/productprice';

import type { Context } from '@/definitions';

// ========================================================================
// FIND OPERATIONS (PRECISE SEARCH)
// ========================================================================

// ------------------ FIND POLAR PRODUCT ------------------
export async function findPolarProduct(
  ctx: Context,
  input: { internalProductId: string; organizationId: string | undefined }
): Promise<Product | null> {
  const { internalProductId, organizationId } = input;
  const { metadata } = ctx.config;

  // Polar doesn't have a search API, so we list and filter
  // Only include organizationId if provided (not needed for organization tokens)
  const response = await ctx.polarClient.products.list({
    ...(organizationId && { organizationId }),
  });

  // Access items from the response
  const items = (response as unknown as { items: Product[] }).items || [];

  for (const product of items) {
    if (
      product.metadata?.[metadata.productIdField] === internalProductId &&
      product.metadata?.[metadata.managedByField] === metadata.managedByValue &&
      !product.isArchived
    ) {
      return product;
    }
  }

  return null;
}

// ------------------ FIND POLAR PRICE ------------------
export async function findPolarPrice(
  ctx: Context,
  input: { internalPriceId: string; polarProductId: string }
): Promise<ProductPrice | null> {
  const { internalPriceId, polarProductId } = input;
  const { metadata } = ctx.config;

  // Get product to access its prices
  const product = await ctx.polarClient.products.get({
    id: polarProductId,
  });

  if (!product.prices) {
    return null;
  }

  // Find price by metadata
  for (const price of product.prices) {
    const priceMetadata = (price as { metadata?: Record<string, unknown> })
      .metadata;
    if (
      priceMetadata?.[metadata.priceIdField] === internalPriceId &&
      priceMetadata?.[metadata.managedByField] === metadata.managedByValue &&
      !(price as { isArchived?: boolean }).isArchived
    ) {
      return price as ProductPrice;
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
  options: { showAll?: boolean; organizationId: string | undefined }
): Promise<Product[]> {
  const { showAll = false, organizationId } = options;
  ctx.logger.info(
    `Fetching ${showAll ? 'all' : 'managed'} products from Polar...`
  );

  const allPolarProducts: Product[] = [];

  // Only include organizationId if provided (not needed for organization tokens)
  const response = await ctx.polarClient.products.list({
    ...(organizationId && { organizationId }),
  });

  // Access items from the response
  const items = (response as unknown as { items: Product[] }).items || [];

  for (const product of items) {
    const isManaged =
      product.metadata?.[ctx.config.metadata.productIdField] &&
      product.metadata?.[ctx.config.metadata.managedByField] ===
        ctx.config.metadata.managedByValue;

    if (showAll || isManaged) {
      allPolarProducts.push(product);
    }
  }

  return allPolarProducts;
}

// ------------------ LIST POLAR PRICES ------------------
export async function listPolarPrices(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string | undefined }
): Promise<ProductPrice[]> {
  const { showAll = false, organizationId } = options;
  ctx.logger.info(
    `Fetching ${showAll ? 'all' : 'managed'} prices from Polar...`
  );

  const allPolarPrices: ProductPrice[] = [];

  // Get all products first, then extract prices
  // Only include organizationId if provided (not needed for organization tokens)
  const response = await ctx.polarClient.products.list({
    ...(organizationId && { organizationId }),
  });

  // Access items from the response
  const items = (response as unknown as { items: Product[] }).items || [];

  for (const product of items) {
    if (!product.prices) {
      continue;
    }

    for (const price of product.prices) {
      const priceMetadata = (price as { metadata?: Record<string, unknown> })
        .metadata;
      const isManaged =
        priceMetadata?.[ctx.config.metadata.priceIdField] &&
        priceMetadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      if (showAll || isManaged) {
        allPolarPrices.push(price as ProductPrice);
      }
    }
  }

  return allPolarPrices;
}
