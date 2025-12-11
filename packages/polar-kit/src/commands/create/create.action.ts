import type { Context, PolarProduct, SubscriptionPlan } from '@/definitions';
import { findPolarProduct } from '@/utils';

// ------------------ ENSURE POLAR SUBSCRIPTION PLANS ------------------
export async function ensurePolarSubscriptionPlans(
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
