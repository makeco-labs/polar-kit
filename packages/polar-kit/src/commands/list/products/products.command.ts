import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { listPolarProductsAction } from './products.action';
import {
  type ListProductsOptions,
  runListProductsPreflight,
} from './products.preflight';

export const products = new Command()
  .name('products')
  .description('List Polar products')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('--all', 'Show all items in Polar account')
  .action(async (options: ListProductsOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll, organizationId } = await runListProductsPreflight(
        options,
        command
      );

      // Execute the action
      await listPolarProductsAction(ctx, { showAll, organizationId });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
