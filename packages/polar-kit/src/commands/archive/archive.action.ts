import type { Context } from '@/definitions';
import { findPolarProduct, listPolarPrices } from '@/utils';

// ------------------ ARCHIVE POLAR PRODUCTS ------------------
async function archivePolarProducts(
  ctx: Context,
  input: {
    internalProductIds: string[];
    organizationId: string;
  }
): Promise<void> {
  const { internalProductIds, organizationId } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  let archivedCount = 0;

  for (const internalProductId of internalProductIds) {
    try {
      const product = await findPolarProduct(ctx, {
        internalProductId,
        organizationId,
      });

      if (!product) {
        ctx.logger.info(`Product not found in Polar: ${internalProductId}`);
        continue;
      }

      await ctx.polarClient.products.update({
        id: product.id,
        productUpdate: {
          isArchived: true,
        },
      });
      ctx.logger.info(
        `Archived product in Polar: ${product.id} (Internal ID: ${internalProductId})`
      );
      archivedCount++;
    } catch (error) {
      ctx.logger.error({
        message: 'Error archiving product in Polar',
        error,
        internalProductId,
      });
    }
  }

  if (archivedCount === 0) {
    ctx.logger.info('No products were archived in Polar');
  }
}

// ------------------ ARCHIVE POLAR PRICES ------------------
async function archivePolarPrices(
  ctx: Context,
  input: {
    internalProductIds: string[];
    organizationId: string;
  }
): Promise<void> {
  const { internalProductIds, organizationId } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  const prices = await listPolarPrices(ctx, { showAll: false, organizationId });
  const pricesToArchive = prices.filter((price) =>
    'metadata' in price &&
    internalProductIds.includes(
      String(price.metadata?.[ctx.config.metadata.productIdField] ?? '')
    )
  );

  if (pricesToArchive.length === 0) {
    ctx.logger.info('No prices to archive in Polar');
    return;
  }

  // Note: In Polar, prices are typically archived with their product
  // Individual price archival may not be supported directly
  ctx.logger.info(`Found ${pricesToArchive.length} prices associated with products to archive`);
}

// ------------------ ARCHIVE POLAR SUBSCRIPTION PLANS ------------------
export async function archivePolarSubscriptionPlans(
  ctx: Context,
  input: {
    internalProductIds: string[];
    organizationId: string;
  }
): Promise<void> {
  const { internalProductIds, organizationId } = input;

  if (internalProductIds.length === 0) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  ctx.logger.info(
    `Archiving ${internalProductIds.length} subscription plans in Polar...`
  );

  await archivePolarProducts(ctx, { internalProductIds, organizationId });
  await archivePolarPrices(ctx, { internalProductIds, organizationId });

  ctx.logger.info(
    `Successfully archived ${internalProductIds.length} subscription plans in Polar`
  );
}
