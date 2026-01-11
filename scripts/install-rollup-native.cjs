#!/usr/bin/env node
/**
 * Workaround for npm optional dependencies bug (#4828)
 * Installs the correct platform-specific Rollup binary after npm install/ci
 *
 * @see https://github.com/npm/cli/issues/4828
 */
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const platform = os.platform();
const arch = os.arch();

// Map platform/arch to Rollup package name
const platformMap = {
  'darwin-arm64': '@rollup/rollup-darwin-arm64',
  'darwin-x64': '@rollup/rollup-darwin-x64',
  'linux-x64': '@rollup/rollup-linux-x64-gnu',
  'linux-arm64': '@rollup/rollup-linux-arm64-gnu',
  'win32-x64': '@rollup/rollup-win32-x64-msvc',
  'win32-arm64': '@rollup/rollup-win32-arm64-msvc',
};

const key = `${platform}-${arch}`;
const packageName = platformMap[key];

if (!packageName) {
  console.log(`No Rollup binary mapping for ${key}, skipping postinstall`);
  process.exit(0);
}

// Check if package is already installed
const nodeModulesPath = path.join(__dirname, '..', 'node_modules', packageName.replace('/', path.sep));
if (fs.existsSync(nodeModulesPath)) {
  console.log(`${packageName} already installed, skipping`);
  process.exit(0);
}

// Install the platform-specific package
console.log(`Installing ${packageName} for ${key}...`);

try {
  execSync(`npm install ${packageName} --no-save --ignore-scripts`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log(`Installed ${packageName} successfully`);
} catch (error) {
  console.warn(`Warning: Failed to install ${packageName}`);
  console.warn('Manual fix: npm install ' + packageName);
  // Don't exit with error - let the build fail with a clearer message
  process.exit(0);
}
