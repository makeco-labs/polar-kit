import chalk from 'chalk';
import prompts from 'prompts';
import type { EnvironmentKey } from '@/definitions';
import { VALID_ENVIRONMENTS } from '@/definitions';
import { getLastUsedEnvironment, saveUserPreference } from '@/utils';

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
