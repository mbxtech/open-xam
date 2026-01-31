# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenXam is a cross-platform exam simulation desktop application built with:
- **Frontend**: Angular 21 with TailwindCSS 4
- **Backend**: Rust with Tauri 2 (desktop framework)
- **Database**: SQLite via Diesel ORM
- **State Management**: @ngneat/elf

## Common Commands

```bash
# Development
npm run start           # Start Angular dev server (port 1420)
npm run tauri:dev       # Start Tauri dev mode (Angular + Rust)

# Building
npm run build           # Build Angular only
npm run tauri:build     # Build production Tauri app
npm run tauri:build:debug  # Build debug Tauri app

# Testing
npm run test            # Run Jest unit tests
npm run test -- --testPathPattern="filename"  # Run single test file
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix

# Rust testing (from src-tauri/)
cargo test              # Run Rust unit tests
cargo llvm-cov --summary-only  # Rust test coverage

# E2E Tests (requires Docker)
npm run test:e2e:docker # Run E2E in Docker container
make docker-shell       # Debug shell in E2E container
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
│   └── pipes/          # Angular pipes
└── app.routes.ts       # Route definitions
```

**Component prefix**: `ox-` (e.g., `ox-button`, `ox-card`)

### Backend (src-tauri/src/)

Clean Architecture pattern:
```
src-tauri/src/
├── presentation/       # Tauri invoke handlers (IPC endpoints)
├── application/
│   ├── crud/           # CRUD operations
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
- **E2E**: Selenium with Mocha/Chai in Docker (see `e2e.md`)

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
