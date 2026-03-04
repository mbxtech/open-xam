import os from 'os';
import path from 'path';
import {spawn, exec} from 'child_process';
import {fileURLToPath} from 'url';
import * as fs from "node:fs";
import waitOn from "wait-on";

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_LOG_DIR = `${os.homedir()}/.open-xam-logs`;
const ARTIFACTS_DIR = './artifacts/screenshots';
const APP_BINARY_PATH = path.resolve(__dirname, '../src-tauri/target/debug/open-xam');

// keep track of the `tauri-driver` child process
let tauriDriver;

export const config = {
    hostname: '127.0.0.1',
    port: 4444,
    specs: ['./specs/**/*.js'],
    maxInstances: 1,
    capabilities: [
        {
            maxInstances: 1,
            'tauri:options': {
                application: APP_BINARY_PATH,
            },
        },
    ],
    reporters: ['spec'],
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },

    onPrepare: async () => {
        console.log(`Application (${APP_BINARY_PATH}) exists: ${fs.existsSync(APP_BINARY_PATH)}`);

        // Sicherstellen dass das Log-Verzeichnis existiert
        fs.mkdirSync('./artifacts/logs', { recursive: true });
        fs.mkdirSync('./artifacts/screenshots', { recursive: true });

        const driverBin = path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver');

        tauriDriver = spawn(
            driverBin,
            ['--port', '4444'],
            {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    DISPLAY: ':99',
                    DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS,
                    RUST_LOG: 'debug',
                    RUST_BACKTRACE: 'full',
                }
            }
        );

        /*const driverLog = fs.createWriteStream('./artifacts/logs/tauri-driver.log');

        tauriDriver.stdout.on('data', (d) => {
            process.stdout.write(`[DRIVER] ${d}`);
            driverLog.write(d);
        });

        tauriDriver.stderr.on('data', (d) => {
            process.stderr.write(`[DRIVER ERR] ${d}`);
            driverLog.write(d);
        });

        tauriDriver.on('exit', (code, signal) => {
            console.error(`💥 tauri-driver exited! Code: ${code}, Signal: ${signal}`);
        });*/

        // Wait until driver port is open
        await waitOn({
            resources: ['tcp:127.0.0.1:4444'],
            timeout: 15000,
            interval: 250,
        });
        console.log('✅ tauri-driver ready on 127.0.0.1:4444');
    },

    afterTest: async (test, context, {error}) => {
        if (error) {
            const safeName = test.title.replace(/[^a-z0-9]/gi, '_');
            const timestamp = Date.now();

            const screenshotPath = path.join(ARTIFACTS_DIR, `${safeName}-${timestamp}.png`);
            await browser.saveScreenshot(screenshotPath);
            console.log(`📸 Screenshot: ${screenshotPath}`);

            try {
                const files = fs.readdirSync(APP_LOG_DIR);
                for (const file of files) {
                    /*const content = fs.readFileSync(path.join(APP_LOG_DIR, file), 'utf-8');
                    const last100Lines = content.split('\n').slice(-100).join('\n');
                    console.log(`\n📋 App-Log [${file}]:\n${last100Lines}`);*/

                    fs.copyFileSync(
                        path.join(APP_LOG_DIR, file),
                        path.join('./artifacts/logs', `${safeName}-${timestamp}-${file}`)
                    );
                }
            } catch (e) {
                console.warn('⚠️ Logs are not readable:', e.message);
            }
        }
    },

    // clean up the `tauri-driver` process we spawned at the start of the session
    onComplete: () => {
        closeTauriDriver();
    },

    afterSession: () => {
        closeTauriDriver();
    },
};

function closeTauriDriver() {
    if (tauriDriver && !tauriDriver.killed) {
        tauriDriver.kill();
        console.log('🛑 tauri-driver gestoppt');
    }
}

function onShutdown(fn) {
    const cleanup = () => {
        try { fn(); } finally { process.exit(); }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGHUP', cleanup);
    process.on('SIGBREAK', cleanup);
}

onShutdown(() => closeTauriDriver());