# stripe-kit

> **⚠️ Experimental:** This tool is currently in experimental status and may undergo breaking changes.

A CLI tool for creating, archiving, updating Stripe products and prices and syncing them to your database.

[![npm version](https://badge.fury.io/js/%40makeco%2Fstripe-kit.svg)](https://badge.fury.io/js/%40makeco%2Fstripe-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Key Features:**

- 🛒 **Product Management** - Create, update, and archive Stripe products and prices
- 🗄️ **Database Sync** - Sync Stripe data to your database with adapters
- 🌱 **Multi-Environment** - Built-in support for test, dev, staging, prod
- 📝 **TypeScript** - Full type safety with configuration files
- 🔧 **User Preferences** - Remembers your last used environment and adapter

**Quick Start:**

```bash
npm install @makeco/stripe-kit
yarn add @makeco/stripe-kit
bun add @makeco/stripe-kit
```

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

## Configuration

Create a `stripe.config.ts` file in your project root:

```typescript
import { defineConfig } from "stripe-kit";

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

## License

MIT © [makeco](https://github.com/makeco-labs)
