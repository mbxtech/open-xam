#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import Mocha from 'mocha';
import { config } from './config.js';

/**
 * Simple glob implementation for finding spec files
 */
function findSpecFiles(dir, pattern) {
  const files = [];
  const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && regex.test(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir);
  }
  return files;
}

let tauriDriver = null;

/**
 * Start the tauri-driver process
 */
async function startTauriDriver() {
  console.log('Starting tauri-driver...');

  return new Promise((resolve, reject) => {
    const driverPath = path.resolve(process.env.HOME, '.cargo', 'bin', 'tauri-driver');

    tauriDriver = spawn(driverPath, ['--port', String(config.port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DISPLAY: process.env.DISPLAY || ':99'
      }
    });

    tauriDriver.stdout.on('data', (data) => {
      console.log(`[tauri-driver] ${data.toString().trim()}`);
    });

    tauriDriver.stderr.on('data', (data) => {
      console.error(`[tauri-driver] ${data.toString().trim()}`);
    });

    tauriDriver.on('error', (err) => {
      console.error('Failed to start tauri-driver:', err);
      reject(err);
    });

    tauriDriver.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`tauri-driver exited with code ${code}`);
      }
    });

    // Wait for driver to be ready
    setTimeout(() => {
      console.log('tauri-driver should be ready');
      resolve();
    }, config.timeouts.driverStartup);
  });
}

/**
 * Stop the tauri-driver process
 */
function stopTauriDriver() {
  console.log('Stopping tauri-driver...');
  if (tauriDriver) {
    tauriDriver.kill('SIGTERM');
    tauriDriver = null;
  }
}

/**
 * Run the Mocha tests
 */
async function runTests() {
  const mocha = new Mocha({
    timeout: config.mochaOptions.timeout,
    slow: config.mochaOptions.slow,
    reporter: config.mochaOptions.reporter
  });

  // Find all spec files
  const specsDir = './e2e/specs';
  const specs = findSpecFiles(specsDir, '.*\\.spec\\.js$');

  if (specs.length === 0) {
    console.warn('No test specs found in:', specsDir);
    return 0;
  }

  console.log(`Found ${specs.length} test file(s)`);

  // Add spec files to Mocha
  for (const spec of specs) {
    mocha.addFile(spec);
  }

  // Load files asynchronously for ESM support
  await mocha.loadFilesAsync();

  // Run the tests
  return new Promise((resolve) => {
    mocha.run((failures) => {
      resolve(failures);
    });
  });
}

/**
 * Main function
 */
async function main() {
  let exitCode = 0;

  try {
    await startTauriDriver();
    exitCode = await runTests();
  } catch (error) {
    console.error('Error running tests:', error);
    exitCode = 1;
  } finally {
    stopTauriDriver();
  }

  process.exit(exitCode);
}

// Handle process termination
process.on('SIGINT', () => {
  stopTauriDriver();
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopTauriDriver();
  process.exit(1);
});

main();
