import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { archivePolarSubscriptionPlans } from './archive.action';
import { type ArchiveOptions, runArchivePreflight } from './archive.preflight';

export const archive = new Command()
  .name('archive')
  .description('Archive Polar subscription plans')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: ArchiveOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, productIdsToArchive, organizationId } = await runArchivePreflight(
        options,
        command
      );

      // Execute the action
      await archivePolarSubscriptionPlans(ctx, {
        internalProductIds: productIdsToArchive,
        organizationId,
      });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
