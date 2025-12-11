import type { Polar } from '@polar-sh/sdk';

import type { Config, PolarMappers } from './config.schemas';
import type { DatabaseAdapter } from './database-adapter.schemas';

// ========================================================================
// CONTEXT TYPES
// ========================================================================

export interface Logger {
  info(message: string | object, ...args: unknown[]): void;
  error(message: string | object, ...args: unknown[]): void;
  warn(message: string | object, ...args: unknown[]): void;
  debug(message: string | object, ...args: unknown[]): void;
}

export interface Context {
  logger: Logger;
  env: Record<string, string | undefined>;
  mappers: PolarMappers;
  adapter: DatabaseAdapter;
  polarClient: Polar;
  config: Config;
}
