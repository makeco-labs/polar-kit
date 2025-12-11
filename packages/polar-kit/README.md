# polar-kit

> **Experimental:** This tool is currently in experimental status and may undergo breaking changes.

A CLI tool for creating, archiving, updating Polar products and prices and syncing them to your database.

[![npm version](https://badge.fury.io/js/%40makeco%2Fpolar-kit.svg)](https://badge.fury.io/js/%40makeco%2Fpolar-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Key Features:**

- **Product Management** - Create, update, and archive Polar products and prices
- **Database Sync** - Sync Polar data to your database with adapters
- **Multi-Environment** - Built-in support for test, dev, staging, prod
- **TypeScript** - Full type safety with configuration files
- **User Preferences** - Remembers your last used environment and adapter

**Quick Start:**

```bash
npm install @makeco/polar-kit
yarn add @makeco/polar-kit
bun add @makeco/polar-kit
```

```bash
# Commands
create        # Create subscription plans in Polar
archive       # Archive subscription plans in Polar
update        # Update existing Polar plans
db sync       # Sync Polar plans to database
db purge      # Purge database plans
list products # List Polar products
list prices   # List Polar prices
urls          # Show Polar dashboard URLs
config        # View current user preferences

# Global Options
-c, --config <path>         # Path to polar.config.ts file (default: ./polar.config.ts)
-e, --env <environment>     # Target environment (test, dev, staging, prod)
-a, --adapter <name>        # Database adapter name
```

## Configuration

Create a `polar.config.ts` file in your project root:

```typescript
import { defineConfig } from "@makeco/polar-kit";

export default defineConfig({
  plans: [
    {
      product: {
        id: "pro-plan",
        name: "Pro Plan",
        description: "Professional features for growing teams",
      },
      prices: [
        {
          id: "pro-monthly",
          type: "recurring",
          amountType: "fixed",
          priceAmount: 2999,
          priceCurrency: "usd",
          recurringInterval: "month",
        },
        {
          id: "pro-yearly",
          type: "recurring",
          amountType: "fixed",
          priceAmount: 29999,
          priceCurrency: "usd",
          recurringInterval: "year",
        },
      ],
    },
  ],
  adapters: {
    // Custom property key. Can be postgres, sqlite, turso, myAdapter, etc.
    postgres: {
      syncProducts: async (products) => { /* Sync Polar products to your database */ },
      syncPrices: async (prices) => { /* Sync Polar prices to your database */ },
      clearProducts: async () => { /* Remove all products from your database */ },
      clearPrices: async () => { /* Remove all prices from your database */ },
      getProducts: async () => { /* Optional: Return all products from your database */ },
      getPrices: async () => { /* Optional: Return all prices from your database */ }
    },
  },
  env: {
    polarAccessToken: process.env.POLAR_ACCESS_TOKEN,
    polarOrganizationId: process.env.POLAR_ORGANIZATION_ID,
  },
});
```

## License

MIT © [makeco](https://github.com/makeco-labs)
