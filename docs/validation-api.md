# Validation API Documentation

## Table of Contents
- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Data Structures](#data-structures)
- [Built-in Validators](#built-in-validators)
- [Usage Guide](#usage-guide)
- [Examples](#examples)
- [Creating Custom Validators](#creating-custom-validators)
- [Best Practices](#best-practices)

## Overview

The Validation API provides a composable, type-safe validation framework for OpenXam's domain models. It allows you to define validation rules declaratively and execute them to ensure data integrity before database operations.

### Key Features

- **Type-safe**: Leverages Rust's type system for compile-time checking
- **Composable**: Build complex validation from simple rules
- **Reusable**: Validators can be shared across models
- **Testable**: Easy to unit test validation logic
- **Serializable**: Validation errors are JSON-serializable for IPC
- **Field-specific**: Errors are associated with specific fields

### Architecture

```
Domain Model
    ↓ implements Validation trait
FieldValidator(s)
    ↓ applies rules
ValidationResult
    ↓ Ok(()) or Err(Vec<ValidationError>)
Presentation Layer
    ↓ serializes errors
Frontend (JSON)
```

## Core Concepts

### Validation Trait

All domain models that require validation implement the `Validation` trait:

```rust
pub trait Validation {
    fn validate(&self) -> ValidationResult;
}
```

- **ValidationResult** is a type alias: `Result<(), Vec<ValidationError>>`
- Returns `Ok(())` if all validations pass
- Returns `Err(Vec<ValidationError>)` if any validation fails

### Field Validators

Each field in a model is validated using a `FieldValidator`:

```rust
let validator = FieldValidator::new("field_name")
    .rule(rule1)
    .rule(rule2)
    .rule(rule3);
```

- **Fluent API**: Rules are chained using `.rule()`
- **Rule**: A function that takes a value and returns `Option<String>`
  - `None` = validation passed
  - `Some(error_message)` = validation failed

### Validation Rules

A validation rule is a function:

```rust
Fn(&T) -> Option<String>
```

Where:
- `T` is the type being validated
- Returns `None` if valid
- Returns `Some(error_message)` if invalid

## Data Structures

### ValidationError

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}
```

**Constructor:**
```rust
ValidationError::new("field_name", "error message")
```

**JSON Representation:**
```json
{
  "field": "name",
  "message": "length must be at least 5"
}
```

**Display trait:**
```rust
impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.field, self.message)
    }
}
```

### ValidationResult

Type alias for validation outcome:

```rust
pub type ValidationResult = Result<(), Vec<ValidationError>>;
```

**Success:**
```rust
Ok(())
```

**Failure:**
```rust
Err(vec![
    ValidationError::new("name", "must be provided"),
    ValidationError::new("name", "length must be at least 5"),
])
```

### FieldValidator

Generic validator for a specific field:

```rust
pub struct FieldValidator<T> {
    field_name: String,
    rules: Vec<Rule<T>>,
}

type Rule<T> = Box<dyn Fn(&T) -> Option<String> + Send + Sync>;
```

**API:**
```rust
impl<T> FieldValidator<T> {
    pub fn new(field_name: impl Into<String>) -> Self;
    pub fn rule(self, f: impl Fn(&T) -> Option<String> + Send + Sync + 'static) -> Self;
    pub fn validate(&self, value: &T) -> Vec<ValidationError>;
}
```

## Built-in Validators

### String Validators

Located in `validators::str_rules`:

#### required()

Ensures the string is not empty (after trimming):

```rust
pub fn required() -> impl Fn(&String) -> Option<String>
```

**Example:**
```rust
.rule(str_rules::required())
```

**Error message:** `"must be provided"`

---

#### min_len(min: usize)

Ensures string length is at least `min`:

```rust
pub fn min_len(min: usize) -> impl Fn(&String) -> Option<String>
```

**Example:**
```rust
.rule(str_rules::min_len(5))
```

**Error message:** `"length must be at least {min}"`

---

#### max_len(max: usize)

Ensures string length is at most `max`:

```rust
pub fn max_len(max: usize) -> impl Fn(&String) -> Option<String>
```

**Example:**
```rust
.rule(str_rules::max_len(255))
```

**Error message:** `"length must be at most {max}"`

---

#### pattern(regex: Regex)

Ensures string matches a regex pattern:

```rust
pub fn pattern(regex: Regex) -> impl Fn(&String) -> Option<String>
```

**Example:**
```rust
use regex::Regex;

let email_pattern = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
.rule(str_rules::pattern(email_pattern))
```

**Error message:** `"must match pattern {pattern}"`

### Numeric Validators

Located in `validators::num_rules`:

#### min\<T\>(min: T)

Ensures numeric value is >= `min`:

```rust
pub fn min<T>(min: T) -> impl Fn(&T) -> Option<String>
where
    T: PartialOrd + std::fmt::Display + Send + Sync + 'static
```

**Example:**
```rust
.rule(num_rules::min(0))
.rule(num_rules::min(18))
```

**Error message:** `"must be >= {min}"`

---

#### max\<T\>(max: T)

Ensures numeric value is <= `max`:

```rust
pub fn max<T>(max: T) -> impl Fn(&T) -> Option<String>
where
    T: PartialOrd + std::fmt::Display + Send + Sync + 'static
```

**Example:**
```rust
.rule(num_rules::max(100))
.rule(num_rules::max(120))
```

**Error message:** `"must be <= {max}"`

### Boolean Validators

Located in `validators::bool_rules`:

#### must_be_true()

Ensures boolean is `true`:

```rust
pub fn must_be_true() -> impl Fn(&bool) -> Option<String>
```

**Example:**
```rust
.rule(bool_rules::must_be_true())
```

**Error message:** `"must be true"`

### Optional Field Validator

For validating `Option<T>`:

```rust
pub fn optional<T>(
    rule: impl Fn(&T) -> Option<String> + Send + Sync + 'static
) -> impl Fn(&Option<T>) -> Option<String> + Send + Sync + 'static
```

**Example:**
```rust
let description_validator = FieldValidator::new("description")
    .rule(optional(str_rules::max_len(255)));

validator.validate(&Some("Short text".to_string()));  // Ok
validator.validate(&None);                             // Ok (skipped)
```

## Usage Guide

### Step 1: Implement Validation Trait

```rust
use crate::domain::traits::validation::Validation;
use crate::domain::validation::field_validator::FieldValidator;
use crate::domain::validation::validation_error::ValidationError;
use crate::domain::validation::validation_result::ValidationResult;
use crate::domain::validation::validators::str_rules::{required, min_len, max_len};

impl Validation for MyModel {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        // Validate each field
        let name_validator = FieldValidator::new("name")
            .rule(required())
            .rule(min_len(3))
            .rule(max_len(100));
        validation_errors.extend(name_validator.validate(&self.name));

        // Return result
        if validation_errors.is_empty() {
            Ok(())
        } else {
            Err(validation_errors)
        }
    }
}
```

### Step 2: Call Validation in Repository

```rust
impl CRUDRepository<MyModel> for MyRepository {
    fn create(&mut self, entity: &MyModel) -> CRUDResult<MyModel> {
        // Validate before creating
        entity.validate()
            .map_err(|errors| CRUDError::new("Validation error:", Some(errors)))?;

        // Proceed with creation
        // ...
    }

    fn update(&mut self, entity: &MyModel) -> CRUDResult<MyModel> {
        // Validate before updating
        entity.validate()
            .map_err(|errors| CRUDError::new("Validation error:", Some(errors)))?;

        // Proceed with update
        // ...
    }
}
```

### Step 3: Handle Errors in Presentation Layer

```rust
#[tauri::command]
pub fn create_exam(exam: Exam) -> Result<Exam, String> {
    let mut conn = get_db_connection()?;
    let mut repo = SQLiteExamCrudRepository::new(&mut conn);

    repo.create(&exam)
        .map_err(|e| {
            // CRUDError serializes validation errors to JSON
            e.to_string()
        })
}
```

### Step 4: Display Errors in Frontend

```typescript
examService.create(exam).subscribe({
  next: (result) => {
    console.log('Created:', result);
  },
  error: (error) => {
    // error contains JSON array of ValidationError objects
    const validationErrors = JSON.parse(error);
    validationErrors.forEach((err: { field: string, message: string }) => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
});
```

## Examples

### Example 1: Simple String Validation

**Model:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: Option<i32>,
    pub name: String,
}
```

**Validation:**
```rust
impl Validation for Category {
    fn validate(&self) -> ValidationResult {
        let mut errors = vec![];

        let name_validator = FieldValidator::new("name")
            .rule(str_rules::required())
            .rule(str_rules::min_len(2))
            .rule(str_rules::max_len(50));
        errors.extend(name_validator.validate(&self.name));

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

**Test:**
```rust
#[test]
fn test_category_validation() {
    let valid = Category {
        id: None,
        name: "Programming".to_string(),
    };
    assert!(valid.validate().is_ok());

    let invalid = Category {
        id: None,
        name: "X".to_string(),  // Too short
    };
    let result = invalid.validate();
    assert!(result.is_err());
    let errors = result.unwrap_err();
    assert_eq!(errors.len(), 1);
    assert_eq!(errors[0].field, "name");
    assert!(errors[0].message.contains("at least 2"));
}
```

### Example 2: Multiple Field Validation

**Model:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Exam {
    pub id: Option<i32>,
    pub name: String,
    pub description: Option<String>,
    pub duration: Option<i32>,
}
```

**Validation:**
```rust
use crate::domain::validation::validators::{optional, str_rules, num_rules};

impl Validation for Exam {
    fn validate(&self) -> ValidationResult {
        let mut errors = vec![];

        // Validate name (required)
        let name_validator = FieldValidator::new("name")
            .rule(str_rules::required())
            .rule(str_rules::min_len(5))
            .rule(str_rules::max_len(255));
        errors.extend(name_validator.validate(&self.name));

        // Validate description (optional)
        let desc_validator = FieldValidator::new("description")
            .rule(optional(str_rules::max_len(255)));
        errors.extend(desc_validator.validate(&self.description));

        // Validate duration (optional, but must be positive)
        let duration_validator = FieldValidator::new("duration")
            .rule(optional(num_rules::min(1)))
            .rule(optional(num_rules::max(300)));
        errors.extend(duration_validator.validate(&self.duration));

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

### Example 3: Custom Validation Rule

**Scenario:** Validate an email address.

```rust
use regex::Regex;

impl Validation for User {
    fn validate(&self) -> ValidationResult {
        let mut errors = vec![];

        let email_pattern = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
        let email_validator = FieldValidator::new("email")
            .rule(str_rules::required())
            .rule(str_rules::pattern(email_pattern));
        errors.extend(email_validator.validate(&self.email));

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

### Example 4: Cross-Field Validation

**Scenario:** Validate that `end_date` is after `start_date`.

```rust
impl Validation for Event {
    fn validate(&self) -> ValidationResult {
        let mut errors = vec![];

        // Validate individual fields first
        // ...

        // Cross-field validation
        if let (Some(start), Some(end)) = (&self.start_date, &self.end_date) {
            if end <= start {
                errors.push(ValidationError::new(
                    "end_date",
                    "must be after start_date"
                ));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

### Example 5: Conditional Validation

**Scenario:** Field is required only when another field has a specific value.

```rust
impl Validation for Question {
    fn validate(&self) -> ValidationResult {
        let mut errors = vec![];

        // Always validate question text
        let text_validator = FieldValidator::new("text")
            .rule(str_rules::required())
            .rule(str_rules::min_len(10));
        errors.extend(text_validator.validate(&self.text));

        // Validate explanation only if question type is "complex"
        if self.question_type == QuestionType::Complex {
            if let Some(explanation) = &self.explanation {
                if explanation.trim().is_empty() {
                    errors.push(ValidationError::new(
                        "explanation",
                        "must be provided for complex questions"
                    ));
                }
            } else {
                errors.push(ValidationError::new(
                    "explanation",
                    "required for complex questions"
                ));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

### Example 6: Real-World Exam Validation

From `src-tauri/src/domain/model/exam.rs`:

```rust
impl Validation for Exam {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        let name_validator = FieldValidator::new("name")
            .rule(required())
            .rule(min_len(5))
            .rule(max_len(255));
        validation_errors.extend(name_validator.validate(&self.name));

        let description_validator = FieldValidator::new("description")
            .rule(optional(max_len(255)));
        validation_errors.extend(description_validator.validate(&self.description));

        if validation_errors.is_empty() {
            Ok(())
        } else {
            Err(validation_errors)
        }
    }
}
```

## Creating Custom Validators

### Custom String Validator

```rust
pub fn custom_format() -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
    |s: &String| {
        if !s.starts_with("EX-") {
            Some("must start with 'EX-'".into())
        } else {
            None
        }
    }
}

// Usage
let validator = FieldValidator::new("exam_code")
    .rule(custom_format());
```

### Custom Numeric Validator

```rust
pub fn in_range(min: i32, max: i32) -> impl Fn(&i32) -> Option<String> + Send + Sync + 'static {
    move |v: &i32| {
        if *v < min || *v > max {
            Some(format!("must be between {} and {}", min, max))
        } else {
            None
        }
    }
}

// Usage
let validator = FieldValidator::new("score")
    .rule(in_range(0, 100));
```

### Reusable Custom Validator

Create a module for domain-specific validators:

```rust
// src-tauri/src/domain/validation/custom_validators.rs

use regex::Regex;
use once_cell::sync::Lazy;

static UUID_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$").unwrap()
});

pub fn is_uuid() -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
    |s: &String| {
        if !UUID_REGEX.is_match(s) {
            Some("must be a valid UUID".into())
        } else {
            None
        }
    }
}

pub fn is_positive_integer() -> impl Fn(&i32) -> Option<String> + Send + Sync + 'static {
    |v: &i32| {
        if *v <= 0 {
            Some("must be a positive integer".into())
        } else {
            None
        }
    }
}
```

**Usage:**
```rust
use crate::domain::validation::custom_validators::{is_uuid, is_positive_integer};

let id_validator = FieldValidator::new("external_id")
    .rule(str_rules::required())
    .rule(is_uuid());

let count_validator = FieldValidator::new("count")
    .rule(is_positive_integer());
```

## Best Practices

### 1. Validate at the Domain Layer

Always implement `Validation` trait on domain models, not entities or DTOs:

**Good:**
```rust
// Domain model
impl Validation for Exam { /* ... */ }
```

**Bad:**
```rust
// Entity (database layer)
impl Validation for ExamEntity { /* ... */ }  // Don't do this
```

### 2. Validate Before Persistence

Always call `.validate()` in repository methods before database operations:

```rust
fn create(&mut self, entity: &Exam) -> CRUDResult<Exam> {
    entity.validate()
        .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

    // Proceed with insert
}
```

### 3. Collect All Errors

Don't stop at the first error. Collect all validation errors to provide comprehensive feedback:

```rust
let mut errors = vec![];
errors.extend(name_validator.validate(&self.name));
errors.extend(description_validator.validate(&self.description));
errors.extend(duration_validator.validate(&self.duration));
```

### 4. Use Descriptive Error Messages

Make error messages actionable and user-friendly:

**Good:**
```rust
Some("length must be at least 5 characters".into())
```

**Bad:**
```rust
Some("invalid".into())
```

### 5. Test Validation Logic

Write unit tests for both valid and invalid cases:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_exam() {
        let exam = Exam {
            name: "Valid Exam Name".to_string(),
            // ...
        };
        assert!(exam.validate().is_ok());
    }

    #[test]
    fn test_name_too_short() {
        let exam = Exam {
            name: "ABC".to_string(),  // Less than 5 chars
            // ...
        };
        let result = exam.validate();
        assert!(result.is_err());

        let errors = result.unwrap_err();
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].field, "name");
        assert!(errors[0].message.contains("at least 5"));
    }
}
```

### 6. Don't Duplicate Validation

If multiple models share the same validation logic, extract it into a reusable validator:

```rust
// Reusable validator module
pub mod common_validators {
    pub fn valid_name() -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
        // Common name validation logic
    }
}

// Use in multiple models
impl Validation for Exam {
    fn validate(&self) -> ValidationResult {
        let validator = FieldValidator::new("name")
            .rule(common_validators::valid_name());
        // ...
    }
}

impl Validation for Category {
    fn validate(&self) -> ValidationResult {
        let validator = FieldValidator::new("name")
            .rule(common_validators::valid_name());
        // ...
    }
}
```

### 7. Keep Validators Simple

Each validator should have a single responsibility:

**Good:**
```rust
.rule(str_rules::required())
.rule(str_rules::min_len(5))
.rule(str_rules::max_len(100))
```

**Bad:**
```rust
.rule(|s| {
    if s.is_empty() {
        Some("required".into())
    } else if s.len() < 5 {
        Some("too short".into())
    } else if s.len() > 100 {
        Some("too long".into())
    } else {
        None
    }
})
```

### 8. Document Validation Rules

Add documentation comments to your validation implementations:

```rust
impl Validation for Exam {
    /// Validates an exam:
    /// - name: required, 5-255 characters
    /// - description: optional, max 255 characters
    /// - duration: optional, 1-300 minutes
    fn validate(&self) -> ValidationResult {
        // ...
    }
}
```

## Error Handling Patterns

### Pattern 1: Early Return on Validation Failure

```rust
fn create_exam(exam: Exam) -> Result<Exam, String> {
    exam.validate().map_err(|errors| {
        serde_json::to_string(&errors).unwrap_or_else(|_| "Validation failed".to_string())
    })?;

    // Continue with creation
    Ok(exam)
}
```

### Pattern 2: Accumulate Multiple Validation Results

```rust
fn validate_batch(exams: Vec<Exam>) -> ValidationResult {
    let mut all_errors = vec![];

    for (idx, exam) in exams.iter().enumerate() {
        if let Err(mut errors) = exam.validate() {
            // Prefix field names with index
            for error in errors.iter_mut() {
                error.field = format!("exams[{}].{}", idx, error.field);
            }
            all_errors.extend(errors);
        }
    }

    if all_errors.is_empty() {
        Ok(())
    } else {
        Err(all_errors)
    }
}
```

### Pattern 3: Convert to HTTP/IPC Response

```rust
#[tauri::command]
pub fn update_exam(exam: Exam) -> Result<Exam, String> {
    let mut conn = get_connection()?;
    let mut repo = SQLiteExamCrudRepository::new(&mut conn);

    repo.update(&exam).map_err(|crud_error| {
        // CRUDError already handles ValidationError serialization
        crud_error.to_string()
    })
}
```

## Advanced Topics

### Async Validation

For validations that require I/O (e.g., checking uniqueness):

```rust
// Note: Requires async trait support
pub trait AsyncValidation {
    async fn validate_async(&self, conn: &mut SqliteConnection) -> ValidationResult;
}

impl AsyncValidation for Exam {
    async fn validate_async(&self, conn: &mut SqliteConnection) -> ValidationResult {
        let mut errors = vec![];

        // Sync validation first
        errors.extend(self.validate().err().unwrap_or_default());

        // Async validation: check name uniqueness
        if self.name_exists_in_db(conn).await {
            errors.push(ValidationError::new("name", "already exists"));
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

### Localized Error Messages

For i18n support:

```rust
pub fn required_i18n(locale: &str) -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
    let message = match locale {
        "en" => "must be provided",
        "de" => "muss angegeben werden",
        "es" => "debe proporcionarse",
        _ => "must be provided",
    };
    let msg = message.to_string();

    move |s: &String| {
        if s.trim().is_empty() {
            Some(msg.clone())
        } else {
            None
        }
    }
}
```

## Related Documentation

- [Architecture Documentation](./architecture.md)
- [Filter API Documentation](./filter-api.md)
- [Development Setup](./development-setup.md)
