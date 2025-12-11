import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { purgeDbAction } from './purge.action';
import { type PurgeDbOptions, runPurgeDbPreflight } from './purge.preflight';

export const purge = new Command()
  .name('purge')
  .description('Delete subscription plans from database')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: PurgeDbOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runPurgeDbPreflight(options, command);

      // Execute the action
      await purgeDbAction(ctx);

      console.log(chalk.green('\nOperation completed successfully.'));

      // Ensure process exits
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
