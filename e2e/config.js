import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Get the application path based on the current platform
 */
export function getApplicationPath() {
  const isDocker = process.env.DOCKER_CONTAINER === 'true' ||
                   process.env.DISPLAY === ':99';

  if (isDocker) {
    return path.resolve(projectRoot, 'src-tauri/target/release/OpenXam');
  }

  const platform = os.platform();

  if (platform === 'darwin') {
    return path.resolve(
      projectRoot,
      'src-tauri/target/release/bundle/macos/YourApp.app/Contents/MacOS/OpenXam'
    );
  } else if (platform === 'linux') {
    return path.resolve(projectRoot, 'src-tauri/target/release/OpenXam');
  } else if (platform === 'win32') {
    return path.resolve(projectRoot, 'src-tauri/target/release/OpenXam.exe');
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

export const config = {
  // Tauri driver port
  port: 4444,

  // Base URL for the Selenium server (tauri-driver)
  seleniumUrl: 'http://localhost:4444',

  // Timeouts
  timeouts: {
    implicit: 10000,      // Implicit wait for elements
    pageLoad: 30000,      // Page load timeout
    script: 30000,        // Script execution timeout
    connectionRetry: 120000,
    driverStartup: 3000   // Time to wait for tauri-driver to start
  },

  // Test specs pattern
  specsPattern: './e2e/specs/**/*.spec.js',

  // Screenshots directory
  screenshotsDir: './e2e/screenshots',

  // Application path
  applicationPath: getApplicationPath(),

  // Mocha options
  mochaOptions: {
    timeout: 60000,
    slow: 10000,
    reporter: 'spec'
  }
};

export default config;
