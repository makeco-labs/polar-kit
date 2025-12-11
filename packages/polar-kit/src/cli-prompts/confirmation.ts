import chalk from 'chalk';
import prompts from 'prompts';
import type { EnvironmentKey } from '../definitions';
import { ENVIRONMENTS } from '../definitions';

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
