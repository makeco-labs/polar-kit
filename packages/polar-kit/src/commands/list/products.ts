import chalk from 'chalk';
import type { Command as CommandType } from 'commander';
import { Command, Option } from 'commander';
import { determineEnvironment } from '@/cli-prompts';
import type { Context, DatabaseAdapter, EnvironmentKey } from '@/definitions';
import { ENV_CHOICES } from '@/definitions';
import {
  createContext,
  listPolarProducts,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// TYPES
// ========================================================================

interface ListProductsOptions {
  env?: EnvironmentKey;
  all?: boolean;
}

interface ListProductsPreflightResult {
  ctx: Context;
  showAll: boolean;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runListProductsPreflight(
  options: ListProductsOptions,
  command: CommandType
): Promise<ListProductsPreflightResult> {
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

async function listPolarProductsAction(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<void> {
  const { showAll = false, organizationId } = options;

  try {
    const products = await listPolarProducts(ctx, { showAll, organizationId });

    if (products.length === 0) {
      ctx.logger.info('No products found in Polar.');
      return;
    }

    ctx.logger.info(
      `Found ${products.length} ${showAll ? '' : 'managed '}products in Polar:`
    );
    for (const product of products) {
      const isManaged =
        product.metadata?.[ctx.config.metadata.productIdField] &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(product.id)}`);
      console.log(`  ${chalk.dim('Name:')} ${product.name}`);
      console.log(`  ${chalk.dim('Archived:')} ${product.isArchived}`);
      console.log(
        `  ${chalk.dim('Description:')} ${product.description || 'N/A'}`
      );
      console.log(
        `  ${chalk.dim('Recurring:')} ${product.isRecurring ? 'Yes' : 'No'}`
      );
      console.log(
        `  ${chalk.dim('Internal ID:')} ${product.metadata?.[ctx.config.metadata.productIdField] || 'N/A'}`
      );

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`
        );
      }

      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing products:', error);
    throw error;
  }
}

// ========================================================================
// COMMAND
// ========================================================================

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
