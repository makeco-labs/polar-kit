import type { Context } from '@/definitions';
import { listPolarPrices, listPolarProducts } from '@/utils';

/**
 * Syncs managed subscription plans from Polar to the database
 */
export async function syncPolarSubscriptionPlansAction(
  ctx: Context,
  input: { organizationId: string }
): Promise<void> {
  const { organizationId } = input;
  ctx.logger.info('Syncing Polar subscription plans to database...');

  try {
    // Fetch managed products from Polar (only those managed by this tool)
    ctx.logger.info('Fetching managed products from Polar...');
    const polarProducts = await listPolarProducts(ctx, {
      showAll: false,
      organizationId,
    });
    ctx.logger.info(
      `Found ${polarProducts.length} managed products in Polar`
    );

    // Fetch managed prices from Polar (only those managed by this tool)
    ctx.logger.info('Fetching managed prices from Polar...');
    const polarPrices = await listPolarPrices(ctx, {
      showAll: false,
      organizationId,
    });
    ctx.logger.info(`Found ${polarPrices.length} managed prices in Polar`);

    // Sync products to database
    ctx.logger.info('Syncing products to database...');
    await ctx.adapter.syncProducts(polarProducts);
    ctx.logger.info('Products synced successfully');

    // Sync prices to database
    ctx.logger.info('Syncing prices to database...');
    await ctx.adapter.syncPrices(polarPrices);
    ctx.logger.info('Prices synced successfully');

    ctx.logger.info(
      `Successfully synced ${polarProducts.length} products and ${polarPrices.length} prices from Polar to database`
    );
  } catch (error) {
    ctx.logger.error(
      'Error syncing Polar subscription plans to database:',
      error
    );
    throw error;
  }
}
