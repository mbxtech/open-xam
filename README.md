# OpenXam

**OpenXam** is a cross-platform desktop application for exam simulation and practice. It provides an environment to prepare for certification exams through various practice modes including timed simulations and certification-style testing.

## About This Project

This is a **learning project** designed to:
- Gain hands-on experience with **Rust** development in a real-world application
- Refresh and deepen knowledge of **Angular** (version 21) and modern frontend practices
- Explore desktop application development using the **Tauri 2** framework
- Practice clean architecture patterns and separation of concerns

The project combines a powerful Rust backend with a modern Angular frontend to create a performant, native desktop experience for exam preparation.

## Technology Stack

- **Frontend**: Angular 21 with TailwindCSS 4
- **Backend**: Rust with Tauri 2 (desktop framework)
- **Database**: SQLite via Diesel ORM
- **State Management**: @ngneat/elf

## Quickstart

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Rust** 1.81.0+ ([rustup](https://rustup.rs/))
- Platform-specific dependencies (see [Development Setup](./docs/development-setup.md#prerequisites))

### Installation

```bash
# Clone and install dependencies
git clone <repository-url> open-xam
cd open-xam
npm install

# Start development (Angular + Tauri)
npm run tauri:dev
```

### Common Commands

```bash
npm run tauri:dev       # Full-stack development mode
npm run start           # Frontend only (port 1420)
npm run test            # Run Jest unit tests
npm run lint            # ESLint check
npm run tauri:build     # Production build
```

## Documentation

For detailed documentation, see the [docs/](./docs/) directory:

- [Development Setup](./docs/development-setup.md) - Complete setup guide, testing, and troubleshooting
- [Architecture](./docs/architecture.md) - Project structure and design patterns
- [Validation API](./docs/validation-api.md) - Backend validation system
- [Filter API](./docs/filter-api.md) - Query filtering system
- [Macros](./docs/macros.md) - Rust macro documentation
- [Import Functionality](./docs/import-functionality.md) - Exam import features

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Legal Notice

**IMPORTANT: Do NOT commit real exam questions to this repository.**

This project is intended for learning and practice purposes only. Committing actual exam questions from certification providers (such as AWS, Microsoft, Cisco, CompTIA, or any other vendor) is:

- A violation of the certification provider's terms of service
- Potentially illegal under copyright law
- Grounds for disqualification from certifications
- Subject to legal action

Only use fictional, self-created practice questions or questions from legitimately licensed open-source question banks. Any pull requests containing real exam content will be rejected and reported.
