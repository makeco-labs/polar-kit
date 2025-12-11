import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cli, getTestOrganizationId, getTestPolarToken } from '../test-utils/helpers';

// ========================================================================
// PRODUCTS TESTS
// ========================================================================

describe('polar-kit list products', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          product: {
            id: 'list-test',
            name: 'List Test Product',
          },
          prices: [
            {
              id: 'list-test-price',
              amountType: 'fixed',
              priceCurrency: 'usd',
              priceAmount: 999,
              recurringInterval: 'month',
            },
          ],
        },
      ],
      env: {
        polarAccessToken: getTestPolarToken(),
        organizationId: getTestOrganizationId(),
      },
      adapters: {},
      metadata: { managedByValue: '@makeco/polar-kit-list-test' },
    });

    // Ensure products exist
    cli.create({ env: 'test', config: configPath });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it('lists products', () => {
    const result = cli.listProducts({ env: 'test' });
    expect(result.success).toBe(true);
  });

  it('shows all products with --all flag', () => {
    const result = cli.listProducts({ env: 'test', all: true });
    expect(result.success).toBe(true);
  });
});

// ========================================================================
// PRICES TESTS
// ========================================================================

describe('polar-kit list prices', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          product: {
            id: 'price-list-test',
            name: 'Price List Test',
          },
          prices: [
            {
              id: 'price-list-test-price',
              amountType: 'fixed',
              priceCurrency: 'usd',
              priceAmount: 1999,
              recurringInterval: 'month',
            },
          ],
        },
      ],
      env: {
        polarAccessToken: getTestPolarToken(),
        organizationId: getTestOrganizationId(),
      },
      adapters: {},
      metadata: { managedByValue: '@makeco/polar-kit-price-list-test' },
    });

    // Ensure prices exist
    cli.create({ env: 'test', config: configPath });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it('lists prices', () => {
    const result = cli.listPrices({ env: 'test' });
    expect(result.success).toBe(true);
  });

  it('shows all prices with --all flag', () => {
    const result = cli.listPrices({ env: 'test', all: true });
    expect(result.success).toBe(true);
  });
});
