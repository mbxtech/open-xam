# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenXam is a cross-platform exam simulation desktop application built with:
- **Frontend**: Angular 21 with TailwindCSS 4
- **Backend**: Rust with Tauri 2 (desktop framework)
- **Database**: SQLite via Diesel ORM

## Common Commands

```bash
# Development
npm run start           # Start Angular dev server (port 1420)
npm run tauri:dev       # Start Tauri dev mode (Angular + Rust)

# Building
npm run build                 # Build Angular only
npm run:tauri:build           # Build production Tauri app
npm run:tauri:build:debug     # Build debug Tauri app

# Testing
npm run test                                  # Run Jest unit tests
npm run test -- --testPathPattern="filename"  # Run single test file
npm run lint                                  # ESLint check
npm run lint:fix                              # ESLint auto-fix

# Rust testing (from src-tauri/)
cargo test                      # Run Rust unit tests
cargo llvm-cov --summary-only   # Rust test coverage

# E2E Tests (requires Docker)
npm run test:e2e:docker             # Run E2E in Docker container
npm run test:e2e:docker:build       # Build E2E Docker container
npm run docker:clean:build-cache    # Clear Docker build cache
```

## Architecture

### Frontend (src/app/)

```
src/app/
├── features/           # Feature modules
│   ├── admin/          # Exam administration (CRUD)
│   ├── learning/       # Exam practice modes (simulation, certification)
│   └── dashboard/      # Home dashboard
├── shared/
│   ├── components/     # Reusable UI components
│   ├── directives/     # Custom Angular directives
│   ├── forms/          # Form controls (toggle, input, select)
│   ├── service/        # Tauri IPC services
│   ├── util/           # Utility functions and helpers
│   ├── model/          # TypeScript interfaces
│   ├── pipes/          # Angular pipes
│   └── styles/         # Compouted styles
└── app.routes.ts       # Route definitions
```

**Component prefix**: `ox-` (e.g., `ox-button`, `ox-card`)
## Code Guidlines Frontend
- use single qutoes for strings and imports
- preffer template strings instead of concationation

### Backend (src-tauri/src/)

Clean Architecture pattern:
```
src-tauri/src/
├── presentation/       # Tauri invoke handlers (IPC endpoints)
├── application/
│   ├── crud/           # CRUD operations traits
│   └── usecase/        # Business logic use cases
├── domain/
│   ├── entities/       # Database entities (Diesel)
│   ├── model/          # Domain models
│   ├── validation/     # Validation rules
│   └── traits/         # Shared traits
├── infrastructure/
│   ├── repositories/   # Data access layer
│   ├── mapper/         # Entity <-> Model mapping
│   └── filter/         # Query filters
└── schema.rs           # Diesel schema (auto-generated)
```

### E2E Tests (e2e)
```
e2e/
├── artifacts/          # Artifacts of e2e test results
│   ├── logs/           # Test und Applicaton Logs
│   ├── screenshotes /  # Scrennshots of failing Tests
│   └── wdio-logs/      # WebdriverIO Logs
├── specs/              # Test implementations
├── workflows/          # Description of Applicaton workflows
├── Dockerfile          # Dockerfile for running tests inside a Linux container
└── wdio.conf.js        # WebdriverIO Configuration file
```

### Frontend-Backend Communication

Angular services extend `BaseService` and use Tauri's `invoke()` for IPC:

```typescript
// Frontend service call
this.invoke$<Exam>('get_exam', { id: examId })

// Backend handler (src-tauri/src/presentation/)
#[tauri::command]
pub fn get_exam(id: i32) -> Result<Exam, String>
```

## Key Technologies

- **Angular i18n**: Uses `$localize` for translations (locale files in `src/locale/`)
- **Diesel Migrations**: Located in `src-tauri/migrations/`
- **Test Database**: `src-tauri/test-db/` for integration tests
- **E2E**: WebdriverIO with Jestmatchers in Docker
## Database

Diesel ORM with SQLite. Schema changes:
```bash
cd src-tauri
diesel migration generate <name>   # Create migration
diesel migration run               # Apply migrations
```

Schema file `src-tauri/src/schema.rs` is auto-generated.

## Exam Import Functionality

The application supports importing exams from external files via the admin interface.

### Supported File Formats

**JSON Format** (`application/json`):
- Direct import of exam data structure
- Must match the `IExam` interface schema
- See `templates/import_template_json.json` for the complete structure

**Text Format** (`text/plain`):
- Human-readable format for easy manual creation
- See `templates/import_template_txt.txt` for syntax examples

### Text Format Syntax

```
Q: <question type hint> P: <points>
<question text>
[X] (a) Correct answer
[ ] (b) Incorrect answer

# Assignment questions use:
A: Option1 | Option2 | Option3
[X] [ ] [ ] (a) Answer assigned to Option1
[ ] [X] [ ] (b) Answer assigned to Option2
```

**Prefixes:**
- `Q:` - Question header (required), followed by `P:` for points
- `A:` - Assignment options header (pipe-separated options)
- `[X]` - Correct/selected answer
- `[ ]` - Incorrect/unselected answer

### Question Types

The importer automatically determines question type:
- **SINGLE_CHOICE**: One correct answer marked with `[X]`
- **MULTIPLE_CHOICE**: Multiple correct answers marked with `[X]`
- **ASSIGNMENT**: Uses `A:` header with option columns

### Import Flow

1. Files are uploaded via the admin import page (`/admin/exams/import`)
2. `ExamImportService` processes files based on MIME type
3. Exams are validated against backend rules
4. Valid exams are saved to the database
5. Invalid exams are cached for manual correction

### Templates

Located in `/templates/`:
- `import_template_json.json` - JSON import structure example
- `import_template_txt.txt` - Text format syntax example
