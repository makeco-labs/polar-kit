import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { ensurePolarSubscriptionPlans } from './create.action';
import { type CreateOptions, runCreatePreflight } from './create.preflight';

export const create = new Command()
  .name('create')
  .description('Create Polar subscription plans (Idempotent)')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: CreateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, plans, organizationId } = await runCreatePreflight(options, command);

      // Execute the action
      await ensurePolarSubscriptionPlans(ctx, { plans, organizationId });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
