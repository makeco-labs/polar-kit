import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { listPolarPricesAction } from './prices.action';
import {
  type ListPricesOptions,
  runListPricesPreflight,
} from './prices.preflight';

export const prices = new Command()
  .name('prices')
  .description('List Polar prices')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('--all', 'Show all items in Polar account')
  .action(async (options: ListPricesOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll, organizationId } = await runListPricesPreflight(
        options,
        command
      );

      // Execute the action
      await listPolarPricesAction(ctx, { showAll, organizationId });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
