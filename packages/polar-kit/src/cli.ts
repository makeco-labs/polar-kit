#!/usr/bin/env node

import { Command } from 'commander';

// Import all commands from barrel export
import { archive, config, create, db, list, update, urls } from './commands';

// Handle process signals (simple and reliable)
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Handle basic errors (no fancy cleanup)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

const packageVersion = '0.1.0';

function main() {
  const program = new Command()
    .name('polar-kit')
    .description('CLI to manage Polar subscription plans')
    .version(packageVersion, '-v, --version', 'display the version number')
    .option(
      '-c, --config <path>',
      'Path to polar.config.ts file (defaults to ./polar.config.ts)'
    );

  // Add all commands
  program
    .addCommand(create)
    .addCommand(archive)
    .addCommand(config)
    .addCommand(update)
    .addCommand(db)
    .addCommand(list)
    .addCommand(urls);

  program.parse();
}

main();
