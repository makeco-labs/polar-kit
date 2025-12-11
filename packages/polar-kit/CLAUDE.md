# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run build        # Clean, compile TypeScript, resolve path aliases, make CLI executable
bun run dev          # Watch mode for TypeScript compilation
bun run typecheck    # Type check without emitting
bun run dev:typecheck # Watch mode type checking

# Testing
bun test             # Run vitest in watch mode
bun test --run       # Run tests once
bun test src/commands/create.spec.ts  # Run single test file

# Linting
bun run lint         # Check with ultracite
bun run fix          # Auto-fix with ultracite

# Release
bun run ci           # Full CI: fix, lint, typecheck, build
bun run git "message" # CI + commit + push (uses conventional commits)
```

## Architecture

polar-kit is a CLI tool for managing Polar subscription products/prices and syncing them to databases.

### Entry Points

- `src/cli.ts` - CLI entry point using Commander.js, registers all commands
- `src/index.ts` - Library exports for programmatic use (`defineConfig` and type definitions)

### Core Structure

```
src/
├── commands/           # CLI commands (create, archive, update, db, list, urls, config)
├── definitions/        # Zod schemas and TypeScript types
│   ├── config.schemas.ts         # Main Config type, SubscriptionPlan, PolarMappers
│   ├── database-adapter.schemas.ts  # DatabaseAdapter interface
│   ├── polar-product.schemas.ts  # Product schemas
│   ├── polar-price.schemas.ts    # Price schemas
│   └── context.types.ts          # Context interface (logger, polarClient, adapter, etc.)
├── utils/              # Shared utilities
│   ├── create-context.ts    # Creates Context object for command execution
│   ├── polar-client.ts      # Polar SDK client factory
│   ├── polar-repository.ts  # CRUD operations for Polar API
│   ├── load-config.ts       # Loads polar.config.ts using esbuild-register
│   └── user-preferences.ts  # Persists last used env/adapter
└── test-utils/         # Test helpers and fixtures
```

### Key Patterns

**Context Object**: Commands receive a `Context` containing `logger`, `polarClient`, `adapter`, `mappers`, and `config`. Created via `createContext()`.

**Database Adapters**: User-defined in `polar.config.ts`. Must implement `syncProducts`, `syncPrices`, `clearProducts`, `clearPrices`. Optional: `getProducts`, `getPrices`.

**Path Aliases**: Use `@/*` for imports from `src/` (configured in tsconfig.json, resolved by tsc-alias at build).

## Testing

Tests use Vitest with globals enabled. Test files are `*.spec.ts` or `*.test.ts` in src/.

Required environment variables for tests:
- `POLAR_ACCESS_TOKEN`
- `POLAR_ORGANIZATION_ID`

## Commit Format

Uses semantic-release with conventional commits:
- `fix:` → patch release
- `feat:` → minor release
- `feat!:` or `BREAKING CHANGE:` → major release
