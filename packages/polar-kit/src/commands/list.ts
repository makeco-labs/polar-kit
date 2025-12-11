import chalk from 'chalk';
import type { Command as CommandType } from 'commander';
import { Command, Option } from 'commander';
import { determineEnvironment } from '@/cli-prompts';
import type { Context, DatabaseAdapter, EnvironmentKey } from '@/definitions';
import { ENV_CHOICES } from '@/definitions';
import {
  createContext,
  listPolarPrices,
  listPolarProducts,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// PRODUCTS
// ========================================================================

// ------------------ TYPES ------------------

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

// ------------------ PREFLIGHT ------------------

async function runListProductsPreflight(
  options: ListProductsOptions,
  command: CommandType
): Promise<ListProductsPreflightResult> {
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  const chosenEnv = await determineEnvironment({ envInput: options.env });
  loadEnvironment(chosenEnv);

  const config = await loadConfig({ configPath });
  const ctx = createContext({
    adapter: Object.values(config.adapters)[0] as DatabaseAdapter,
    config,
  });

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

// ------------------ ACTION ------------------

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

// ------------------ COMMAND ------------------

const products = new Command()
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
      const { ctx, showAll, organizationId } = await runListProductsPreflight(
        options,
        command
      );
      await listPolarProductsAction(ctx, { showAll, organizationId });
      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

// ========================================================================
// PRICES
// ========================================================================

// ------------------ TYPES ------------------

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

// ------------------ PREFLIGHT ------------------

async function runListPricesPreflight(
  options: ListPricesOptions,
  command: CommandType
): Promise<ListPricesPreflightResult> {
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  const chosenEnv = await determineEnvironment({ envInput: options.env });
  loadEnvironment(chosenEnv);

  const config = await loadConfig({ configPath });
  const ctx = createContext({
    adapter: Object.values(config.adapters)[0] as DatabaseAdapter,
    config,
  });

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

// ------------------ ACTION ------------------

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

// ------------------ COMMAND ------------------

const prices = new Command()
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
      const { ctx, showAll, organizationId } = await runListPricesPreflight(
        options,
        command
      );
      await listPolarPricesAction(ctx, { showAll, organizationId });
      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

// ========================================================================
// PARENT COMMAND
// ========================================================================

export const list = new Command()
  .name('list')
  .description('List Polar resources')
  .addCommand(products)
  .addCommand(prices)
  .action(() => {
    list.help();
    process.exit(0);
  });
