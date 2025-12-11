# Stripe Sync PostgreSQL Demo

This demo shows how to use `@makeco/stripe-kit` with PostgreSQL and Drizzle ORM to sync subscription plans between your application and Stripe.

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   Create `.env.test` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   DATABASE_URL=postgresql://user:password@localhost:5432/stripe_sync_demo
   ```

3. **Set up database:**
   ```bash
   # Generate migration files
   bun run db:generate

   # Run migrations
   bun run db:migrate

   # (Optional) Open Drizzle Studio
   bun run db:studio
   ```

## Usage

### Create Stripe Products & Prices
```bash
bun run stripe create
```

### List Stripe Items
```bash
# List managed products only
bun run stripe list products

# List all products in Stripe account
bun run stripe list products --all

# List managed prices only
bun run stripe list prices

# List all prices in Stripe account
bun run stripe list prices --all
```

### Sync to Database
```bash
bun run stripe db sync
```

### Archive Plans
```bash
bun run stripe archive
```

## Configuration

The `stripe.config.ts` file demonstrates:

- ✅ **New schema structure** with `product` and `prices` separation
- ✅ **Marketing features** for Stripe pricing tables
- ✅ **Feature configuration** stored in metadata for app logic
- ✅ **Multiple pricing tiers** (Free, Pro, Enterprise)
- ✅ **Monthly and yearly pricing** with promotional discounts
- ✅ **Database adapter** using Drizzle ORM
- ✅ **Environment configuration** for different stages

## Database Schema

The demo includes:
- `products` table - stores product information and features
- `prices` table - stores pricing information with relationships

## Key Features

- **No custom mappers needed** - uses the built-in comprehensive mapping
- **Drizzle ORM integration** - type-safe database operations
- **Flexible feature storage** - JSON fields for dynamic features
- **Comprehensive metadata** - business logic and marketing flags
- **Environment separation** - different configs per environment