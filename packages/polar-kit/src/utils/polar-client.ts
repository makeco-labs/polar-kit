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

/**
 * Detects if the access token is an organization token (polar_oat_)
 * Organization tokens are scoped to a single org and don't need/want organizationId in API calls
 * Personal access tokens (polar_pat_) can access multiple orgs and require organizationId
 */
export function isOrganizationToken(accessToken: string): boolean {
  return accessToken.startsWith('polar_oat_');
}
