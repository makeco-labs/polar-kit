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
// TYPES
// ========================================================================

interface SyncOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface SyncPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runSyncPreflight(
  options: SyncOptions,
  command: CommandType
): Promise<SyncPreflightResult> {
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

  // Verify Polar client is available
  if (!ctx.polarClient) {
    throw new Error(
      'Polar client not available. Check POLAR_ACCESS_TOKEN environment variable.'
    );
  }

  // Verify adapter has required methods
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

  // Verify Polar access token is configured
  if (!ctx.config.env.polarAccessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is not configured in environment');
  }

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  // Production confirmation
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

// ========================================================================
// ACTION
// ========================================================================

async function syncPolarSubscriptionPlansAction(
  ctx: Context,
  input: { organizationId: string }
): Promise<void> {
  const { organizationId } = input;
  ctx.logger.info('Syncing Polar subscription plans to database...');

  try {
    // Fetch managed products from Polar (only those managed by this tool)
    ctx.logger.info('Fetching managed products from Polar...');
    const polarProducts = await listPolarProducts(ctx, {
      showAll: false,
      organizationId,
    });
    ctx.logger.info(`Found ${polarProducts.length} managed products in Polar`);

    // Fetch managed prices from Polar (only those managed by this tool)
    ctx.logger.info('Fetching managed prices from Polar...');
    const polarPrices = await listPolarPrices(ctx, {
      showAll: false,
      organizationId,
    });
    ctx.logger.info(`Found ${polarPrices.length} managed prices in Polar`);

    // Sync products to database
    ctx.logger.info('Syncing products to database...');
    await ctx.adapter.syncProducts(polarProducts);
    ctx.logger.info('Products synced successfully');

    // Sync prices to database
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

// ========================================================================
// COMMAND
// ========================================================================

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
