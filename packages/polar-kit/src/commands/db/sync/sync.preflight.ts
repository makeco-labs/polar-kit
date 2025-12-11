import type { Command } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type { Context, EnvironmentKey } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

export interface SyncOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface SyncPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

export async function runSyncPreflight(
  options: SyncOptions,
  command: Command
): Promise<SyncPreflightResult> {
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

  // Verify Polar client is available
  if (!ctx.polarClient) {
    throw new Error(
      'Polar client not available. Check POLAR_ACCESS_TOKEN environment variable.'
    );
  }

  // Verify adapter has required methods
  if (
    !(
      typeof ctx.adapter.syncProducts === 'function' &&
      typeof ctx.adapter.syncPrices === 'function'
    )
  ) {
    throw new Error(
      'Database adapter must implement syncProducts and syncPrices methods'
    );
  }

  // Verify Polar access token is configured
  if (!ctx.config.env.polarAccessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is not configured in environment');
  }

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'sync Polar plans to database',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
    organizationId,
  };
}
