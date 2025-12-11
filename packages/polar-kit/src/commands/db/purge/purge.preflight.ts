import type { Command } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type { Context, EnvironmentKey } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

export interface PurgeDbOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface PurgeDbPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

export async function runPurgeDbPreflight(
  options: PurgeDbOptions,
  command: Command
): Promise<PurgeDbPreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Determine adapter (auto-select if only one)
  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  // Create context
  const ctx = createContext({ adapter: adapterResult.adapter, config });

  // Verify adapter has required methods
  if (
    !(
      typeof ctx.adapter.clearProducts === 'function' &&
      typeof ctx.adapter.clearPrices === 'function'
    )
  ) {
    throw new Error(
      'Database adapter must implement clearProducts and clearPrices methods'
    );
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'purge database plans',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}
