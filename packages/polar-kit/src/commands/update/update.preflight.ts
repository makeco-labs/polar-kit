import type { Command } from 'commander';
import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from '@/cli-prompts';
import type { Context, EnvironmentKey } from '@/definitions';
import { createContext, loadConfig, loadEnvironment } from '@/utils';

export interface UpdateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface UpdatePreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
  organizationId: string;
}

export async function runUpdatePreflight(
  options: UpdateOptions,
  command: Command
): Promise<UpdatePreflightResult> {
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

  // Verify Polar access token is configured
  if (!ctx.config.env.polarAccessToken) {
    throw new Error('POLAR_ACCESS_TOKEN is not configured in environment');
  }

  // Get organization ID
  const organizationId = ctx.config.env.organizationId;
  if (!organizationId) {
    throw new Error('organizationId is required in config.env');
  }

  // Verify plans are configured
  if (!ctx.config.plans || ctx.config.plans.length === 0) {
    throw new Error(
      'No subscription plans configured. Check your config file.'
    );
  }

  // Verify mappers are available
  if (
    !(
      typeof ctx.mappers.mapSubscriptionPlanToPolarProduct === 'function' &&
      typeof ctx.mappers.mapSubscriptionPlanToPolarPrice === 'function'
    )
  ) {
    throw new Error('Polar mappers not available. Check your configuration.');
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'update Polar plans',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
    organizationId,
  };
}
