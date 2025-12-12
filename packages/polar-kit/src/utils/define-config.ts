import type { Config, ConfigInput } from '@/definitions';
import { configSchema } from '@/definitions';

/**
 * Defines a type-safe Polar Sync configuration object
 * @param config - The configuration object
 * @returns The validated configuration
 */
export function defineConfig(config: ConfigInput): Config {
  // Validate the configuration at runtime
  const validatedConfig = configSchema.parse(config);
  return validatedConfig as Config;
}
