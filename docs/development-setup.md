# Development Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building](#building)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

#### Node.js and npm
- **Version**: Node.js 18+ (LTS recommended)
- **Package Manager**: npm 9+

Install from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`:
```bash
# Using nvm
nvm install 18
nvm use 18
```

#### Rust
- **Version**: 1.81.0 or higher
- **Required for**: Tauri backend compilation

Install via [rustup](https://rustup.rs/):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify installation:
```bash
rustc --version
cargo --version
```

#### Platform-Specific Dependencies

##### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

##### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libsqlite3-dev
```

##### Windows
- Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### Optional Tools

#### Diesel CLI
Required for database migrations:
```bash
cargo install diesel_cli --no-default-features --features sqlite
```

#### Docker
Required for E2E testing:
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- docker-compose (included with Docker Desktop)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url> open-xam
cd open-xam
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

This installs:
- Angular 21 and dependencies
- TailwindCSS 4
- TypeScript and tooling
- Testing frameworks (Jest, Selenium)
- ESLint and code quality tools

#### Backend Dependencies
Rust dependencies are managed via `Cargo.toml` and automatically downloaded during build.

### 3. Verify Installation

```bash
# Check Angular CLI
npx ng version

# Check Tauri CLI
npm run tauri -- --version
```
## Preparation for SQLite Database
To use the Database, in development mode, you need to create a directory for the database file called "db" inside the root directory of the project.

## Project Structure

```
open-xam/
├── src/                      # Angular frontend source
│   ├── app/                  # Application code
│   │   ├── features/         # Feature modules
│   │   ├── shared/           # Shared code
│   │   └── app.routes.ts     # Route definitions
│   ├── locale/               # i18n translation files
│   ├── styles/               # Global styles
│   └── main.ts               # Angular bootstrap
├── src-tauri/                # Rust backend source
│   ├── src/
│   │   ├── presentation/     # Tauri command handlers
│   │   ├── application/      # Use cases and CRUD
│   │   ├── domain/           # Domain models and validation
│   │   ├── infrastructure/   # Repositories and filters
│   │   ├── schema.rs         # Diesel schema (generated)
│   │   └── lib.rs            # Library entry point
│   ├── migrations/           # Database migrations
│   ├── test-db/              # Test database fixtures
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── e2e/                      # End-to-end tests
│   ├── specs/                # Test specifications
│   ├── runner.js             # Test runner
│   └── screenshots/          # Test screenshots
├── docs/                     # Technical documentation
├── jest.config.js            # Jest configuration
├── tsconfig.json             # TypeScript configuration
├── angular.json              # Angular workspace config
├── tailwind.config.js        # TailwindCSS configuration
└── package.json              # npm dependencies and scripts
```

## Development Workflow

### Starting Development Server

#### Angular Development Server (Frontend Only)
```bash
npm run start
# or
npm run ng serve
```

- Runs on `http://localhost:1420`
- Hot reload enabled
- No backend functionality

#### Tauri Development Mode (Full Stack)
```bash
npm run tauri:dev
```

This will:
1. Build the Rust backend in debug mode
2. Start the Angular development server
3. Launch the Tauri desktop window
4. Enable hot reload for both frontend and backend

**First run will take longer** as Cargo downloads and compiles dependencies.

### Making Changes

#### Frontend Development

1. Navigate to `src/app/`
2. Edit Angular components, services, or styles
3. Changes auto-reload in the Tauri window

**Component Generation:**
```bash
npx ng generate component features/my-feature/my-component
```

#### Backend Development

1. Navigate to `src-tauri/src/`
2. Edit Rust files
3. Save changes to trigger recompilation
4. Tauri window restarts automatically

**Add a new Tauri command:**

```rust
// src-tauri/src/presentation/my_handler.rs
#[tauri::command]
pub fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Received: {}", param))
}

// Register in src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
    my_command,
    // ... other commands
])
```

### Database Migrations

#### Creating a New Migration

```bash
cd src-tauri
diesel migration generate my_migration_name
```

This creates:
```
migrations/
└── YYYY-MM-DD-HHMMSS_my_migration_name/
    ├── up.sql      # Migration SQL
    └── down.sql    # Rollback SQL
```

#### Applying Migrations

Migrations run automatically on application startup. For manual execution:

```bash
cd src-tauri
diesel migration run
```

#### Rolling Back Migrations

```bash
cd src-tauri
diesel migration revert
```

#### Regenerating Schema

After modifying migrations:
```bash
cd src-tauri
diesel migration run
# schema.rs is automatically updated
```

### Code Quality

#### Linting

**Frontend (ESLint):**
```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
```

**Backend (Clippy):**
```bash
cd src-tauri
cargo clippy           # Lint checks
cargo clippy --fix     # Auto-fix
```

#### Formatting

**Frontend (Prettier - if configured):**
```bash
npx prettier --write "src/**/*.{ts,html,scss}"
```

**Backend (rustfmt):**
```bash
cd src-tauri
cargo fmt
```

## Testing

### Frontend Unit Tests

OpenXam uses **Jest** with Angular testing utilities.

**Run all tests:**
```bash
npm run test
```

**Run specific test file:**
```bash
npm run test -- --testPathPattern="exam.service"
```

**Run with coverage:**
```bash
npm run test -- --coverage
```

**Watch mode:**
```bash
npm run test -- --watch
```

**Test file location:**
```
src/app/**/*.spec.ts
```

### Backend Unit Tests

**Run all Rust tests:**
```bash
cd src-tauri
cargo test
```

**Run specific test:**
```bash
cd src-tauri
cargo test test_name
```

**Run with output:**
```bash
cd src-tauri
cargo test -- --nocapture
```

**Test coverage:**
```bash
cd src-tauri
cargo install cargo-llvm-cov  # Once
cargo llvm-cov --summary-only
```

**Test file location:**
```
src-tauri/src/**/tests/*.rs
src-tauri/src/**/*_test.rs
```

### End-to-End Tests

E2E tests use **Selenium WebDriver** with **Mocha** and run in Docker for consistency.

**Prerequisites:**
- Docker and docker-compose installed
- Built debug version of the application

**Run E2E tests:**
```bash
# Build and run in Docker
npm run test:e2e:docker

# Force rebuild
npm run test:e2e:docker:rebuild

# Debug shell in container
make docker-shell
```

**E2E test location:**
```
e2e/specs/*.test.js
```

## Building

### Development Build

**Frontend only:**
```bash
npm run build
```
Output: `dist/open-xam/browser/`

**Full application (debug):**
```bash
npm run tauri:build:debug
```

Output:
- macOS: `src-tauri/target/debug/bundle/dmg/`
- Linux: `src-tauri/target/debug/bundle/appimage/`
- Windows: `src-tauri/target/debug/bundle/msi/`

### Production Build

```bash
npm run tauri:build
```

This produces optimized, release-mode builds:
- Frontend: Minified and tree-shaken
- Backend: Optimized Rust binary
- Installers: Platform-specific packages

**Build artifacts:**
- macOS: `.dmg`, `.app`
- Windows: `.exe`, `.msi`
- Linux: `.AppImage`, `.deb`

Location: `src-tauri/target/release/bundle/`

### Build Configuration

**Frontend optimization** (`angular.json`):
- Production configuration with AOT compilation
- Source maps disabled in production
- CSS and JS minification

**Backend optimization** (`Cargo.toml`):
```toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

## Environment Variables

### Development

**.env file** (if needed):
```bash
# Frontend
NG_APP_ENV=development

# Backend (Rust)
RUST_LOG=debug
DATABASE_URL=sqlite://path/to/db.sqlite
```

### Tauri Configuration

Edit `src-tauri/tauri.conf.json`:
```json
{
  "build": {
    "devPath": "http://localhost:1420",
    "distDir": "../dist/open-xam/browser"
  },
  "app": {
    "windows": [
      {
        "title": "OpenXam",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

## Debugging

### Frontend Debugging

**Browser DevTools in Tauri:**
- macOS/Linux: `Cmd/Ctrl + Shift + I`
- Or enable devtools in `tauri.conf.json`

**VS Code Launch Configuration:**
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Angular",
  "url": "http://localhost:1420",
  "webRoot": "${workspaceFolder}/src"
}
```

### Backend Debugging

**Print Debugging:**
```rust
use log::{debug, info, error};

info!("Processing exam with id: {}", id);
debug!("Query result: {:?}", result);
```

View logs in terminal during `npm run tauri:dev`.

**LLDB/GDB Debugging:**
```bash
cd src-tauri
cargo build
lldb target/debug/open-xam
```

## Troubleshooting

### Common Issues

#### "Command not found: ng"
**Solution:**
```bash
npm install -g @angular/cli
# or use npx
npx ng serve
```

#### Diesel Schema Issues
**Solution:**
```bash
cd src-tauri
diesel migration run
diesel setup  # If database doesn't exist
```

#### Tauri Build Fails on Linux
**Solution:**
```bash
# Install missing dependencies
sudo apt install libwebkit2gtk-4.1-dev
```

#### Port 1420 Already in Use
**Solution:**
```bash
# Kill process using port
lsof -ti:1420 | xargs kill -9

# Or change port in angular.json and tauri.conf.json
```

#### Rust Compilation Errors After Update
**Solution:**
```bash
cd src-tauri
cargo clean
cargo build
```

#### Node Module Issues
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. Check existing documentation in `docs/`
2. Check GitHub issues (if applicable)
3. Rust errors: Search [docs.rs](https://docs.rs)
4. Angular errors: Check [Angular Docs](https://angular.io/)

## Development Tips

### Hot Reload Performance

For faster iteration:
```bash
# Frontend only (when not testing Rust changes)
npm run start

# Then manually test with previous Tauri build
```

### Database Inspection

```bash
# Install sqlite3
brew install sqlite3  # macOS
sudo apt install sqlite3  # Linux

# Open database
sqlite3 ~/Library/Application\ Support/com.openxam.dev/app.db  # macOS
# or check tauri.conf.json for database location

# Query tables
.tables
.schema exam
SELECT * FROM exam;
```

### Faster Rust Builds

**Use Cargo cache:**
```bash
# Install sccache
cargo install sccache

# Add to ~/.cargo/config.toml
[build]
rustc-wrapper = "sccache"
```

**Reduce optimization in debug:**
```toml
# Cargo.toml
[profile.dev]
opt-level = 0
```

### Code Generation

**Angular:**
```bash
# Component
npx ng g component features/admin/my-component

# Service
npx ng g service shared/service/my-service

# Pipe
npx ng g pipe shared/pipes/my-pipe
```

## Next Steps

- Read [Architecture Documentation](./architecture.md)
- Learn about [Filter API](./filter-api.md)
- Understand [Validation API](./validation-api.md)
- Start implementing features
