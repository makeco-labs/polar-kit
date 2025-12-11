import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { EnvironmentKey } from '@/definitions';

export interface UserPreferences {
  defaultEnvironment?: EnvironmentKey;
  defaultAdapter?: string;
}

const CONFIG_DIR = join(homedir(), '.config', '@makeco', 'polar-kit');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// ========================================================================
// USER PREFERENCES MANAGEMENT
// ========================================================================

// ------------------ Load User Preferences ------------------

export function loadUserPreferences(): UserPreferences {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return {};
    }

    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as UserPreferences;
  } catch {
    console.warn('Warning: Could not load user preferences, using defaults');
    return {};
  }
}

// ------------------ Save User Preferences ------------------

export function saveUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  try {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Load existing preferences
    const preferences = loadUserPreferences();

    // Update the specific preference
    preferences[key] = value;

    // Save back to file
    writeFileSync(CONFIG_FILE, JSON.stringify(preferences, null, 2));
  } catch {
    // Silently fail - preferences are nice-to-have, not critical
    console.warn(`Warning: Could not save user preference ${key}`);
  }
}

// ------------------ Get Last Used Environment ------------------

export function getLastUsedEnvironment(): EnvironmentKey | undefined {
  const preferences = loadUserPreferences();
  return preferences.defaultEnvironment;
}

// ------------------ Get Last Used Adapter ------------------

export function getLastUsedAdapter(): string | undefined {
  const preferences = loadUserPreferences();
  return preferences.defaultAdapter;
}
