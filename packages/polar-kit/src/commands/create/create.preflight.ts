import type { Command } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type { Context, EnvironmentKey, SubscriptionPlan } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

export interface CreateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface CreatePreflightResult {
  ctx: Context;
  plans: SubscriptionPlan[];
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

export async function runCreatePreflight(
  options: CreateOptions,
  command: Command
): Promise<CreatePreflightResult> {
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
    action: 'create plans',
    env: chosenEnv,
  });

  return {
    ctx,
    plans: config.plans,
    chosenEnv,
    organizationId,
  };
}
