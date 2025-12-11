import type {
  Config,
  PolarMappers,
  PolarPrice,
  PolarPriceContext,
  PolarPriceCreateInput,
  PolarProductCreateInput,
  SubscriptionPlan,
} from '@/definitions';

export function createMappers(config: Config): PolarMappers {
  const metadataConfig = config.metadata;

  return {
    mapSubscriptionPlanToPolarProduct: (
      plan: SubscriptionPlan
    ): PolarProductCreateInput => {
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
    ): PolarPriceCreateInput => {
      // Handle different price types
      if (price.amountType === 'free') {
        if (price.type === 'recurring') {
          return {
            type: 'recurring',
            amountType: 'free',
            recurringInterval: price.recurringInterval || 'month',
          };
        }
        return {
          type: 'one_time',
          amountType: 'free',
        };
      }

      // Fixed price
      if (price.type === 'recurring') {
        return {
          type: 'recurring',
          amountType: 'fixed',
          recurringInterval: price.recurringInterval || 'month',
          priceAmount: price.priceAmount || 0,
          priceCurrency: price.priceCurrency || 'usd',
        };
      }
      return {
        type: 'one_time',
        amountType: 'fixed',
        priceAmount: price.priceAmount || 0,
        priceCurrency: price.priceCurrency || 'usd',
      };
    },
  };
}
