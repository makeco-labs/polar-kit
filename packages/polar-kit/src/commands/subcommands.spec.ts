import { describe, expect, it } from 'vitest';
import { cli } from '../test-utils/helpers';

const VERSION_REGEX = /\d+\.\d+\.\d+/;

describe('CLI Help & Structure', () => {
  it('shows main help', () => {
    const result = cli.showHelp();
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('CLI to manage Polar subscription plans');
  });

  it('shows version', () => {
    const result = cli.showVersion();
    expect(result.success).toBe(true);
    expect(result.stdout).toMatch(VERSION_REGEX);
  });

  it('shows db subcommand help', () => {
    const result = cli.showDbHelp();
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Database operations');
  });

  it('shows list subcommand help', () => {
    const result = cli.showListHelp();
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('List Polar resources');
  });

  it('handles unknown commands', () => {
    const result = cli.run(['unknown-command']);
    expect(result.success).toBe(false);
  });
});
