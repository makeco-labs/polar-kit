import type { Prices } from '@polar-sh/sdk/models/components/productcreate';
import type {
  Config,
  PolarMappers,
  PolarPrice,
  PolarPriceContext,
  SubscriptionPlan,
} from '@/definitions';

export function createMappers(config: Config): PolarMappers {
  const metadataConfig = config.metadata;

  return {
    mapSubscriptionPlanToPolarProduct: (plan: SubscriptionPlan) => {
      return {
        name: plan.product.name,
        description: plan.product.description,
        recurringInterval: plan.product.recurringInterval,
        metadata: {
          [metadataConfig.productIdField]: plan.product.id,
          [metadataConfig.managedByField]: metadataConfig.managedByValue,
          ...plan.product.metadata,
        },
      };
    },

    mapSubscriptionPlanToPolarPrice: (
      price: PolarPrice,
      _context: PolarPriceContext
    ): Prices => {
      // Handle free prices
      if (price.amountType === 'free') {
        return { amountType: 'free' };
      }

      // Handle custom (pay-what-you-want) prices
      if (price.amountType === 'custom') {
        return {
          amountType: 'custom',
          priceCurrency: price.priceCurrency || 'usd',
          minimumAmount: price.minimumAmount,
          maximumAmount: price.maximumAmount,
          presetAmount: price.presetAmount,
        };
      }

      // Handle fixed prices
      return {
        amountType: 'fixed',
        priceAmount: price.priceAmount || 0,
        priceCurrency: price.priceCurrency || 'usd',
      };
    },
  };
}
