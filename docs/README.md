# OpenXam Technical Documentation

Welcome to the OpenXam technical documentation. This documentation is designed for developers who want to understand, build, or extend the OpenXam exam simulation application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Documentation Index](#documentation-index)
3. [Quick Links](#quick-links)
4. [Contributing](#contributing)

## Getting Started

OpenXam is a cross-platform exam simulation desktop application built with:
- **Frontend**: Angular 21 + TailwindCSS 4
- **Backend**: Rust + Tauri 2
- **Database**: SQLite with Diesel ORM

### Prerequisites

Before diving into the documentation, make sure you have:
- Node.js 18+ and npm
- Rust 1.81.0+
- Platform-specific dependencies (see [Development Setup](./development-setup.md))

### First Steps

1. Read the [Architecture Documentation](./architecture.md) to understand the overall system design
2. Follow the [Development Setup](./development-setup.md) guide to get your environment ready
3. Explore the [Filter API](./filter-api.md) and [Validation API](./validation-api.md) to understand core backend features

## Documentation Index

### Core Documentation

#### [Architecture Documentation](./architecture.md)
Comprehensive overview of the OpenXam architecture, including:
- Technology stack and dependencies
- Clean Architecture implementation (4-layer design)
- Frontend and backend structure
- Data flow and communication patterns
- Design patterns and best practices
- Testing strategy

**Read this first** to understand how the application is structured.

---

#### [Development Setup](./development-setup.md)
Complete guide to setting up your development environment:
- Prerequisites and platform-specific dependencies
- Installation instructions
- Project structure overview
- Development workflow (frontend and backend)
- Database migrations with Diesel
- Testing (unit, integration, E2E)
- Building and debugging
- Troubleshooting common issues

**Essential reading** before starting development.

---

### API Documentation

#### [Filter API Documentation](./filter-api.md)
In-depth guide to the dynamic query filter system:
- Core concepts (filter trees, conjunctions, resolvers)
- Data structures (FilterOption, FilterValue, Operator)
- Supported operators (comparison, list, string)
- Building filters (frontend and backend)
- Creating custom column resolvers
- Real-world examples
- Best practices and performance tips

**Use this** when implementing search, filtering, or dynamic queries.

---

#### [Validation API Documentation](./validation-api.md)
Complete reference for the validation framework:
- Core concepts (Validation trait, FieldValidator, rules)
- Data structures (ValidationError, ValidationResult)
- Built-in validators (string, numeric, boolean, optional)
- Usage guide (implementing validation on models)
- Creating custom validators
- Error handling patterns
- Testing validation logic
- Advanced topics (async validation, i18n)

**Use this** when adding or modifying domain models.

---

#### [Macro Documentation](./macros.md)
Comprehensive guide to OpenXam's code generation macros:
- `pagination_repository_impl!` macro (declarative macro)
  - Generate pagination and filtering repository functions
  - Support for basic queries, left joins, and inner joins
  - Automatic page calculation and sorting
- `FieldNames` derive macro (procedural macro)
  - Compile-time field introspection
  - Query field names and types without runtime reflection
  - Validate user input against struct fields
- Real-world examples and usage patterns
- Best practices for macro usage

**Use this** when creating repositories with pagination or when you need struct field introspection.

---

## Quick Links

### Common Tasks

| Task                              | Documentation                                                   |
|-----------------------------------|-----------------------------------------------------------------|
| Setup development environment     | [Development Setup](./development-setup.md)                     |
| Understand project structure      | [Architecture](./architecture.md#architecture-layers)           |
| Add a new entity with filtering   | [Filter API](./filter-api.md#implementation-guide)              |
| Add validation to a model         | [Validation API](./validation-api.md#usage-guide)               |
| Create paginated repository       | [Macros](./macros.md#pagination_repository_impl)                |
| Add field introspection to struct | [Macros](./macros.md#fieldnames-derive-macro)                   |
| Import Exams                      | [Import](./import-functionality.md)                             |
| Run tests                         | [Development Setup](./development-setup.md#testing)             |
| Build for production              | [Development Setup](./development-setup.md#production-build)    |
| Create database migration         | [Development Setup](./development-setup.md#database-migrations) |
| Troubleshoot build issues         | [Development Setup](./development-setup.md#troubleshooting)     |

### Reference

| Topic | Location |
|-------|----------|
| Technology stack | [Architecture](./architecture.md#technology-stack) |
| Directory structure | [Architecture](./architecture.md#frontend-architecture) |
| Filter operators | [Filter API](./filter-api.md#filter-operators) |
| Built-in validators | [Validation API](./validation-api.md#built-in-validators) |
| Pagination macro variants | [Macros](./macros.md#pagination_repository_impl) |
| FieldNames generated methods | [Macros](./macros.md#generated-methods) |
| Design patterns | [Architecture](./architecture.md#design-patterns) |
| Testing strategy | [Architecture](./architecture.md#testing-strategy) |

## Project Structure Overview

```
open-xam/
├── docs/                     # This documentation
│   ├── README.md             # This file
│   ├── architecture.md       # System architecture
│   ├── development-setup.md  # Setup guide
│   ├── filter-api.md         # Filter API reference
│   ├── validation-api.md     # Validation API reference
│   └── macros.md             # Macro documentation
├── src/                      # Angular frontend
│   ├── app/
│   │   ├── features/         # Feature modules
│   │   └── shared/           # Shared code
│   └── locale/               # i18n files
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── presentation/     # Tauri IPC handlers
│   │   ├── application/      # Business logic
│   │   ├── domain/           # Domain models
│   │   └── infrastructure/   # Data access & macros
│   └── migrations/           # Database migrations
├── field_names/              # FieldNames proc macro crate
│   ├── src/lib.rs            # Macro implementation
│   └── tests/                # Macro tests
├── e2e/                      # End-to-end tests
└── README.md                 # Project README
```

## Contributing

### Before You Start

1. Familiarize yourself with the [Architecture](./architecture.md)
2. Set up your environment using [Development Setup](./development-setup.md)

### Development Workflow

1. **Plan**: Understand the feature requirements
2. **Design**: Consider how it fits into Clean Architecture
3. **Implement**:
   - Backend: Domain model → Repository → Use case → Handler
   - Frontend: Service → Component → Template
4. **Validate**: Add validation rules if needed
5. **Test**: Write unit tests
6. **Document**: Update relevant documentation

### Code Standards

**Frontend (TypeScript):**
- Use `ox-` prefix for custom components
- Follow Angular style guide
- ESLint for code quality: `npm run lint`

**Backend (Rust):**
- Follow Clean Architecture layers
- Use traits for abstractions
- Clippy for linting: `cargo clippy`
- Format code: `cargo fmt`

### Testing Requirements

- **Unit tests**: For all business logic
- **Integration tests**: For repository operations
- **Component tests**: For Angular components
- **E2E tests**: For critical user flows

Run all tests before submitting:
```bash
# Frontend
npm run test

# Backend
cd src-tauri && cargo test

# E2E
npm run test:e2e:docker
```

## Architecture at a Glance

### Backend Layers (Clean Architecture)

```
┌─────────────────────────────────┐
│      Presentation Layer          │  Tauri IPC Handlers
├─────────────────────────────────┤
│      Application Layer           │  Use Cases, CRUD
├─────────────────────────────────┤
│        Domain Layer              │  Models, Validation, Traits
├─────────────────────────────────┤
│     Infrastructure Layer         │  Repositories, DB, Filters
└─────────────────────────────────┘
```

### Frontend Structure

```
┌─────────────────────────────────┐
│         Components               │  UI Presentation
├─────────────────────────────────┤
│          Services                │  Business Logic, IPC
├─────────────────────────────────┤
│       State (Elf Stores)         │  Application State
├─────────────────────────────────┤
│        Models/Interfaces         │  TypeScript Types
└─────────────────────────────────┘
```

### Communication Flow

```
Angular Component
    ↓ calls
Service (extends BaseService)
    ↓ invoke$()
Tauri IPC
    ↓ #[tauri::command]
Presentation Handler
    ↓ calls
Application Use Case
    ↓ uses
Repository (trait)
    ↓ queries
SQLite Database
```

## Key Concepts

### Clean Architecture
- **Dependency Rule**: Dependencies point inward (toward domain)
- **Separation of Concerns**: Each layer has specific responsibilities
- **Testability**: Easy to test business logic in isolation

### Type Safety
- **Rust**: Compile-time type checking, no null pointer exceptions
- **TypeScript**: Static typing for JavaScript
- **Diesel ORM**: Type-safe database queries

### Validation
- **Domain-driven**: Validation rules live with domain models
- **Composable**: Build complex validation from simple rules
- **Explicit errors**: Detailed, field-specific error messages

### Filtering
- **Dynamic**: Build queries from user input
- **Type-safe**: Compile-time checking via column resolvers
- **SQL Injection Safe**: Parameterized queries via Diesel

## Development Tips

### Faster Iteration

**Frontend only:**
```bash
npm run start  # Angular dev server (no Tauri)
```

**Full stack:**
```bash
npm run tauri:dev  # Angular + Rust + Tauri window
```

### Debugging

**Frontend:**
- Open DevTools in Tauri window: `Cmd+Shift+I` (macOS) / `Ctrl+Shift+I` (Windows/Linux)
- Console logs appear in DevTools

**Backend:**
- Use `log::info!()`, `log::debug!()` macros
- Logs appear in terminal during `npm run tauri:dev`

### Database Inspection

```bash
# Find database location (from tauri.conf.json)
# macOS example:
sqlite3 ~/Library/Application\ Support/com.openxam.dev/app.db

# Query
.tables
SELECT * FROM exam;
```

## Resources

### External Documentation

- [Angular Documentation](https://angular.io/)
- [Tauri Documentation](https://tauri.app/)
- [Diesel Documentation](https://diesel.rs/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [RxJS Documentation](https://rxjs.dev/)

### OpenXam Documentation

- Start here: [Architecture](./architecture.md)
- Setup: [Development Setup](./development-setup.md)
- APIs: [Filter API](./filter-api.md) | [Validation API](./validation-api.md) | [Macros](./macros.md)

## Support

### Troubleshooting

If you encounter issues:

1. Check [Development Setup - Troubleshooting](./development-setup.md#troubleshooting)
2. Review relevant API documentation
3. Search existing GitHub issues (if applicable)
4. Check error logs (browser console, Rust terminal output)

### Getting Help

- **Build issues**: See [Development Setup](./development-setup.md#troubleshooting)
- **Architecture questions**: Refer to [Architecture](./architecture.md)
- **API usage**: Check [Filter API](./filter-api.md), [Validation API](./validation-api.md), or [Macros](./macros.md)
- **Macro usage**: See [Macros](./macros.md) for pagination and field introspection

## License

[Include license information here if applicable]

---

**Happy coding!** 🚀

For questions or suggestions about this documentation, please open an issue or submit a pull request.
