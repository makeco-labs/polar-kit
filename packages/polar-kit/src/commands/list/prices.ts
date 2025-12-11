import chalk from 'chalk';
import type { Command as CommandType } from 'commander';
import { Command, Option } from 'commander';
import { determineEnvironment } from '@/cli-prompts';
import type { Context, DatabaseAdapter, EnvironmentKey } from '@/definitions';
import { ENV_CHOICES } from '@/definitions';
import {
  createContext,
  listPolarPrices,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// TYPES
// ========================================================================

interface ListPricesOptions {
  env?: EnvironmentKey;
  all?: boolean;
}

interface ListPricesPreflightResult {
  ctx: Context;
  showAll: boolean;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runListPricesPreflight(
  options: ListPricesOptions,
  command: CommandType
): Promise<ListPricesPreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Create context without specific adapter (doesn't need database)
  const ctx = createContext({
    adapter: Object.values(config.adapters)[0] as DatabaseAdapter,
    config,
  });

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  return {
    ctx,
    showAll: !!options.all,
    chosenEnv,
    organizationId,
  };
}

// ========================================================================
// ACTION
// ========================================================================

async function listPolarPricesAction(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<void> {
  const { showAll = false, organizationId } = options;

  try {
    const prices = await listPolarPrices(ctx, { showAll, organizationId });

    if (prices.length === 0) {
      ctx.logger.info('No prices found in Polar.');
      return;
    }

    ctx.logger.info(
      `Found ${prices.length} ${showAll ? '' : 'managed '}prices in Polar:`
    );
    for (const price of prices) {
      const isManaged =
        'metadata' in price &&
        price.metadata?.[ctx.config.metadata.priceIdField] &&
        price.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(price.id)}`);
      console.log(`  ${chalk.dim('Product:')} ${price.productId}`);
      console.log(`  ${chalk.dim('Archived:')} ${price.isArchived}`);
      console.log(`  ${chalk.dim('Amount Type:')} ${price.amountType}`);
      console.log(`  ${chalk.dim('Type:')} ${price.type}`);

      if (price.type === 'recurring' && 'recurringInterval' in price) {
        console.log(`  ${chalk.dim('Interval:')} ${price.recurringInterval}`);
      }

      if (price.amountType === 'fixed' && 'priceAmount' in price) {
        console.log(
          `  ${chalk.dim('Amount:')} ${((price.priceAmount || 0) / 100).toFixed(2)} ${'priceCurrency' in price ? String(price.priceCurrency).toUpperCase() : 'USD'}`
        );
      }

      if ('metadata' in price) {
        console.log(
          `  ${chalk.dim('Internal ID:')} ${price.metadata?.[ctx.config.metadata.priceIdField] || 'N/A'}`
        );
      }

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`
        );
      }

      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}

// ========================================================================
// COMMAND
// ========================================================================

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
