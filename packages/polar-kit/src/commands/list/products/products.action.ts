import chalk from 'chalk';

import type { Context } from '@/definitions';
import { listPolarProducts } from '@/utils';

/**
 * Lists Polar products
 */
export async function listPolarProductsAction(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<void> {
  const { showAll = false, organizationId } = options;

  try {
    const products = await listPolarProducts(ctx, { showAll, organizationId });

    if (products.length === 0) {
      ctx.logger.info('No products found in Polar.');
      return;
    }

    ctx.logger.info(
      `Found ${products.length} ${showAll ? '' : 'managed '}products in Polar:`
    );
    for (const product of products) {
      const isManaged =
        product.metadata?.[ctx.config.metadata.productIdField] &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(product.id)}`);
      console.log(`  ${chalk.dim('Name:')} ${product.name}`);
      console.log(`  ${chalk.dim('Archived:')} ${product.isArchived}`);
      console.log(
        `  ${chalk.dim('Description:')} ${product.description || 'N/A'}`
      );
      console.log(
        `  ${chalk.dim('Recurring:')} ${product.isRecurring ? 'Yes' : 'No'}`
      );
      console.log(
        `  ${chalk.dim('Internal ID:')} ${product.metadata?.[ctx.config.metadata.productIdField] || 'N/A'}`
      );

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`
        );
      }

      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing products:', error);
    throw error;
  }
}
