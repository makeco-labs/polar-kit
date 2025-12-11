import type { Command } from 'commander';
import { determineEnvironment } from '@/cli-prompts';
import type { Context, DatabaseAdapter, EnvironmentKey } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

export interface ListProductsOptions {
  env?: EnvironmentKey;
  all?: boolean;
}

export interface ListProductsPreflightResult {
  ctx: Context;
  showAll: boolean;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

export async function runListProductsPreflight(
  options: ListProductsOptions,
  command: Command
): Promise<ListProductsPreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Create context without specific adapter (doesn't need database)
  const ctx = createContext({
    adapter: Object.values(config.adapters)[0] as DatabaseAdapter,
    config,
  });

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  return {
    ctx,
    showAll: !!options.all,
    chosenEnv,
    organizationId,
  };
}
