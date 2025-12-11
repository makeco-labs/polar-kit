import chalk from 'chalk';
import { Command } from 'commander';

import { loadUserPreferences } from '@/utils';

// ========================================================================
// COMMAND
// ========================================================================

export const config = new Command()
  .name('config')
  .description('View current user preferences')
  .action(() => {
    try {
      const preferences = loadUserPreferences();

      console.log(chalk.blue.bold('\n📋 Current User Preferences:'));
      console.log(chalk.gray('─'.repeat(40)));

      if (preferences.defaultEnvironment) {
        console.log(
          chalk.green(
            `Last Used Environment: ${chalk.bold(preferences.defaultEnvironment)}`
          )
        );
      } else {
        console.log(chalk.gray('Last Used Environment: (not set)'));
      }

      if (preferences.defaultAdapter) {
        console.log(
          chalk.green(
            `Last Used Adapter: ${chalk.bold(preferences.defaultAdapter)}`
          )
        );
      } else {
        console.log(chalk.gray('Last Used Adapter: (not set)'));
      }

      console.log(
        chalk.gray('\n💡 Last used selections are pre-selected in prompts')
      );
      console.log(
        chalk.gray('   You still need to confirm your choice each time')
      );
      console.log(
        chalk.gray(
          '   Configuration stored in: ~/.config/@makeco/polar-kit/config.json\n'
        )
      );
    } catch (error) {
      console.error(chalk.red(`❌ Error reading preferences: ${error}`));
      process.exit(1);
    }
  });
