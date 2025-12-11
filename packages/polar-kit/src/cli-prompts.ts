import chalk from 'chalk';
import prompts from 'prompts';

import type { DatabaseAdapter, EnvironmentKey } from '@/definitions';
import { ENVIRONMENTS, VALID_ENVIRONMENTS } from '@/definitions';
import {
  getLastUsedAdapter,
  getLastUsedEnvironment,
  saveUserPreference,
} from '@/utils';

// ========================================================================
// DETERMINE ENVIRONMENT
// ========================================================================

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
export async function determineEnvironment(input: {
  envInput?: EnvironmentKey;
}): Promise<EnvironmentKey> {
  const { envInput } = input;

  // If environment specified via flag, use it
  if (envInput && VALID_ENVIRONMENTS.includes(envInput)) {
    console.log(
      chalk.green(`Environment specified via flag: ${chalk.bold(envInput)}`)
    );
    // Save as new default preference
    saveUserPreference('defaultEnvironment', envInput);
    return envInput;
  }

  // Get last used environment for initial selection
  const lastUsedEnv = getLastUsedEnvironment();
  const initialIndex = lastUsedEnv
    ? VALID_ENVIRONMENTS.indexOf(lastUsedEnv)
    : 0;

  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.blue(
        lastUsedEnv
          ? `Select the target environment (last used: ${chalk.bold(lastUsedEnv)}):`
          : 'Select the target environment:'
      ),
      choices: [
        { title: 'Test', value: 'test' },
        { title: 'Development', value: 'dev' },
        { title: 'Staging', value: 'staging' },
        { title: 'Production', value: 'prod' },
      ],
      initial: initialIndex >= 0 ? initialIndex : 0,
    });

    if (!response.value) {
      process.exit(0);
    }

    console.log(
      chalk.green(
        `Environment selected via prompt: ${chalk.bold(response.value)}`
      )
    );

    // Save as new default preference
    saveUserPreference('defaultEnvironment', response.value);

    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during environment prompt:'), error);
    process.exit(1);
  }
}

// ========================================================================
// DETERMINE ADAPTER
// ========================================================================

/**
 * Determines the database adapter, either from input or via interactive prompt.
 * Implements smart selection logic:
 * - 1 adapter: Auto-select silently
 * - Multiple adapters + flag: Use specified adapter
 * - Multiple adapters + no flag: Interactive prompt
 */
export async function determineAdapter(input: {
  adapterInput: string | undefined;
  availableAdapters: Record<string, DatabaseAdapter>;
}): Promise<{ name: string; adapter: DatabaseAdapter }> {
  const { adapterInput, availableAdapters } = input;
  const adapterNames = Object.keys(availableAdapters);

  // Smart selection logic
  if (adapterNames.length === 0) {
    console.error(chalk.red('No adapters found in configuration'));
    process.exit(1);
  }

  if (adapterNames.length === 1) {
    // Auto-select the only adapter
    const adapterName = adapterNames[0];
    console.log(
      chalk.green(`Auto-selected adapter: ${chalk.bold(adapterName)}`)
    );
    return { name: adapterName, adapter: availableAdapters[adapterName] };
  }

  // Multiple adapters available
  if (adapterInput) {
    if (availableAdapters[adapterInput]) {
      console.log(
        chalk.green(`Adapter specified via flag: ${chalk.bold(adapterInput)}`)
      );
      // Save as new default preference
      saveUserPreference('defaultAdapter', adapterInput);
      return { name: adapterInput, adapter: availableAdapters[adapterInput] };
    }
    console.log(
      chalk.yellow(
        `Invalid adapter specified: "${adapterInput}". Available: ${adapterNames.join(', ')}`
      )
    );
  }

  // Get last used adapter for initial selection
  const lastUsedAdapter = getLastUsedAdapter();
  const initialIndex =
    lastUsedAdapter && adapterNames.includes(lastUsedAdapter)
      ? adapterNames.indexOf(lastUsedAdapter)
      : 0;

  // Interactive prompt for multiple adapters
  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.blue(
        lastUsedAdapter && adapterNames.includes(lastUsedAdapter)
          ? `Select the database adapter (last used: ${chalk.bold(lastUsedAdapter)}):`
          : 'Select the database adapter:'
      ),
      choices: adapterNames.map((name) => ({
        title: name.charAt(0).toUpperCase() + name.slice(1),
        value: name,
      })),
      initial: initialIndex,
    });

    if (!response.value) {
      process.exit(0);
    }

    console.log(
      chalk.green(`Adapter selected via prompt: ${chalk.bold(response.value)}`)
    );

    // Save as new default preference
    saveUserPreference('defaultAdapter', response.value);

    return { name: response.value, adapter: availableAdapters[response.value] };
  } catch (error) {
    console.error(chalk.red('Error during adapter prompt:'), error);
    process.exit(1);
  }
}

// ========================================================================
// DETERMINE CONFIRMATION
// ========================================================================

/**
 * Requires confirmation for dangerous operations in production environment
 * Exits the process if not confirmed, otherwise continues execution
 */
export async function requireProductionConfirmation(input: {
  action: string;
  env: EnvironmentKey;
}): Promise<void> {
  const { action, env } = input;

  if (env !== ENVIRONMENTS.PROD) {
    return;
  }

  console.log(
    chalk.red.bold(
      `\nWARNING: You are about to perform a ${action.toUpperCase()} operation on PRODUCTION Polar!`
    )
  );
  console.log(
    chalk.yellow(
      'This operation may affect the production Polar configuration.'
    )
  );

  try {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: chalk.red(
        `Are you absolutely sure you want to ${action} in PRODUCTION Polar?`
      ),
      initial: false,
    });

    if (!response.value) {
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('Error during confirmation prompt:'), error);
    process.exit(1);
  }
}
