import type { Config, Context, DatabaseAdapter } from '@/definitions';
import { createLogger } from './create-logger';
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

  return {
    logger,
    polarClient,
    adapter,
    env: process.env,
    config,
  };
}
