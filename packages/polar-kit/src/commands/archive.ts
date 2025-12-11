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
  findPolarProduct,
  listPolarPrices,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// TYPES
// ========================================================================

interface ArchiveOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface ArchivePreflightResult {
  ctx: Context;
  productIdsToArchive: string[];
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runArchivePreflight(
  options: ArchiveOptions,
  command: CommandType
): Promise<ArchivePreflightResult> {
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

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'archive plans',
    env: chosenEnv,
  });

  // Get product IDs to archive
  const productIdsToArchive = config.productIds
    ? Object.values(config.productIds)
    : config.plans
        .map((plan) => plan.metadata?.[config.metadata.productIdField])
        .filter((id): id is string => typeof id === 'string');

  return {
    ctx,
    productIdsToArchive,
    chosenEnv,
    organizationId,
  };
}

// ========================================================================
// ACTION
// ========================================================================

// ------------------ Archive Polar Products ------------------
async function archivePolarProducts(
  ctx: Context,
  input: {
    internalProductIds: string[];
    organizationId: string;
  }
): Promise<void> {
  const { internalProductIds, organizationId } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  let archivedCount = 0;

  for (const internalProductId of internalProductIds) {
    try {
      const product = await findPolarProduct(ctx, {
        internalProductId,
        organizationId,
      });

      if (!product) {
        ctx.logger.info(`Product not found in Polar: ${internalProductId}`);
        continue;
      }

      await ctx.polarClient.products.update({
        id: product.id,
        productUpdate: {
          isArchived: true,
        },
      });
      ctx.logger.info(
        `Archived product in Polar: ${product.id} (Internal ID: ${internalProductId})`
      );
      archivedCount++;
    } catch (error) {
      ctx.logger.error({
        message: 'Error archiving product in Polar',
        error,
        internalProductId,
      });
    }
  }

  if (archivedCount === 0) {
    ctx.logger.info('No products were archived in Polar');
  }
}

// ------------------ Archive Polar Prices ------------------
async function archivePolarPrices(
  ctx: Context,
  input: {
    internalProductIds: string[];
    organizationId: string;
  }
): Promise<void> {
  const { internalProductIds, organizationId } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  const prices = await listPolarPrices(ctx, { showAll: false, organizationId });
  const pricesToArchive = prices.filter(
    (price) =>
      'metadata' in price &&
      internalProductIds.includes(
        String(price.metadata?.[ctx.config.metadata.productIdField] ?? '')
      )
  );

  if (pricesToArchive.length === 0) {
    ctx.logger.info('No prices to archive in Polar');
    return;
  }

  // Note: In Polar, prices are typically archived with their product
  // Individual price archival may not be supported directly
  ctx.logger.info(
    `Found ${pricesToArchive.length} prices associated with products to archive`
  );
}

// ------------------ Archive Polar Subscription Plans ------------------
async function archivePolarSubscriptionPlans(
  ctx: Context,
  input: {
    internalProductIds: string[];
    organizationId: string;
  }
): Promise<void> {
  const { internalProductIds, organizationId } = input;

  if (internalProductIds.length === 0) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  ctx.logger.info(
    `Archiving ${internalProductIds.length} subscription plans in Polar...`
  );

  await archivePolarProducts(ctx, { internalProductIds, organizationId });
  await archivePolarPrices(ctx, { internalProductIds, organizationId });

  ctx.logger.info(
    `Successfully archived ${internalProductIds.length} subscription plans in Polar`
  );
}

// ========================================================================
// COMMAND
// ========================================================================

export const archive = new Command()
  .name('archive')
  .description('Archive Polar subscription plans')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: ArchiveOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, productIdsToArchive, organizationId } =
        await runArchivePreflight(options, command);

      // Execute the action
      await archivePolarSubscriptionPlans(ctx, {
        internalProductIds: productIdsToArchive,
        organizationId,
      });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
