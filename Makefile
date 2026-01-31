.PHONY: setup test test-coverage clean help

# Default target
help:
	@echo "Available targets:"
	@echo "  setup          - Install all dependencies and create empty SQLite DB"
	@echo "  test           - Run all unit tests (frontend and backend)"
	@echo "  test-coverage  - Run tests with coverage report"
	@echo "  clean          - Remove build artifacts and temporary directories"

# Install all dependencies and create empty SQLite DB
setup:
	@echo "Installing npm dependencies..."
	npm install
	@echo "Building Rust dependencies..."
	cd src-tauri && cargo build
	@echo "Setting up database..."
	cd src-tauri && diesel database setup
	@echo "Running database migrations..."
	cd src-tauri && diesel migration run
	@echo "Setup complete!"

# Run all unit tests (frontend and backend)
test:
	@echo "Running frontend tests..."
	npm run test -- --run
	@echo "Running backend tests..."
	cd src-tauri && cargo test
	@echo "All tests complete!"

# Run tests with coverage report
test-coverage:
	@echo "Running frontend tests with coverage..."
	npm run test -- --coverage
	@echo "Running backend tests with coverage..."
	cd src-tauri && cargo llvm-cov --html
	@echo "Coverage reports generated!"
	@echo "Frontend coverage: coverage/"
	@echo "Backend coverage: src-tauri/target/llvm-cov/html/"

# Remove build artifacts and temporary directories
clean:
	@echo "Cleaning build artifacts..."
	rm -rf target
	rm -rf dist
	rm -rf coverage
	rm -rf test-db
	rm -rf .angular
	rm -rf src-tauri/target
	@echo "Clean complete!"
