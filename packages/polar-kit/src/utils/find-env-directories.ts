import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Workspace indicators that suggest a monorepo structure
 */
const WORKSPACE_INDICATORS = [
  'pnpm-workspace.yaml',
  'lerna.json',
  'nx.json',
  'turbo.json',
  'rush.json',
];

/**
 * Check if directory contains workspace indicator files
 */
function hasWorkspaceIndicators(dir: string): boolean {
  return WORKSPACE_INDICATORS.some((indicator) =>
    fs.existsSync(path.join(dir, indicator))
  );
}

/**
 * Check if directory has monorepo structure (packages/apps with package.json)
 */
function hasMonorepoStructure(dir: string): boolean {
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const commonDirs = ['packages', 'apps'];

  for (const dirName of commonDirs) {
    const dirPath = path.join(dir, dirName);
    if (
      fs.existsSync(dirPath) &&
      fs.statSync(dirPath).isDirectory() &&
      hasPackageJsonInSubdirs(dirPath)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if any subdirectory contains package.json
 */
function hasPackageJsonInSubdirs(dir: string): boolean {
  const subdirs = fs.readdirSync(dir);
  return subdirs.some((subdir) => {
    const subdirPath = path.join(dir, subdir);
    const subPackageJson = path.join(subdirPath, 'package.json');
    return fs.existsSync(subPackageJson);
  });
}

/**
 * Detects if we're in a monorepo by looking for workspace indicators
 */
function detectWorkspaceRoot(startDir: string): string | null {
  let currentDir = startDir;
  const maxDepth = 10; // Prevent infinite loops
  let depth = 0;

  while (depth < maxDepth) {
    // Check for workspace indicators or monorepo structure
    if (
      hasWorkspaceIndicators(currentDir) ||
      hasMonorepoStructure(currentDir)
    ) {
      return currentDir;
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
    depth++;
  }

  return null;
}

/**
 * Gets git repository root directory
 */
function getGitRoot(): string | null {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
    return gitRoot;
  } catch {
    return null;
  }
}

/**
 * Finds all potential directories to search for environment files
 * Returns array in priority order: current dir → workspace root → git root
 */
export function findEnvDirectories(cwd: string = process.cwd()): string[] {
  const directories: string[] = [];

  // Always include current directory first
  directories.push(cwd);

  // Add workspace root if different from current directory
  const workspaceRoot = detectWorkspaceRoot(cwd);
  if (workspaceRoot && workspaceRoot !== cwd) {
    directories.push(workspaceRoot);
  }

  // Add git root if different from current directory and workspace root
  const gitRoot = getGitRoot();
  if (
    gitRoot &&
    fs.existsSync(gitRoot) &&
    gitRoot !== cwd &&
    gitRoot !== workspaceRoot
  ) {
    directories.push(gitRoot);
  }

  return directories;
}
