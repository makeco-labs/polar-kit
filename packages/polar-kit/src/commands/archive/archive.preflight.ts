import type { Command } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type { Context, EnvironmentKey } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

export interface ArchiveOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface ArchivePreflightResult {
  ctx: Context;
  productIdsToArchive: string[];
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

export async function runArchivePreflight(
  options: ArchiveOptions,
  command: Command
): Promise<ArchivePreflightResult> {
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

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'archive plans',
    env: chosenEnv,
  });

  // Get product IDs to archive
  const productIdsToArchive = config.productIds
    ? Object.values(config.productIds)
    : config.plans.map((plan) => plan.product.id);

  return {
    ctx,
    productIdsToArchive,
    chosenEnv,
    organizationId,
  };
}
