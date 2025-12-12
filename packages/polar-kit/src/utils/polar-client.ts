import { Polar } from '@polar-sh/sdk';

export function createPolarClient(
  env: Record<string, string | undefined>,
  server?: 'sandbox' | 'production'
): Polar {
  if (!env.POLAR_ACCESS_TOKEN) {
    throw new Error('POLAR_ACCESS_TOKEN is required');
  }

  return new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: server ?? 'production',
  });
}
