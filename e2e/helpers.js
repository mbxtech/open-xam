import { Builder, By, until, Capabilities } from 'selenium-webdriver';
import { config, getApplicationPath } from './config.js';
import os from 'node:os';

let driver = null;

/**
 * Check if the current platform supports tauri-driver
 */
function checkPlatformSupport() {
  const platform = os.platform();
  if (platform === 'darwin') {
    console.warn('WARNING: tauri-driver does not support macOS directly.');
    console.warn('E2E tests should be run in Docker: npm run test:e2e:docker');
    console.warn('Attempting to connect anyway...');
  }
}

/**
 * Initialize the Selenium WebDriver connected to tauri-driver
 */
export async function initDriver() {
  if (driver) {
    return driver;
  }

  checkPlatformSupport();

  const capabilities = new Capabilities();
  capabilities.set('tauri:options', {
    application: getApplicationPath()
  });

  try {
    driver = await new Builder()
      .usingServer(config.seleniumUrl)
      .withCapabilities(capabilities)
      .build();

    // Set timeouts
    await driver.manage().setTimeouts({
      implicit: config.timeouts.implicit,
      pageLoad: config.timeouts.pageLoad,
      script: config.timeouts.script
    });

    return driver;
  } catch (error) {
    const platform = os.platform();
    if (platform === 'darwin') {
      throw new Error(
        `Failed to connect to tauri-driver. On macOS, e2e tests must run in Docker.\n` +
        `Run: npm run test:e2e:docker\n` +
        `Original error: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Get the current driver instance
 */
export function getDriver() {
  if (!driver) {
    throw new Error('Driver not initialized. Call initDriver() first.');
  }
  return driver;
}

/**
 * Quit the driver and clean up
 */
export async function quitDriver() {
  if (driver) {
    await driver.quit();
    driver = null;
  }
}

/**
 * Find an element by CSS selector
 */
export async function $(selector) {
  const d = getDriver();
  return d.findElement(By.css(selector));
}

/**
 * Find multiple elements by CSS selector
 */
export async function $$(selector) {
  const d = getDriver();
  return d.findElements(By.css(selector));
}

/**
 * Find an element by link text (exact match)
 * Equivalent to WebdriverIO's $('a=Text')
 */
export async function $linkText(text) {
  const d = getDriver();
  return d.findElement(By.linkText(text));
}

/**
 * Find an element by partial link text
 * Equivalent to WebdriverIO's $('a*=Text')
 */
export async function $partialLinkText(text) {
  const d = getDriver();
  return d.findElement(By.partialLinkText(text));
}

/**
 * Find an element by XPath
 */
export async function $xpath(xpath) {
  const d = getDriver();
  return d.findElement(By.xpath(xpath));
}

/**
 * Find a button by its text content
 * Equivalent to WebdriverIO's $('button=Text')
 */
export async function $buttonText(text) {
  const d = getDriver();
  return d.findElement(By.xpath(`//button[normalize-space()='${text}']`));
}

/**
 * Find an element by text content (any element)
 * Equivalent to WebdriverIO's $('tag=Text')
 */
export async function $text(tag, text) {
  const d = getDriver();
  return d.findElement(By.xpath(`//${tag}[normalize-space()='${text}']`));
}

/**
 * Find an element by ID
 */
export async function $id(id) {
  const d = getDriver();
  return d.findElement(By.id(id));
}

/**
 * Wait for an element to be present and visible
 */
export async function waitForElement(selector, timeout = config.timeouts.implicit) {
  const d = getDriver();
  const locator = By.css(selector);
  await d.wait(until.elementLocated(locator), timeout);
  const element = await d.findElement(locator);
  await d.wait(until.elementIsVisible(element), timeout);
  return element;
}

/**
 * Wait for an element located by XPath to be present and visible
 */
export async function waitForXpath(xpath, timeout = config.timeouts.implicit) {
  const d = getDriver();
  const locator = By.xpath(xpath);
  await d.wait(until.elementLocated(locator), timeout);
  const element = await d.findElement(locator);
  await d.wait(until.elementIsVisible(element), timeout);
  return element;
}

/**
 * Check if an element exists (does not throw if not found)
 */
export async function elementExists(selector) {
  const d = getDriver();
  try {
    await d.findElement(By.css(selector));
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an element by XPath exists (does not throw if not found)
 */
export async function xpathExists(xpath) {
  const d = getDriver();
  try {
    await d.findElement(By.xpath(xpath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Set value on an input element (clears existing value first)
 */
export async function setValue(selector, value) {
  const element = await $(selector);
  await element.clear();
  await element.sendKeys(value);
}

/**
 * Click an element by selector
 */
export async function click(selector) {
  const element = await $(selector);
  await element.click();
}

/**
 * Get text content of an element
 */
export async function getText(selector) {
  const element = await $(selector);
  return element.getText();
}

/**
 * Take a screenshot and save it to the screenshots directory
 */
export async function takeScreenshot(filename) {
  const d = getDriver();
  const screenshot = await d.takeScreenshot();
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const screenshotPath = path.join(config.screenshotsDir, filename);
  await fs.mkdir(config.screenshotsDir, { recursive: true });
  await fs.writeFile(screenshotPath, screenshot, 'base64');

  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { By, until };
