import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { z } from 'zod';

import type { Config } from '@/definitions';
import { configSchema } from '@/definitions';

// ========================================================================
// CONFIG LOADING UTILITIES
// ========================================================================

/**
 * Loads a TypeScript config file by transpiling to ESM and using dynamic import
 */
async function loadTypeScriptConfig(tsPath: string): Promise<unknown> {
  const esbuild = await import('esbuild');
  const { pathToFileURL } = await import('node:url');

  // Create temporary ESM file path
  const tempPath = tsPath.replace('.ts', '.temp.mjs');

  try {
    // Transpile TypeScript to ESM with minimal bundling
    await esbuild.build({
      entryPoints: [tsPath],
      outfile: tempPath,
      format: 'esm',
      platform: 'node',
      bundle: true,
      target: 'node18',
      // Only exclude things that MUST not be bundled
      external: [
        '@makeco/polar-kit', // Don't bundle the CLI itself
        // Node.js built-ins should never be bundled
        'node:*',
        'fs',
        'path',
        'crypto',
        'util',
        'stream',
        'events',
        'buffer',
        'process',
      ],
      // Optimize bundle size
      treeShaking: true,
      minify: false, // Keep readable for debugging
    });

    // Import the transpiled ESM file
    const fileUrl = pathToFileURL(tempPath).href;
    const imported = await import(fileUrl);

    return imported.default ?? imported;
  } finally {
    // Cleanup temp file
    await fs.promises.unlink(tempPath).catch(() => {
      // Ignore cleanup errors
    });
  }
}

/**
 * Loads a config file using the appropriate method based on file extension
 */
async function loadConfigFile(absolutePath: string): Promise<unknown> {
  const ext = path.extname(absolutePath);
  let config: unknown;

  if (ext === '.ts') {
    // TypeScript: transpile to temp ESM file, then dynamic import
    config = await loadTypeScriptConfig(absolutePath);
  } else if (ext === '.cjs') {
    // CommonJS: use createRequire
    const require = createRequire(import.meta.url);
    const required = require(absolutePath);
    config = required.default ?? required;
  } else {
    // JavaScript/ESM: direct dynamic import
    const { pathToFileURL } = await import('node:url');
    const fileUrl = pathToFileURL(absolutePath).href;
    const imported = await import(fileUrl);
    config = imported.default ?? imported;
  }

  return config;
}

/**
 * Handles errors during config loading with enhanced messaging
 */
function handleConfigLoadError(error: unknown): never {
  if (error instanceof z.ZodError) {
    // In Zod v4, use the issues property instead of errors
    const errorMessages = error.issues.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    throw new Error(`Invalid polar config file:\n${errorMessages.join('\n')}`);
  }

  // Enhanced error handling for module resolution issues
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (
    errorMessage.includes('ERR_PACKAGE_PATH_NOT_EXPORTED') ||
    errorMessage.includes('Cannot resolve module')
  ) {
    throw new Error(
      'Failed to load polar config file: ' +
        errorMessage +
        '\n\n' +
        'This error often occurs when:\n' +
        '- Your config file imports ESM-only packages\n' +
        '- Workspace packages have complex export maps\n' +
        '- There are module resolution conflicts\n\n' +
        'Try checking your package.json exports and dependencies.'
    );
  }

  throw new Error(`Failed to load polar config file: ${error}`);
}

// ========================================================================
// CONFIG DISCOVERY FUNCTIONS
// ========================================================================

/**
 * Discovers polar config file in the current working directory
 */
export function discoverPolarConfig(): string | null {
  const configPatterns = [
    'polar.config.ts',
    'polar.config.js',
    'polar.config.mjs',
    'polar.config.cjs',
  ];
  const cwd = process.cwd();

  for (const pattern of configPatterns) {
    const configPath = path.join(cwd, pattern);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Loads and parses a polar config file
 */
export async function loadConfig(input: {
  configPath?: string;
}): Promise<Config> {
  const { configPath } = input;
  let resolvedConfigPath: string;

  if (configPath) {
    // User provided a specific config path
    resolvedConfigPath = path.resolve(configPath);
  } else {
    // Auto-discovery: look for polar.config files
    const discoveredConfig = discoverPolarConfig();
    if (!discoveredConfig) {
      console.error('❌ Error: No polar.config.ts file found.');
      console.error(
        'Expected files: polar.config.ts, polar.config.js, polar.config.mjs, or polar.config.cjs'
      );
      console.error('Or specify a config file with --config flag');
      console.error('');
      console.error('Example polar.config.ts:');
      console.error(`import { defineConfig } from '@makeco/polar-kit';`);
      console.error('export default defineConfig({');
      console.error('  plans: [...],');
      console.error('  adapters: {...},');
      console.error('  envFiles: {...}');
      console.error('});');
      process.exit(1);
    }
    resolvedConfigPath = discoveredConfig;
  }

  // Check if file exists
  if (!fs.existsSync(resolvedConfigPath)) {
    throw new Error(`Polar config file not found at: ${resolvedConfigPath}`);
  }

  try {
    const absolutePath = path.resolve(resolvedConfigPath);
    const config = await loadConfigFile(absolutePath);

    // Validate the configuration
    const validatedConfig = configSchema.parse(config);

    return validatedConfig;
  } catch (error) {
    return handleConfigLoadError(error);
  }
}
