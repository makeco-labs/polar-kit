import chalk from 'chalk';
import type { Command as CommandType } from 'commander';
import { Command, Option } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type {
  Context,
  EnvironmentKey,
  PolarPrice,
  PolarProduct,
  SubscriptionPlan,
} from '@/definitions';
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

interface UpdateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface UpdatePreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
  organizationId: string;
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

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  // Verify plans are configured
  if (!ctx.config.plans || ctx.config.plans.length === 0) {
    throw new Error(
      'No subscription plans configured. Check your config file.'
    );
  }

  // Verify mappers are available
  if (
    !(
      typeof ctx.mappers.mapSubscriptionPlanToPolarProduct === 'function' &&
      typeof ctx.mappers.mapSubscriptionPlanToPolarPrice === 'function'
    )
  ) {
    throw new Error('Polar mappers not available. Check your configuration.');
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
  plan: SubscriptionPlan,
  allPolarProducts: PolarProduct[]
): Promise<void> {
  try {
    // Generate Polar product parameters from the plan
    const polarProductParams =
      ctx.mappers.mapSubscriptionPlanToPolarProduct(plan);

    // Find the product that matches our internal ID
    const polarProduct = allPolarProducts.find(
      (product) =>
        product.metadata?.[ctx.config.metadata.productIdField] ===
          plan.product.id &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue
    );

    if (!polarProduct) {
      ctx.logger.warn(
        `Polar product not found for ${plan.product.id}. Skipping update.`
      );
      return;
    }

    // Update the product
    await ctx.polarClient.products.update({
      id: polarProduct.id,
      productUpdate: {
        name: polarProductParams.name,
        description: polarProductParams.description,
        metadata: polarProductParams.metadata,
      },
    });

    ctx.logger.info(`Updated Polar product: ${polarProduct.id}`);
  } catch (error) {
    ctx.logger.error({
      message: 'Error updating Polar product',
      error,
      productId: plan.product.id,
    });
    throw new Error(`Failed to update Polar product: ${error}`);
  }
}

// ------------------ Update Polar Prices ------------------
function updatePolarPrices(
  ctx: Context,
  plan: SubscriptionPlan,
  allPolarPrices: PolarPrice[]
): void {
  try {
    // For each price in the plan
    for (const planPrice of plan.prices) {
      // Find matching Polar price by internal ID
      const polarPrice = allPolarPrices.find(
        (price) =>
          price.metadata?.[ctx.config.metadata.priceIdField] === planPrice.id &&
          price.metadata?.[ctx.config.metadata.managedByField] ===
            ctx.config.metadata.managedByValue
      );

      if (!polarPrice) {
        ctx.logger.warn(
          `Polar price not found for ${planPrice.id}. Skipping update.`
        );
        continue;
      }

      // Note: Polar may have limited price update capabilities
      // Log that the price was found
      ctx.logger.info(
        `Found Polar price: ${polarPrice.id} (metadata updates may be limited)`
      );
    }
  } catch (error) {
    ctx.logger.error({
      message: 'Error updating Polar prices',
      error,
      planId: plan.product.id,
    });
    throw new Error(`Failed to update Polar prices: ${error}`);
  }
}

// ------------------ Update Polar Subscription Plans ------------------
async function updatePolarSubscriptionPlansAction(
  ctx: Context,
  input: { organizationId: string }
): Promise<void> {
  const { organizationId } = input;
  const plans = ctx.config.plans;

  ctx.logger.info(`Updating ${plans.length} subscription plans in Polar...`);

  try {
    // Fetch all managed products and prices once to avoid multiple API calls
    const allPolarProducts = await listPolarProducts(ctx, {
      showAll: false,
      organizationId,
    });
    const allPolarPrices = await listPolarPrices(ctx, {
      showAll: false,
      organizationId,
    });

    ctx.logger.info(
      `Found ${allPolarProducts.length} managed products and ${allPolarPrices.length} managed prices in Polar`
    );

    // Update each plan
    for (const plan of plans) {
      ctx.logger.info(
        `Updating plan: ${plan.product.name} (Internal ID: ${plan.product.id})...`
      );

      // Update the product
      await updatePolarProduct(ctx, plan, allPolarProducts);

      // Update the prices
      updatePolarPrices(ctx, plan, allPolarPrices);
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
