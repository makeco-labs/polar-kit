# polar-kit

[![npm version](https://badge.fury.io/js/%40makeco%2Fpolar-kit.svg)](https://badge.fury.io/js/%40makeco%2Fpolar-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/makeco-labs/polar-kit)](https://github.com/makeco-labs/polar-kit/issues)
[![GitHub stars](https://img.shields.io/github/stars/makeco-labs/polar-kit)](https://github.com/makeco-labs/polar-kit/stargazers)

A CLI tool for managing Polar subscription plans with database synchronization support.

## Installation

```sh
npm install @makeco/polar-kit
```

## What's inside?

This monorepo includes the following packages:

### Packages

- `@makeco/polar-kit`: Core CLI package for managing Polar subscription plans
- `demos`: Example configurations and usage patterns

Each package is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```sh
cd polar-kit
bun run build
```

### Usage

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

## Features

- **Polar Integration**: Create, update, and archive subscription plans
- **Database Sync**: Synchronize Polar data with your database (SQLite, PostgreSQL, Turso)
- **Multi-Environment**: Support for test, dev, staging, and production environments
- **Interactive CLI**: Guided prompts for all operations
- **Type Safety**: Built with TypeScript for reliable operations

## Configuration

Create a `polar.config.ts` file in your project root:

```typescript
import { defineConfig } from '@makeco/polar-kit';

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
