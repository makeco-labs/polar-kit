import type { ProductPrice } from '@polar-sh/sdk/models/components/productprice';
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

// ------------------ HELPERS ------------------

function displayPrice(
  price: ProductPrice,
  productId: string,
  ctx: Context,
  showAll: boolean
): void {
  // Type-safe access to common and variant-specific properties
  const priceAny = price as Record<string, unknown>;
  const id = priceAny.id as string;
  const amountType = priceAny.amountType as string;
  const isArchived = priceAny.isArchived as boolean | undefined;
  const metadata = priceAny.metadata as Record<string, unknown> | undefined;

  const isManaged =
    metadata?.[ctx.config.metadata.priceIdField] &&
    metadata?.[ctx.config.metadata.managedByField] ===
      ctx.config.metadata.managedByValue;

  console.log(`${chalk.bold(id)}`);
  console.log(`  ${chalk.dim('Product:')} ${productId}`);
  console.log(`  ${chalk.dim('Archived:')} ${isArchived ?? 'N/A'}`);
  console.log(`  ${chalk.dim('Amount Type:')} ${amountType}`);

  // Fixed price specific
  if (amountType === 'fixed') {
    const priceAmount = priceAny.priceAmount as number | undefined;
    const priceCurrency = priceAny.priceCurrency as string | undefined;
    if (priceAmount !== undefined) {
      console.log(
        `  ${chalk.dim('Amount:')} ${(priceAmount / 100).toFixed(2)} ${(priceCurrency || 'USD').toUpperCase()}`
      );
    }
  }

  // Custom price specific
  if (amountType === 'custom') {
    const minimumAmount = priceAny.minimumAmount as number | undefined;
    const maximumAmount = priceAny.maximumAmount as number | undefined;
    if (minimumAmount !== undefined) {
      console.log(
        `  ${chalk.dim('Min Amount:')} ${(minimumAmount / 100).toFixed(2)}`
      );
    }
    if (maximumAmount !== undefined) {
      console.log(
        `  ${chalk.dim('Max Amount:')} ${(maximumAmount / 100).toFixed(2)}`
      );
    }
  }

  if (metadata) {
    console.log(
      `  ${chalk.dim('Internal ID:')} ${(metadata[ctx.config.metadata.priceIdField] as string) || 'N/A'}`
    );
  }

  if (showAll) {
    console.log(
      `  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`
    );
  }

  console.log('');
}

// ------------------ ACTION ------------------

async function listPolarPricesAction(
  ctx: Context,
  options: { showAll?: boolean; organizationId: string }
): Promise<void> {
  const { showAll = false, organizationId } = options;

  try {
    // Get products to access their prices (prices are embedded in products)
    const polarProducts = await listPolarProducts(ctx, {
      showAll,
      organizationId,
    });

    let totalPrices = 0;

    ctx.logger.info(
      `Listing ${showAll ? 'all' : 'managed'} prices from Polar...`
    );

    for (const product of polarProducts) {
      if (!product.prices || product.prices.length === 0) {
        continue;
      }

      for (const price of product.prices) {
        const priceAny = price as Record<string, unknown>;
        const metadata = priceAny.metadata as
          | Record<string, unknown>
          | undefined;

        const isManaged =
          metadata?.[ctx.config.metadata.priceIdField] &&
          metadata?.[ctx.config.metadata.managedByField] ===
            ctx.config.metadata.managedByValue;

        if (showAll || isManaged) {
          displayPrice(price as ProductPrice, product.id, ctx, showAll);
          totalPrices++;
        }
      }
    }

    if (totalPrices === 0) {
      ctx.logger.info('No prices found in Polar.');
    } else {
      ctx.logger.info(`Found ${totalPrices} prices in Polar.`);
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
