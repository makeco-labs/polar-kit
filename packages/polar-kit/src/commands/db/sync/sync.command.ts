import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { syncPolarSubscriptionPlansAction } from './sync.action';
import { runSyncPreflight, type SyncOptions } from './sync.preflight';

export const sync = new Command()
  .name('sync')
  .description('Sync Polar subscription plans to database')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: SyncOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, organizationId } = await runSyncPreflight(options, command);

      // Execute the action
      await syncPolarSubscriptionPlansAction(ctx, { organizationId });

      console.log(chalk.green('\nOperation completed successfully.'));

      // Ensure process exits
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
