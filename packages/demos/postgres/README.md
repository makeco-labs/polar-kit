# Polar Sync PostgreSQL Demo

This demo shows how to use `@makeco/polar-kit` with PostgreSQL and Drizzle ORM to sync subscription plans between your application and Polar.

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   Create `.env.test` file:
   ```env
   POLAR_ACCESS_TOKEN=polar_at_...
   POLAR_ORGANIZATION_ID=your_org_id
   DATABASE_URL=postgresql://user:password@localhost:5432/polar_sync_demo
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

### Create Polar Products & Prices
```bash
bun run polar create
```

### List Polar Items
```bash
# List managed products only
bun run polar list products

# List all products in Polar account
bun run polar list products --all

# List managed prices only
bun run polar list prices

# List all prices in Polar account
bun run polar list prices --all
```

### Sync to Database
```bash
bun run polar db sync
```

### Archive Plans
```bash
bun run polar archive
```

## Configuration

The `polar.config.ts` file demonstrates:

- **New schema structure** with `product` and `prices` separation
- **Feature configuration** stored in metadata for app logic
- **Multiple pricing tiers** (Free, Pro, Enterprise)
- **Monthly and yearly pricing** with promotional discounts
- **Database adapter** using Drizzle ORM
- **Environment configuration** for different stages

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
