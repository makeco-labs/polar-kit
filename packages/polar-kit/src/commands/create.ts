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
  PolarProduct,
  SubscriptionPlan,
} from '@/definitions';
import { ENV_CHOICES } from '@/definitions';
import {
  createContext,
  findPolarProduct,
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
  plans: SubscriptionPlan[];
  chosenEnv: EnvironmentKey;
  organizationId: string;
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

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

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
  input: { plans: SubscriptionPlan[]; organizationId: string }
): Promise<void> {
  const { plans, organizationId } = input;
  ctx.logger.info('Ensuring Polar subscription plans exist...');

  for (const plan of plans) {
    ctx.logger.info(
      `Processing plan: ${plan.product.name} (Internal ID: ${plan.product.id})...`
    );
    try {
      // 1. Ensure Product Exists
      let polarProduct: PolarProduct | null = await findPolarProduct(ctx, {
        internalProductId: plan.product.id,
        organizationId,
      });

      if (polarProduct) {
        ctx.logger.info(
          `  Product found: ${polarProduct.name} (ID: ${polarProduct.id})`
        );
      } else {
        ctx.logger.info('  Product not found in Polar, creating...');
        const polarProductParams =
          ctx.mappers.mapSubscriptionPlanToPolarProduct(plan);

        // Create product with prices
        const prices = plan.prices.map((price) =>
          ctx.mappers.mapSubscriptionPlanToPolarPrice(price, {
            planName: plan.product.name,
            tier: plan.product.id,
            internalProductId: plan.product.id,
            polarProductId: '', // Will be set by Polar
          })
        );

        // Call Polar API to create product
        const createdProduct = await ctx.polarClient.products.create({
          name: polarProductParams.name,
          organizationId,
          recurringInterval: polarProductParams.recurringInterval ?? null,
          description: polarProductParams.description ?? undefined,
          metadata: polarProductParams.metadata,
          prices: prices as Parameters<
            typeof ctx.polarClient.products.create
          >[0]['prices'],
        });

        // Convert SDK response to our PolarProduct type
        polarProduct = {
          id: createdProduct.id,
          name: createdProduct.name,
          description: createdProduct.description ?? undefined,
          isRecurring: createdProduct.isRecurring,
          isArchived: createdProduct.isArchived,
          organizationId: createdProduct.organizationId,
          recurringInterval: createdProduct.recurringInterval ?? undefined,
          metadata: createdProduct.metadata as Record<
            string,
            string | number | boolean
          >,
        };

        ctx.logger.info(
          `  Created product: ${polarProduct.name} (ID: ${polarProduct.id})`
        );

        // Log created prices
        if (createdProduct.prices) {
          for (const price of createdProduct.prices) {
            ctx.logger.info(
              `    Price created: ID ${price.id} (${price.amountType})`
            );
          }
        }
      }
    } catch (error) {
      ctx.logger.error({
        message: 'Error ensuring subscription plan/prices in Polar',
        error,
        metadata: { planId: plan.product.id, planName: plan.product.name },
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
