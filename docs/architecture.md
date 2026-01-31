# OpenXam Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)

## Overview

OpenXam is a cross-platform exam simulation desktop application following a **Clean Architecture** pattern with a clear separation between frontend and backend layers. The application uses **Tauri 2** as the bridge between the Angular frontend and Rust backend.

### Key Characteristics
- **Cross-platform**: Runs on Windows, macOS, and Linux
- **Desktop-first**: Native desktop application with local database
- **Type-safe**: TypeScript frontend, Rust backend
- **Modern**: Built with latest Angular 21 and Tauri 2

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 21.x | UI framework |
| **TypeScript** | 5.9.x | Type-safe JavaScript |
| **TailwindCSS** | 4.x | Utility-first CSS framework |
| **@ngneat/elf** | 2.5.x | State management library |
| **FontAwesome** | 7.x | Icon library |
| **RxJS** | 7.8.x | Reactive programming |
| **ngx-indexed-db** | 22.x | Browser-side storage |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | 1.81.0+ | Systems programming language |
| **Tauri** | 2.x | Desktop application framework |
| **Diesel** | 2.2.x | ORM and query builder |
| **SQLite** | 3.35+ | Embedded database |
| **Serde** | 1.x | Serialization/deserialization |
| **Chrono** | 0.4.x | Date/time handling |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Jest** | Unit testing (Frontend) |
| **Cargo** | Rust build system and package manager |
| **ESLint** | JavaScript/TypeScript linting |
| **Selenium** | End-to-end testing |
| **Docker** | Containerized E2E test environment |

## Architecture Layers

OpenXam follows **Clean Architecture** principles, particularly on the backend. The architecture is organized into distinct layers with clear dependencies flowing inward:

```
┌─────────────────────────────────────────────────────┐
│                   Presentation                      │
│          (Tauri IPC Handlers / Commands)            │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  Application                        │
│         (Use Cases & CRUD Operations)               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                    Domain                           │
│       (Entities, Models, Validation, Traits)        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                Infrastructure                       │
│      (Repositories, Mappers, Filters, Database)     │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Presentation Layer (`src-tauri/src/presentation/`)
- Exposes Tauri command handlers for IPC communication
- Receives requests from the Angular frontend
- Delegates to application layer use cases
- Returns serialized responses

#### Application Layer (`src-tauri/src/application/`)
- Contains business logic and use cases
- Orchestrates domain objects and repositories
- Implements CRUD operations via repository traits
- Manages transactions and error handling

**Subdirectories:**
- `crud/` - CRUD repository implementations and traits
- `usecase/` - Business logic use cases

#### Domain Layer (`src-tauri/src/domain/`)
- Core business entities and models
- Domain logic and validation rules
- Database entity definitions (Diesel)
- Shared traits and interfaces

**Subdirectories:**
- `entities/` - Diesel database entities
- `model/` - Domain models (DTOs)
- `validation/` - Validation framework
- `traits/` - Shared trait definitions

#### Infrastructure Layer (`src-tauri/src/infrastructure/`)
- Data access implementation
- External service integrations
- Database queries and migrations
- Entity-to-model mapping

**Subdirectories:**
- `repositories/` - Repository implementations
- `mapper/` - Entity ↔ Model conversions
- `filter/` - Dynamic query filter builders

## Frontend Architecture

### Directory Structure

```
src/app/
├── features/              # Feature modules (lazy-loaded)
│   ├── admin/             # Exam administration (CRUD)
│   ├── learning/          # Exam practice modes
│   └── dashboard/         # Dashboard views
├── shared/
│   ├── components/        # Reusable UI components
│   ├── directives/        # Custom Angular directives
│   ├── forms/             # Form controls (toggle, input, select)
│   ├── service/           # Tauri IPC services
│   ├── util/              # Utility functions
│   ├── model/             # TypeScript interfaces
│   └── pipes/             # Angular pipes
└── app.routes.ts          # Route definitions
```

### Component Conventions

All custom components use the `ox-` prefix:
- `ox-button`
- `ox-card`
- `ox-input`
- etc.

### State Management

OpenXam uses **@ngneat/elf** for state management:
- Stores are organized by domain (exam, category, etc.)
- Reactive state updates via RxJS observables
- Immutable state updates

### Service Layer

Services extend `BaseService` which provides:
- Tauri IPC communication via `invoke$()`
- Error handling and transformation
- Observable-based async operations

**Example:**
```typescript
export class ExamService extends BaseService {
  getExam(id: number): Observable<Exam> {
    return this.invoke$<Exam>('get_exam', { id });
  }
}
```

## Backend Architecture

### Clean Architecture Implementation

The backend strictly follows Clean Architecture:

1. **Dependency Rule**: Dependencies point inward
   - Infrastructure depends on Domain
   - Application depends on Domain
   - Presentation depends on Application

2. **Inversion of Control**: Using traits (interfaces)
   - `CRUDRepository<T>` trait
   - `Validation` trait
   - `FilterColumnResolver<T>` trait

### Database Schema

Database schema is managed through **Diesel migrations**:

```
src-tauri/
├── migrations/           # SQL migrations (timestamped)
└── src/
    └── schema.rs         # Auto-generated Diesel schema
```

**Key Tables:**
- `exam` - Exam metadata
- `category` - Exam categories
- `question` - Questions belonging to exams
- `answer` - Possible answers for questions
- `assignment_option` - Question-answer relationships

### Entity ↔ Model Mapping

The backend maintains two representations:

1. **Entities** (`domain/entities/`)
   - Diesel-annotated structs
   - Direct database mapping
   - Used for persistence operations

2. **Models** (`domain/model/`)
   - Business domain objects
   - Serializable for IPC
   - May include computed fields or nested data

**Conversion:**
```rust
impl From<&ExamEntity> for Exam {
    fn from(entity: &ExamEntity) -> Self {
        // Map entity fields to model
    }
}
```

## Data Flow

### Request Flow (Frontend → Backend)

```
┌─────────────┐
│   Angular   │
│  Component  │
└──────┬──────┘
       │ calls service method
       ▼
┌─────────────┐
│   Service   │
│(BaseService)│
└──────┬──────┘
       │ invoke$('command_name', params)
       ▼
┌─────────────┐
│   Tauri     │
│     IPC     │
└──────┬──────┘
       │ serializes & sends to Rust
       ▼
┌─────────────┐
│ Presentation│ #[tauri::command]
│   Handler   │
└──────┬──────┘
       │ calls use case or repository
       ▼
┌─────────────┐
│ Application │ Business logic
│  Use Case   │
└──────┬──────┘
       │ uses repository
       ▼
┌─────────────┐
│Infrastructure│ Database query
│ Repository  │
└──────┬──────┘
       │ Diesel query
       ▼
┌─────────────┐
│   SQLite    │
│   Database  │
└─────────────┘
```

### Response Flow (Backend → Frontend)

```
┌─────────────┐
│   SQLite    │ Returns rows
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │ Maps Entity → Model
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Use Case   │ Processes & returns Result
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Handler   │ Serializes to JSON
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Tauri IPC  │ Sends to frontend
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │ Observable<T>
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Component  │ Updates UI
└─────────────┘
```

## Design Patterns

### Backend Patterns

#### Repository Pattern
All data access goes through repository interfaces:
```rust
pub trait CRUDRepository<T> {
    fn create(&mut self, entity: &T) -> CRUDResult<T>;
    fn update(&mut self, entity: &T) -> CRUDResult<T>;
    fn delete(&mut self, id: i32) -> CRUDResult<usize>;
    fn find_by_id(&mut self, id: i32) -> CRUDResult<Option<T>>;
    fn find_all(&mut self) -> CRUDResult<Vec<T>>;
}
```

#### Trait-based Validation
Domain models implement the `Validation` trait:
```rust
pub trait Validation {
    fn validate(&self) -> ValidationResult;
}
```

#### Builder Pattern
Query filters and validators use builder pattern:
```rust
FieldValidator::new("name")
    .rule(required())
    .rule(min_len(5))
    .rule(max_len(255))
```

#### Type State Pattern
Filter builders ensure compile-time safety for query construction.

### Frontend Patterns

#### Service Pattern
Services encapsulate backend communication and business logic.

#### Component Pattern
Presentational and container component separation.

#### Observable Pattern
RxJS observables for async data streams and state management.

#### Dependency Injection
Angular's DI container for service management.

## File Organization

### Naming Conventions

**Rust:**
- `snake_case` for files and modules
- `PascalCase` for types and traits
- `SCREAMING_SNAKE_CASE` for constants

**TypeScript:**
- `kebab-case.ts` for files
- `PascalCase` for classes and interfaces
- `camelCase` for variables and functions

### Module Structure

**Rust modules** use explicit module files:
```
module_name/
├── mod.rs              # Public API
├── submodule1.rs
├── submodule2.rs
└── tests/
    └── mod.rs
```

**Angular modules** use Angular conventions:
```
feature/
├── feature.component.ts
├── feature.component.html
├── feature.component.scss
└── feature.component.spec.ts
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest with `jest-preset-angular`
- **Component Tests**: Testing library patterns
- **Service Tests**: Mock Tauri IPC calls

### Backend Testing
- **Unit Tests**: Cargo test with `#[cfg(test)]`
- **Integration Tests**: Test database in `test-db/`
- **Coverage**: `cargo llvm-cov`

### E2E Testing
- **Framework**: Selenium WebDriver
- **Test Runner**: Mocha + Chai
- **Environment**: Docker container for consistency

## Configuration

### Build Configuration

**Frontend** (`angular.json`):
- Development server on port 1420
- Production builds optimized and minified
- i18n locale files in `src/locale/`

**Backend** (`Cargo.toml`):
- Static/dynamic/RLIB crate types for Tauri
- Feature flags for conditional compilation
- Workspace members for additional crates

### Environment-Specific Settings

The application adapts to:
- Development mode: Debug logging, hot reload
- Production mode: Optimized builds, error reporting

## Security Considerations

### IPC Security
- All Tauri commands are explicitly whitelisted
- Input validation on all command handlers
- No arbitrary code execution from frontend

### Database Security
- Prepared statements via Diesel (SQL injection protection)
- No direct SQL string concatenation
- Input sanitization in filter builders

### Data Validation
- Server-side validation for all mutations
- Type safety via Rust and TypeScript
- Validation errors propagated to UI

## Performance Considerations

### Frontend
- Lazy-loaded feature modules
- OnPush change detection strategy
- Virtual scrolling for large lists
- Debounced search inputs

### Backend
- Connection pooling (if applicable)
- Indexed database queries
- Efficient pagination
- Minimal data serialization

## Internationalization (i18n)

OpenXam uses Angular's built-in i18n:
- `$localize` template tag for translations
- Locale files in `src/locale/`
- Build-time translation extraction

## Build and Deployment

### Development Build
```bash
npm run tauri:dev
```

### Production Build
```bash
npm run tauri:build
```

This produces platform-specific installers:
- `.dmg` for macOS
- `.exe` / `.msi` for Windows
- `.AppImage` / `.deb` for Linux

## Further Reading

- [Development Setup](./development-setup.md)
- [Filter API Documentation](./filter-api.md)
- [Validation API Documentation](./validation-api.md)
