import chalk from 'chalk';

import type { Logger } from '@/definitions';

export function createLogger(): Logger {
  return {
    info(message: string | object, ...args: unknown[]): void {
      if (typeof message === 'object') {
        console.log(chalk.blue('[INFO]'), message, ...args);
      } else {
        console.log(chalk.blue('[INFO]'), message, ...args);
      }
    },

    error(message: string | object, ...args: unknown[]): void {
      if (typeof message === 'object') {
        console.error(chalk.red('[ERROR]'), message, ...args);
      } else {
        console.error(chalk.red('[ERROR]'), message, ...args);
      }
    },

    warn(message: string | object, ...args: unknown[]): void {
      if (typeof message === 'object') {
        console.warn(chalk.yellow('[WARN]'), message, ...args);
      } else {
        console.warn(chalk.yellow('[WARN]'), message, ...args);
      }
    },

    debug(message: string | object, ...args: unknown[]): void {
      if (typeof message === 'object') {
        console.log(chalk.gray('[DEBUG]'), message, ...args);
      } else {
        console.log(chalk.gray('[DEBUG]'), message, ...args);
      }
    },
  };
}
