import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cli, getTestOrganizationId, getTestPolarToken } from '../helpers';

describe('polar-kit create', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          product: { id: 'test-create', name: 'Test Create' },
          prices: [
            {
              id: 'test-create-price',
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
      metadata: { managedByValue: '@makeco/polar-kit-create-test' },
    });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it('creates products in Polar', () => {
    const result = cli.create({ env: 'test', config: configPath });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('created');
  });

  it('handles missing config', () => {
    const result = cli.create({ env: 'test', config: '/invalid/path' });
    expect(result.success).toBe(false);
  });
});
