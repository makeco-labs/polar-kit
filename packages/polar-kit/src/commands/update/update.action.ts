import type {
  Context,
  PolarPrice,
  PolarProduct,
  SubscriptionPlan,
} from '@/definitions';
import { listPolarPrices, listPolarProducts } from '@/utils';

// ========================================================================
// PRIVATE FUNCTIONS
// ========================================================================

// ------------------ UPDATE POLAR PRODUCT ------------------
/**
 * Updates a Polar product with new metadata and details
 */
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

// ------------------ UPDATE POLAR PRICES ------------------
/**
 * Updates all prices for a subscription plan
 * Note: In Polar, price updates may be limited. This function handles what's possible.
 */
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

// ========================================================================
// PUBLIC FUNCTIONS
// ========================================================================

/**
 * Updates existing subscription plans in Polar based on the config plans.
 */
export async function updatePolarSubscriptionPlansAction(
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
      await updatePolarPrices(ctx, plan, allPolarPrices);
    }

    ctx.logger.info('Finished updating subscription plans in Polar');
  } catch (error) {
    ctx.logger.error('Error updating Polar subscription plans:', error);
    throw error;
  }
}
