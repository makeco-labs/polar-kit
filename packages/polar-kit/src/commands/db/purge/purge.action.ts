import type { Context } from '@/definitions';

/**
 * Purges all subscription plans from the database
 */
export async function purgeDbAction(ctx: Context): Promise<void> {
  ctx.logger.info('Clearing subscription plans from database...');

  try {
    // Clear prices first (due to foreign key constraints)
    ctx.logger.info('Clearing prices from database...');
    await ctx.adapter.clearPrices();
    ctx.logger.info('Prices cleared successfully');

    // Clear products
    ctx.logger.info('Clearing products from database...');
    await ctx.adapter.clearProducts();
    ctx.logger.info('Products cleared successfully');

    ctx.logger.info('All subscription plans cleared from database');
  } catch (error) {
    ctx.logger.error('Error clearing subscription plans from database:', error);
    throw error;
  }
}
