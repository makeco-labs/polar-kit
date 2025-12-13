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
  findPolarProduct,
  isOrganizationToken,
  loadConfig,
  loadEnvironment,
} from '@/utils';

// ========================================================================
// TYPES
// ========================================================================

interface CreateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface CreatePreflightResult {
  ctx: Context;
  plans: ProductCreate[];
  chosenEnv: EnvironmentKey;
  organizationId: string | undefined;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runCreatePreflight(
  options: CreateOptions,
  command: CommandType
): Promise<CreatePreflightResult> {
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

  // Get organization ID (optional - not needed for organization tokens)
  const organizationId = ctx.config.env.organizationId;

  // Production confirmation
  await requireProductionConfirmation({
    action: 'create plans',
    env: chosenEnv,
  });

  return {
    ctx,
    plans: config.plans,
    chosenEnv,
    organizationId,
  };
}

// ========================================================================
// ACTION
// ========================================================================

async function ensurePolarSubscriptionPlans(
  ctx: Context,
  input: { plans: ProductCreate[]; organizationId: string | undefined }
): Promise<void> {
  const { plans, organizationId } = input;
  ctx.logger.info('Ensuring Polar subscription plans exist...');

  for (const plan of plans) {
    const internalProductId =
      plan.metadata?.[ctx.config.metadata.productIdField];
    ctx.logger.info(
      `Processing plan: ${plan.name} (Internal ID: ${internalProductId ?? 'none'})...`
    );
    try {
      // 1. Check if Product Exists
      let polarProduct: Product | null = null;

      if (internalProductId) {
        polarProduct = await findPolarProduct(ctx, {
          internalProductId: String(internalProductId),
          organizationId,
        });
      }

      if (polarProduct) {
        ctx.logger.info(
          `  Product found: ${polarProduct.name} (ID: ${polarProduct.id})`
        );
      } else {
        ctx.logger.info('  Product not found in Polar, creating...');

        // Add managed_by metadata
        const metadata = {
          ...plan.metadata,
          [ctx.config.metadata.managedByField]:
            ctx.config.metadata.managedByValue,
        };

        // Create product directly using the plan
        // Organization tokens (polar_oat_) don't need/want organizationId
        // Personal access tokens (polar_pat_) require organizationId
        const isOrgToken = isOrganizationToken(ctx.config.env.polarAccessToken);
        const createdProduct = await ctx.polarClient.products.create({
          ...plan,
          ...(!isOrgToken && organizationId && { organizationId }),
          metadata,
        });

        polarProduct = createdProduct;

        ctx.logger.info(
          `  Created product: ${polarProduct.name} (ID: ${polarProduct.id})`
        );

        // Log created prices
        if (createdProduct.prices) {
          for (const price of createdProduct.prices) {
            ctx.logger.info(
              `    Price created: ID ${price.id} (${(price as { amountType?: string }).amountType})`
            );
          }
        }
      }
    } catch (error) {
      ctx.logger.error({
        message: 'Error ensuring subscription plan/prices in Polar',
        error,
        metadata: { planName: plan.name },
      });
      throw error;
    }
  }
  ctx.logger.info('Finished ensuring Polar subscription plans.');
}

// ========================================================================
// COMMAND
// ========================================================================

export const create = new Command()
  .name('create')
  .description('Create Polar subscription plans (Idempotent)')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: CreateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, plans, organizationId } = await runCreatePreflight(
        options,
        command
      );

      // Execute the action
      await ensurePolarSubscriptionPlans(ctx, { plans, organizationId });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
