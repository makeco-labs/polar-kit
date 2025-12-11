# stripe-kit

[![npm version](https://badge.fury.io/js/%40makeco%2Fstripe-kit.svg)](https://badge.fury.io/js/%40makeco%2Fstripe-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/makeco-labs/stripe-kit)](https://github.com/makeco/stripe-kit/issues)
[![GitHub stars](https://img.shields.io/github/stars/makeco-labs/stripe-kit)](https://github.com/makeco/stripe-kit/stargazers)

An unofficial CLI tool for managing Stripe subscription plans with database synchronization support.

## Installation

```sh
npm install @makeco/stripe-kit
```

## What's inside?

This monorepo includes the following packages:

### Packages

- `@makeco/stripe-kit`: Core CLI package for managing Stripe subscription plans
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
cd stripe-kit
bun run build
```

### Usage

```bash
# Commands
create        # Create subscription plans in Stripe
archive       # Archive subscription plans in Stripe  
update        # Update existing Stripe plans
db sync       # Sync Stripe plans to database
db purge      # Purge database plans
list products # List Stripe products
list prices   # List Stripe prices
urls          # Show Stripe dashboard URLs
config        # View current user preferences

# Global Options
-c, --config <path>         # Path to stripe.config.ts file (default: ./stripe.config.ts)
-e, --env <environment>     # Target environment (test, dev, staging, prod)
-a, --adapter <name>        # Database adapter name
```

## Features

- **Stripe Integration**: Create, update, and archive subscription plans
- **Database Sync**: Synchronize Stripe data with your database (SQLite, PostgreSQL, Turso)
- **Multi-Environment**: Support for test, dev, staging, and production environments
- **Interactive CLI**: Guided prompts for all operations
- **Type Safety**: Built with TypeScript for reliable operations

## Configuration

Create a `stripe.config.ts` file in your project root:

```typescript
import { defineConfig } from 'stripe-kit';

export default defineConfig({
	plans: [
		{
      // Stripe.Product (camelCase)
			product: {
				id: "pro-plan",
				name: "Pro Plan",
				description: "Professional features for growing teams",
			},
      // Stripe.Price[] (camelCase)
			prices: [
				{
					id: "pro-monthly",
					nickname: "Pro Monthly",
					unitAmount: 2999,
					currency: "usd",
					recurring: { interval: "month" },
				},
				{
					id: "pro-yearly",
					nickname: "Pro Yearly",
					unitAmount: 29999,
					currency: "usd",
					recurring: { interval: "year" },
				},
			],
		},
	],
	adapters: {
    // Custom property key. Can be postgres, sqlite, turso, myAdapter, etc.
		postgres: {
			syncProducts: async (products) => { /* Sync Stripe products to your database */ },
			syncPrices: async (prices) => { /* Sync Stripe prices to your database */ },
			clearProducts: async () => { /* Remove all products from your database */ },
			clearPrices: async () => { /* Remove all prices from your database */ },
			getProducts: async () => { /* Optional: Return all products from your database */ },
			getPrices: async () => { /* Optional: Return all prices from your database */ }
		},
	},
});
```
