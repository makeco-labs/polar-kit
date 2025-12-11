import chalk from 'chalk';

import type { Context } from '@/definitions';
import { listPolarPrices } from '@/utils';

/**
 * Lists Polar prices
 */
export async function listPolarPricesAction(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<void> {
  const { showAll = false, organizationId } = options;

  try {
    const prices = await listPolarPrices(ctx, { showAll, organizationId });

    if (prices.length === 0) {
      ctx.logger.info('No prices found in Polar.');
      return;
    }

    ctx.logger.info(
      `Found ${prices.length} ${showAll ? '' : 'managed '}prices in Polar:`
    );
    for (const price of prices) {
      const isManaged =
        'metadata' in price &&
        price.metadata?.[ctx.config.metadata.priceIdField] &&
        price.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(price.id)}`);
      console.log(`  ${chalk.dim('Product:')} ${price.productId}`);
      console.log(`  ${chalk.dim('Archived:')} ${price.isArchived}`);
      console.log(`  ${chalk.dim('Amount Type:')} ${price.amountType}`);
      console.log(`  ${chalk.dim('Type:')} ${price.type}`);

      if (price.type === 'recurring' && 'recurringInterval' in price) {
        console.log(`  ${chalk.dim('Interval:')} ${price.recurringInterval}`);
      }

      if (price.amountType === 'fixed' && 'priceAmount' in price) {
        console.log(
          `  ${chalk.dim('Amount:')} ${((price.priceAmount || 0) / 100).toFixed(2)} ${'priceCurrency' in price ? String(price.priceCurrency).toUpperCase() : 'USD'}`
        );
      }

      if ('metadata' in price) {
        console.log(
          `  ${chalk.dim('Internal ID:')} ${price.metadata?.[ctx.config.metadata.priceIdField] || 'N/A'}`
        );
      }

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`
        );
      }

      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}
