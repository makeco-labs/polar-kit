import type { Config, Context, DatabaseAdapter } from '@/definitions';
import { createLogger } from './create-logger';
import { createMappers } from './create-mappers';
import { createPolarClient } from './polar-client';

/**
 * Creates the context object for executing polar operations
 */
export function createContext(input: {
  adapter: DatabaseAdapter;
  config: Config;
}): Context {
  const { adapter, config } = input;

  const logger = createLogger();

  const polarAccessToken = config.env.polarAccessToken;

  const polarClient = createPolarClient({
    POLAR_ACCESS_TOKEN: polarAccessToken,
  });

  // Create mappers for Polar operations
  const mappers = createMappers(config);

  return {
    logger,
    polarClient,
    mappers,
    adapter,
    env: process.env,
    config,
  };
}
