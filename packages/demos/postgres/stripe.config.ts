import { defineConfig } from '@makeco/stripe-kit';
import { postgresAdapter } from './src/database-adapter';

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export default defineConfig({
  // Complete subscription plan setup demonstrating all features
  plans: [
    {
      product: {
        id: 'free',
        name: 'Free Plan',
        description: 'Perfect for getting started',
        active: true,
        type: 'service',
        marketingFeatures: [
          { name: '5 projects' },
          { name: 'Basic support' },
          { name: '1GB storage' },
          { name: 'Community access' },
        ],
        features: {
          maxProjects: 5,
          storageGB: 1,
          supportLevel: 'basic',
          communityAccess: true,
          apiAccess: false,
          customIntegrations: false,
        },
        metadata: {
          plan_category: 'freemium',
          target_audience: 'individual',
          trial_eligible: 'false',
          popular_plan: 'false',
        },
      },
      prices: [
        {
          id: 'free-monthly',
          currency: 'usd',
          type: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: 0, // Free tier
          recurring: {
            interval: 'month',
            intervalCount: 1,
            usageType: 'licensed',
          },
          nickname: 'Free Monthly',
          active: true,
          metadata: {
            billing_cycle: 'monthly',
            is_free_tier: 'true',
            discount_percent: '0',
          },
        },
      ],
    },
    {
      product: {
        id: 'pro',
        name: 'Pro Plan',
        description: 'For growing businesses',
        active: true,
        type: 'service',
        marketingFeatures: [
          { name: 'Unlimited projects' },
          { name: 'Priority support' },
          { name: '50GB storage' },
          { name: 'Advanced analytics' },
          { name: 'API access' },
          { name: 'Custom integrations' },
        ],
        features: {
          maxProjects: -1, // unlimited
          storageGB: 50,
          supportLevel: 'priority',
          communityAccess: true,
          apiAccess: true,
          customIntegrations: true,
          advancedAnalytics: true,
        },
        metadata: {
          plan_category: 'paid',
          target_audience: 'small-business',
          trial_eligible: 'true',
          popular_plan: 'true',
        },
      },
      prices: [
        {
          id: 'pro-monthly',
          currency: 'usd',
          type: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: 2999, // $29.99
          recurring: {
            interval: 'month',
            intervalCount: 1,
            usageType: 'licensed',
          },
          nickname: 'Pro Monthly',
          active: true,
          taxBehavior: 'exclusive',
          metadata: {
            billing_cycle: 'monthly',
            is_promotional: 'false',
            discount_percent: '0',
          },
        },
        {
          id: 'pro-yearly',
          currency: 'usd',
          type: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: 29_999, // $299.99 (save ~17%)
          recurring: {
            interval: 'year',
            intervalCount: 1,
            usageType: 'licensed',
          },
          nickname: 'Pro Annual',
          active: true,
          taxBehavior: 'exclusive',
          metadata: {
            billing_cycle: 'yearly',
            is_promotional: 'true',
            discount_percent: '17',
          },
        },
      ],
    },
    {
      product: {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'For large organizations',
        active: true,
        type: 'service',
        marketingFeatures: [
          { name: 'Everything in Pro' },
          { name: 'Dedicated support' },
          { name: 'Unlimited storage' },
          { name: 'SSO/SAML' },
          { name: 'Audit logs' },
          { name: 'SLA guarantee' },
          { name: 'Custom onboarding' },
        ],
        features: {
          maxProjects: -1, // unlimited
          storageGB: -1, // unlimited
          supportLevel: 'dedicated',
          communityAccess: true,
          apiAccess: true,
          customIntegrations: true,
          advancedAnalytics: true,
          ssoSaml: true,
          auditLogs: true,
          slaGuarantee: true,
          customOnboarding: true,
        },
        metadata: {
          plan_category: 'paid',
          target_audience: 'enterprise',
          trial_eligible: 'true',
          popular_plan: 'false',
        },
      },
      prices: [
        {
          id: 'enterprise-monthly',
          currency: 'usd',
          type: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: 9999, // $99.99
          recurring: {
            interval: 'month',
            intervalCount: 1,
            usageType: 'licensed',
          },
          nickname: 'Enterprise Monthly',
          active: true,
          taxBehavior: 'exclusive',
          metadata: {
            billing_cycle: 'monthly',
            is_promotional: 'false',
            discount_percent: '0',
          },
        },
        {
          id: 'enterprise-yearly',
          currency: 'usd',
          type: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: 99_999, // $999.99 (save ~17%)
          recurring: {
            interval: 'year',
            intervalCount: 1,
            usageType: 'licensed',
          },
          nickname: 'Enterprise Annual',
          active: true,
          taxBehavior: 'exclusive',
          metadata: {
            billing_cycle: 'yearly',
            is_promotional: 'true',
            discount_percent: '17',
          },
        },
      ],
    },
  ],

  // Environment variables
  env: {
    stripeSecretKey,
  },

  // Database adapters using Drizzle ORM
  adapters: {
    postgres: postgresAdapter,
  },

  // Map internal plan IDs to product identifiers (optional)
  productIds: {
    free: 'free',
    pro: 'pro',
    enterprise: 'enterprise',
  },

  // Metadata configuration (uses defaults)
  metadata: {
    productIdField: 'internal_product_id',
    priceIdField: 'internal_price_id',
    managedByField: 'managed_by',
    managedByValue: 'stripe-kit-postgres-demo',
  },
});
