/**
 * Gets required environment variable with fallback for tests
 */
export function getTestEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required test environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets Polar access token for tests with fallback
 */
export function getTestPolarToken(): string {
  return getTestEnv('POLAR_ACCESS_TOKEN');
}

/**
 * Gets Polar organization ID for tests with fallback
 */
export function getTestOrganizationId(): string {
  return getTestEnv('POLAR_ORGANIZATION_ID');
}
