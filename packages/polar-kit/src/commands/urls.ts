import chalk from 'chalk';
import { Command } from 'commander';
import prompts from 'prompts';

// ========================================================================
// TYPES
// ========================================================================

interface UrlsOptions {
  all?: boolean;
}

interface PolarUrl {
  name: string;
  icon: string;
  live: string;
  sandbox: string;
}

// ========================================================================
// URL DEFINITIONS
// ========================================================================

const POLAR_URLS: PolarUrl[] = [
  {
    name: 'API Settings',
    icon: '🔑',
    live: 'https://dashboard.polar.sh/settings',
    sandbox: 'https://sandbox.polar.sh/settings',
  },
  {
    name: 'Products',
    icon: '📦',
    live: 'https://dashboard.polar.sh/products',
    sandbox: 'https://sandbox.polar.sh/products',
  },
  {
    name: 'Webhooks',
    icon: '🔗',
    live: 'https://dashboard.polar.sh/settings/webhooks',
    sandbox: 'https://sandbox.polar.sh/settings/webhooks',
  },
  {
    name: 'Subscriptions',
    icon: '🔄',
    live: 'https://dashboard.polar.sh/subscriptions',
    sandbox: 'https://sandbox.polar.sh/subscriptions',
  },
  {
    name: 'Orders',
    icon: '📋',
    live: 'https://dashboard.polar.sh/orders',
    sandbox: 'https://sandbox.polar.sh/orders',
  },
];

// ========================================================================
// ACTION
// ========================================================================

function showAllUrls(): void {
  console.log(chalk.blue.bold('\n🔗 Polar Dashboard URLs:\n'));

  for (const urlItem of POLAR_URLS) {
    console.log(chalk.cyan(`${urlItem.icon} ${chalk.bold(urlItem.name)}:`));
    console.log(chalk.green(`   Live: ${urlItem.live}`));
    console.log(chalk.yellow(`   Sandbox: ${urlItem.sandbox}`));
    console.log();
  }
}

async function showUrlSelection(): Promise<void> {
  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.blue('Select Polar dashboard page:'),
      choices: POLAR_URLS.map((urlItem) => ({
        title: `${urlItem.icon} ${urlItem.name}`,
        value: urlItem,
      })),
      initial: 0,
    });

    if (!response.value) {
      process.exit(0);
    }

    console.log(chalk.cyan(`\n${response.value.icon} ${response.value.name}:`));
    console.log(chalk.green(`   Live: ${response.value.live}`));
    console.log(chalk.yellow(`   Sandbox: ${response.value.sandbox}`));
  } catch (error) {
    console.error(chalk.red('Error during URL selection:'), error);
    process.exit(1);
  }
}

async function showPolarUrlsAction(options: {
  showAll: boolean;
}): Promise<void> {
  const { showAll } = options;

  if (showAll) {
    showAllUrls();
  } else {
    await showUrlSelection();
  }
}

// ========================================================================
// COMMAND
// ========================================================================

export const urls = new Command()
  .name('urls')
  .description('Show Polar dashboard URLs')
  .option('-a, --all', 'Show all URLs with labels')
  .action(async (options: UrlsOptions) => {
    try {
      await showPolarUrlsAction({
        showAll: !!options.all,
      });
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
