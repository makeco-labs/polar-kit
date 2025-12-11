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
import {
  createContext,
  listPolarPrices,
  listPolarProducts,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// SYNC
// ========================================================================

// ------------------ TYPES ------------------

interface SyncOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface SyncPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

// ------------------ PREFLIGHT ------------------

async function runSyncPreflight(
  options: SyncOptions,
  command: CommandType
): Promise<SyncPreflightResult> {
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  const chosenEnv = await determineEnvironment({ envInput: options.env });
  loadEnvironment(chosenEnv);

  const config = await loadConfig({ configPath });

  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  const ctx = createContext({ adapter: adapterResult.adapter, config });

  if (!ctx.polarClient) {
    throw new Error(
      'Polar client not available. Check POLAR_ACCESS_TOKEN environment variable.'
    );
  }

  if (
    !(
      typeof ctx.adapter.syncProducts === 'function' &&
      typeof ctx.adapter.syncPrices === 'function'
    )
  ) {
    throw new Error(
      'Database adapter must implement syncProducts and syncPrices methods'
    );
  }

  if (!ctx.config.env.polarAccessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is not configured in environment');
  }

  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  await requireProductionConfirmation({
    action: 'sync Polar plans to database',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
    organizationId,
  };
}

// ------------------ ACTION ------------------

async function syncPolarSubscriptionPlansAction(
  ctx: Context,
  input: { organizationId: string }
): Promise<void> {
  const { organizationId } = input;
  ctx.logger.info('Syncing Polar subscription plans to database...');

  try {
    ctx.logger.info('Fetching managed products from Polar...');
    const polarProducts = await listPolarProducts(ctx, {
      showAll: false,
      organizationId,
    });
    ctx.logger.info(`Found ${polarProducts.length} managed products in Polar`);

    ctx.logger.info('Fetching managed prices from Polar...');
    const polarPrices = await listPolarPrices(ctx, {
      showAll: false,
      organizationId,
    });
    ctx.logger.info(`Found ${polarPrices.length} managed prices in Polar`);

    ctx.logger.info('Syncing products to database...');
    await ctx.adapter.syncProducts(polarProducts);
    ctx.logger.info('Products synced successfully');

    ctx.logger.info('Syncing prices to database...');
    await ctx.adapter.syncPrices(polarPrices);
    ctx.logger.info('Prices synced successfully');

    ctx.logger.info(
      `Successfully synced ${polarProducts.length} products and ${polarPrices.length} prices from Polar to database`
    );
  } catch (error) {
    ctx.logger.error(
      'Error syncing Polar subscription plans to database:',
      error
    );
    throw error;
  }
}

// ------------------ COMMAND ------------------

const sync = new Command()
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
      const { ctx, organizationId } = await runSyncPreflight(options, command);
      await syncPolarSubscriptionPlansAction(ctx, { organizationId });
      console.log(chalk.green('\nOperation completed successfully.'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

// ========================================================================
// PURGE
// ========================================================================

// ------------------ TYPES ------------------

interface PurgeDbOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface PurgeDbPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

// ------------------ PREFLIGHT ------------------

async function runPurgeDbPreflight(
  options: PurgeDbOptions,
  command: CommandType
): Promise<PurgeDbPreflightResult> {
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  const chosenEnv = await determineEnvironment({ envInput: options.env });
  loadEnvironment(chosenEnv);

  const config = await loadConfig({ configPath });

  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  const ctx = createContext({ adapter: adapterResult.adapter, config });

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

  await requireProductionConfirmation({
    action: 'purge database plans',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}

// ------------------ ACTION ------------------

async function purgeDbAction(ctx: Context): Promise<void> {
  ctx.logger.info('Clearing subscription plans from database...');

  try {
    ctx.logger.info('Clearing prices from database...');
    await ctx.adapter.clearPrices();
    ctx.logger.info('Prices cleared successfully');

    ctx.logger.info('Clearing products from database...');
    await ctx.adapter.clearProducts();
    ctx.logger.info('Products cleared successfully');

    ctx.logger.info('All subscription plans cleared from database');
  } catch (error) {
    ctx.logger.error('Error clearing subscription plans from database:', error);
    throw error;
  }
}

// ------------------ COMMAND ------------------

const purge = new Command()
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
      const { ctx } = await runPurgeDbPreflight(options, command);
      await purgeDbAction(ctx);
      console.log(chalk.green('\nOperation completed successfully.'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

// ========================================================================
// PARENT COMMAND
// ========================================================================

export const db = new Command()
  .name('db')
  .description('Database operations')
  .addCommand(sync)
  .addCommand(purge)
  .action(() => {
    db.help();
    process.exit(0);
  });
