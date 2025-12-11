import chalk from 'chalk';
import type { Command as CommandType } from 'commander';
import { Command, Option } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type { Context, EnvironmentKey } from '@/definitions';
import { ENV_CHOICES } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

// ========================================================================
// TYPES
// ========================================================================

interface PurgeDbOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface PurgeDbPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runPurgeDbPreflight(
  options: PurgeDbOptions,
  command: CommandType
): Promise<PurgeDbPreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Determine adapter (auto-select if only one)
  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  // Create context
  const ctx = createContext({ adapter: adapterResult.adapter, config });

  // Verify adapter has required methods
  if (
    !(
      typeof ctx.adapter.clearProducts === 'function' &&
      typeof ctx.adapter.clearPrices === 'function'
    )
  ) {
    throw new Error(
      'Database adapter must implement clearProducts and clearPrices methods'
    );
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'purge database plans',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}

// ========================================================================
// ACTION
// ========================================================================

async function purgeDbAction(ctx: Context): Promise<void> {
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

// ========================================================================
// COMMAND
// ========================================================================

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
