import { execSync, spawn } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * CLI execution result
 */
export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Options for running CLI commands
 */
export interface CLIOptions {
  env?: Record<string, string>;
  timeout?: number;
  input?: string; // For interactive commands
  cwd?: string;
}

/**
 * Helper class for running CLI commands in tests
 */
export class CLIRunner {
  private readonly cliPath: string;
  private readonly defaultEnv: Record<string, string>;

  constructor() {
    // Path to the built CLI
    this.cliPath = join(__dirname, '../../../dist/cli.js');

    // Default test environment variables from .env.test
    this.defaultEnv = {
      NODE_ENV: 'test',
      POLAR_ACCESS_TOKEN:
        process.env.POLAR_ACCESS_TOKEN || 'polar_at_test_your_token_here',
      POLAR_ORGANIZATION_ID:
        process.env.POLAR_ORGANIZATION_ID || 'your_org_id_here',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./test-database.db',
    };
  }

  /**
   * Run a CLI command synchronously
   */
  run(args: string[], options: CLIOptions = {}): CLIResult {
    const env = { ...process.env, ...this.defaultEnv, ...options.env };
    const timeout = options.timeout || 30_000; // 30 second default timeout

    try {
      const result = execSync(`node "${this.cliPath}" ${args.join(' ')}`, {
        encoding: 'utf-8',
        env,
        cwd: options.cwd,
        timeout,
        stdio: 'pipe',
      });

      return {
        stdout: result.toString(),
        stderr: '',
        exitCode: 0,
        success: true,
      };
    } catch (error: unknown) {
      const execError = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
        status?: number;
      };
      return {
        stdout: execError.stdout?.toString() || '',
        stderr: execError.stderr?.toString() || execError.message || '',
        exitCode: execError.status || 1,
        success: false,
      };
    }
  }

  /**
   * Run a CLI command asynchronously (useful for interactive commands)
   */
  runAsync(args: string[], options: CLIOptions = {}): Promise<CLIResult> {
    return new Promise((resolve) => {
      const env = { ...process.env, ...this.defaultEnv, ...options.env };
      const timeout = options.timeout || 30_000;

      const child = spawn('node', [this.cliPath, ...args], {
        env,
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeout);

      // Collect output
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Send input if provided
      if (options.input && child.stdin) {
        child.stdin.write(options.input);
        child.stdin.end();
      }

      child.on('close', (code) => {
        clearTimeout(timeoutHandle);

        resolve({
          stdout,
          stderr: timedOut ? 'Command timed out' : stderr,
          exitCode: timedOut ? 1 : code || 0,
          success: !timedOut && code === 0,
        });
      });
    });
  }

  /**
   * Create a temporary config file for testing
   */
  createTempConfig(config: Record<string, unknown>): string {
    const configPath = join(tmpdir(), `polar-config-test-${Date.now()}.ts`);
    const configContent = `
      import { defineConfig } from '@makeco/polar-kit';
      export default defineConfig(${JSON.stringify(config, null, 2)});
    `;

    writeFileSync(configPath, configContent);
    return configPath;
  }

  /**
   * Cleanup temporary config file
   */
  cleanupTempConfig(configPath: string): void {
    if (existsSync(configPath)) {
      try {
        unlinkSync(configPath);
      } catch {
        // File already deleted
      }
    }
  }

  /**
   * Helper methods for common CLI operations
   */

  sync(
    options: { env?: string; adapter?: string; config?: string } = {}
  ): CLIResult {
    const args = ['db', 'sync'];
    if (options.env) {
      args.push('-e', options.env);
    }
    if (options.adapter) {
      args.push('-a', options.adapter);
    }
    if (options.config) {
      args.push('-c', options.config);
    }

    return this.run(args);
  }

  purge(
    options: { env?: string; adapter?: string; config?: string } = {}
  ): CLIResult {
    const args = ['db', 'purge'];
    if (options.env) {
      args.push('-e', options.env);
    }
    if (options.adapter) {
      args.push('-a', options.adapter);
    }
    if (options.config) {
      args.push('-c', options.config);
    }

    return this.run(args);
  }

  create(
    options: { env?: string; adapter?: string; config?: string } = {}
  ): CLIResult {
    const args = ['create'];
    if (options.env) {
      args.push('-e', options.env);
    }
    if (options.adapter) {
      args.push('-a', options.adapter);
    }
    if (options.config) {
      args.push('-c', options.config);
    }

    return this.run(args);
  }

  listProducts(options: { env?: string; all?: boolean } = {}): CLIResult {
    const args = ['list', 'products'];
    if (options.env) {
      args.push('-e', options.env);
    }
    if (options.all) {
      args.push('--all');
    }

    return this.run(args);
  }

  listPrices(options: { env?: string; all?: boolean } = {}): CLIResult {
    const args = ['list', 'prices'];
    if (options.env) {
      args.push('-e', options.env);
    }
    if (options.all) {
      args.push('--all');
    }

    return this.run(args);
  }

  showHelp(): CLIResult {
    return this.run(['--help']);
  }

  showVersion(): CLIResult {
    return this.run(['--version']);
  }

  showSubcommandHelp(command: string): CLIResult {
    return this.run([command, '--help']);
  }

  showDbHelp(): CLIResult {
    return this.run(['db']);
  }

  showListHelp(): CLIResult {
    return this.run(['list']);
  }
}

/**
 * Global CLI runner instance for tests
 */
export const cli = new CLIRunner();
