import type { Product } from '@polar-sh/sdk/models/components/product';
import type { ProductCreate } from '@polar-sh/sdk/models/components/productcreate';
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
  listPolarProducts,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// TYPES
// ========================================================================

interface UpdateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface UpdatePreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
  organizationId: string | undefined;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runUpdatePreflight(
  options: UpdateOptions,
  command: CommandType
): Promise<UpdatePreflightResult> {
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

  // Verify Polar access token is configured
  if (!ctx.config.env.polarAccessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is not configured in environment');
  }

  // Get organization ID (optional - not needed for organization tokens)
  const organizationId = ctx.config.env.organizationId;

  // Verify plans are configured
  if (!ctx.config.plans || ctx.config.plans.length === 0) {
    throw new Error(
      'No subscription plans configured. Check your config file.'
    );
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'update Polar plans',
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

// ------------------ Update Polar Product ------------------
async function updatePolarProduct(
  ctx: Context,
  plan: ProductCreate,
  allPolarProducts: Product[]
): Promise<void> {
  const internalProductId = plan.metadata?.[ctx.config.metadata.productIdField];

  try {
    // Find the product that matches our internal ID
    const polarProduct = allPolarProducts.find(
      (product) =>
        product.metadata?.[ctx.config.metadata.productIdField] ===
          internalProductId &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue
    );

    if (!polarProduct) {
      ctx.logger.warn(
        `Polar product not found for ${internalProductId}. Skipping update.`
      );
      return;
    }

    // Update the product
    await ctx.polarClient.products.update({
      id: polarProduct.id,
      productUpdate: {
        name: plan.name,
        description: plan.description,
        metadata: {
          ...plan.metadata,
          [ctx.config.metadata.managedByField]:
            ctx.config.metadata.managedByValue,
        },
      },
    });

    ctx.logger.info(`Updated Polar product: ${polarProduct.id}`);
  } catch (error) {
    ctx.logger.error({
      message: 'Error updating Polar product',
      error,
      productId: String(internalProductId),
    });
    throw new Error(`Failed to update Polar product: ${error}`);
  }
}

// ------------------ Update Polar Subscription Plans ------------------
async function updatePolarSubscriptionPlansAction(
  ctx: Context,
  input: { organizationId: string | undefined }
): Promise<void> {
  const { organizationId } = input;
  const plans = ctx.config.plans;

  ctx.logger.info(`Updating ${plans.length} subscription plans in Polar...`);

  try {
    // Fetch all managed products once to avoid multiple API calls
    const allPolarProducts = await listPolarProducts(ctx, {
      showAll: false,
      organizationId,
    });

    ctx.logger.info(
      `Found ${allPolarProducts.length} managed products in Polar`
    );

    // Update each plan
    for (const plan of plans) {
      const internalProductId =
        plan.metadata?.[ctx.config.metadata.productIdField];
      ctx.logger.info(
        `Updating plan: ${plan.name} (Internal ID: ${internalProductId ?? 'none'})...`
      );

      // Update the product
      await updatePolarProduct(ctx, plan, allPolarProducts);
    }

    ctx.logger.info('Finished updating subscription plans in Polar');
  } catch (error) {
    ctx.logger.error('Error updating Polar subscription plans:', error);
    throw error;
  }
}

// ========================================================================
// COMMAND
// ========================================================================

export const update = new Command()
  .name('update')
  .description('Update Polar subscription plans')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: UpdateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, organizationId } = await runUpdatePreflight(
        options,
        command
      );

      // Execute the action
      await updatePolarSubscriptionPlansAction(ctx, { organizationId });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
