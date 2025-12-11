import { Command } from 'commander';

import { prices } from './prices';
import { products } from './products';

export const list = new Command()
  .name('list')
  .description('List Polar resources')
  .addCommand(products)
  .addCommand(prices)
  .action(() => {
    list.help();
    process.exit(0);
  });
