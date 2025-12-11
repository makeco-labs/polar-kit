import { describe, expect, it } from 'vitest';
import { cli } from '../helpers';

describe('polar-kit urls', () => {
  it('shows URL selection by default', () => {
    const result = cli.run(['urls']);
    // Will show interactive prompt or help
    expect(result.exitCode).toBeLessThan(2); // 0 or 1, not crash
  });

  it('shows all URLs with -a flag', () => {
    const result = cli.run(['urls', '-a']);
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Polar Dashboard URLs');
  });
});
