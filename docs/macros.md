# Macro Documentation

## Table of Contents
- [Overview](#overview)
- [pagination_repository_impl!](#pagination_repository_impl)
- [FieldNames Derive Macro](#fieldnames-derive-macro)
- [Best Practices](#best-practices)

## Overview

OpenXam provides two powerful macros to reduce boilerplate and increase productivity:

1. **`pagination_repository_impl!`** - A declarative macro for generating pagination and filtering repository functions
2. **`FieldNames`** - A procedural derive macro for compile-time field introspection

These macros follow Rust best practices and leverage the type system for compile-time safety.

---

## pagination_repository_impl!

### Purpose

The `pagination_repository_impl!` macro generates boilerplate repository functions for paginated queries with optional filtering. It supports three variants:
- **Basic** - Single table queries
- **Left Join** - Optional relationships (1-to-0..1)
- **Inner Join** - Required relationships (1-to-1)

### Location

`src-tauri/src/infrastructure/macros/pagination_repository_impl.rs`

### Syntax

#### Variant 1: Basic (No Join)

```rust
pagination_repository_impl!(table_name, EntityType, schema::path::to::table);
```

**Parameters:**
- `table_name` - Diesel table identifier (e.g., `exam`, `category`)
- `EntityType` - Diesel entity struct (e.g., `ExamEntity`, `CategoryEntity`)
- `schema::path::to::table` - Full path to the Diesel table schema

**Generated Functions:**
- `find_all(conn, page_options)` - Fetch all records with pagination
- `find_filtered(conn, filter, page_options)` - Fetch filtered records with pagination

---

#### Variant 2: Left Join

```rust
pagination_repository_impl!(
    table_name,
    EntityType,
    schema::path::to::table,
    left_join: joined_table,
    JoinedEntityType
);
```

**Parameters:**
- Same as basic variant, plus:
- `joined_table` - Table to left join (e.g., `category`)
- `JoinedEntityType` - Entity type of joined table (e.g., `CategoryEntity`)

**Generated Functions:**
- `find_all(conn, page_options)` - Fetch without join (backward compatible)
- `find_filtered(conn, filter, page_options)` - Fetch with filter, no join
- `find_all_with_join(conn, page_options)` - Fetch with left join
- `find_filtered_with_join(conn, filter, page_options)` - Fetch with filter and left join

**Return Types:**
- Without join: `PagedResult<EntityType>`
- With join: `PagedResult<(EntityType, Option<JoinedEntityType>)>`

---

#### Variant 3: Inner Join

```rust
pagination_repository_impl!(
    table_name,
    EntityType,
    schema::path::to::table,
    inner_join: joined_table,
    JoinedEntityType
);
```

**Parameters:**
- Same as left join variant

**Generated Functions:**
- `find_all(conn, page_options)` - Fetch without join (backward compatible)
- `find_filtered(conn, filter, page_options)` - Fetch with filter, no join
- `find_all_with_join(conn, page_options)` - Fetch with inner join
- `find_filtered_with_join(conn, filter, page_options)` - Fetch with filter and inner join

**Return Types:**
- Without join: `PagedResult<EntityType>`
- With join: `PagedResult<(EntityType, JoinedEntityType)>` (no Option, always present)

---

### Examples

#### Example 1: Basic Usage (No Join)

```rust
// Generate pagination functions for the category table
pagination_repository_impl!(category, CategoryEntity, crate::schema::category::table);

// Use in repository
pub fn get_categories_paginated(
    conn: &mut SqliteConnection,
    page: i64,
) -> CRUDResult<PagedResult<CategoryEntity>> {
    let page_options = PageOptions {
        page,
        elements_per_page: 20,
    };

    category::find_all(conn, Some(page_options))
}

// Without pagination (all results)
pub fn get_all_categories(
    conn: &mut SqliteConnection,
) -> CRUDResult<PagedResult<CategoryEntity>> {
    category::find_all(conn, None)
}
```

**Generated SQL:**
```sql
-- With pagination
SELECT * FROM category ORDER BY id DESC LIMIT 20 OFFSET 0;

-- Count total
SELECT COUNT(id) FROM category;
```

---

#### Example 2: With Filtering

```rust
pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

pub fn find_exams_by_name(
    conn: &mut SqliteConnection,
    search_term: &str,
    page_options: Option<PageOptions>,
) -> CRUDResult<PagedResult<ExamEntity>> {
    use crate::schema::exam::dsl::*;

    // Build filter expression
    let filter = Box::new(name.like(format!("%{}%", search_term)).nullable());

    exam::find_filtered(conn, filter, page_options)
}
```

**Generated SQL:**
```sql
SELECT * FROM exam
WHERE name LIKE '%search%'
ORDER BY id DESC
LIMIT 20 OFFSET 0;
```

---

#### Example 3: Left Join (Optional Relationship)

```rust
// Exam can optionally have a category
pagination_repository_impl!(
    exam,
    ExamEntity,
    crate::schema::exam::table,
    left_join: category,
    CategoryEntity
);

pub fn find_exams_with_categories(
    conn: &mut SqliteConnection,
    page_options: Option<PageOptions>,
) -> CRUDResult<PagedResult<(ExamEntity, Option<CategoryEntity>)>> {
    exam::find_all_with_join(conn, page_options)
}
```

**Generated SQL:**
```sql
SELECT exam.*, category.*
FROM exam
LEFT JOIN category ON exam.fk_category_id = category.id
ORDER BY exam.id DESC;
```

**Usage:**
```rust
let result = find_exams_with_categories(&mut conn, None)?;

for (exam, maybe_category) in result.data {
    println!("Exam: {}", exam.name);

    if let Some(category) = maybe_category {
        println!("  Category: {}", category.name);
    } else {
        println!("  Category: None");
    }
}
```

---

#### Example 4: Left Join with Filtering

```rust
pagination_repository_impl!(
    exam,
    ExamEntity,
    crate::schema::exam::table,
    left_join: category,
    CategoryEntity
);

pub fn find_exams_by_category_name(
    conn: &mut SqliteConnection,
    category_name: &str,
) -> CRUDResult<PagedResult<(ExamEntity, Option<CategoryEntity>)>> {
    use crate::schema::category::dsl::name as category_name_col;

    // Filter type must match joined table structure
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::LeftJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(category_name_col.eq(category_name).nullable());

    exam::find_filtered_with_join(conn, filter, None)
}
```

---

#### Example 5: Inner Join (Required Relationship)

```rust
// Only return exams that HAVE a category
pagination_repository_impl!(
    exam,
    ExamEntity,
    crate::schema::exam::table,
    inner_join: category,
    CategoryEntity
);

pub fn find_categorized_exams(
    conn: &mut SqliteConnection,
) -> CRUDResult<PagedResult<(ExamEntity, CategoryEntity)>> {
    exam::find_all_with_join(conn, None)
}
```

**Generated SQL:**
```sql
SELECT exam.*, category.*
FROM exam
INNER JOIN category ON exam.fk_category_id = category.id
ORDER BY exam.id DESC;
```

**Note:** Inner join excludes exams without a category. Result always has both entities (no `Option`).

---

### PagedResult Structure

All pagination functions return a `PagedResult<T>`:

```rust
pub struct PagedResult<T> {
    pub data: Vec<T>,
    pub total_elements: i64,
    pub current_page: i64,
    pub total_pages: i64,
}
```

**Example:**
```json
{
  "data": [...],
  "totalElements": 45,
  "currentPage": 2,
  "totalPages": 5
}
```

### PageOptions Structure

Control pagination behavior with `PageOptions`:

```rust
pub struct PageOptions {
    pub page: i64,              // 1-based page number
    pub elements_per_page: i64, // Number of items per page
}
```

**Example:**
```rust
let page_options = PageOptions {
    page: 1,
    elements_per_page: 20,
};
```

### Pagination Calculation

The macro automatically handles:
- **Offset calculation**: `(page - 1) * elements_per_page`
- **Total pages**: `ceil(total_elements / elements_per_page)`
- **Sorting**: Results ordered by `id DESC` (newest first)

### Generated Module

The macro creates a module with the table name:

```rust
pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

// Creates module: exam
// Access functions as: exam::find_all, exam::find_filtered, etc.
```

### Real-World Usage

**In `sqlite_exam_crud_repository.rs`:**

```rust
use crate::infrastructure::macros::pagination_repository_impl;

pagination_repository_impl!(
    exam,
    ExamEntity,
    crate::schema::exam::table,
    left_join: category,
    CategoryEntity
);

impl ExamRepository for SQLiteExamCrudRepository<'_> {
    fn find_all_paginated(
        &mut self,
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Exam>> {
        let paged_entities = exam::find_all(self.conn, page_options)?;

        // Map entities to domain models
        let exams = paged_entities.data
            .iter()
            .map(Exam::from)
            .collect();

        Ok(PagedResult::new(
            exams,
            paged_entities.total_elements,
            paged_entities.current_page,
            paged_entities.total_pages,
        ))
    }

    fn find_all_with_categories(
        &mut self,
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Exam>> {
        let results = exam::find_all_with_join(self.conn, page_options)?;

        let exams = results.data
            .into_iter()
            .map(|(exam_entity, category_entity)| {
                let mut exam = Exam::from(&exam_entity);
                if let Some(cat_entity) = category_entity {
                    exam.category = Some(Category::from(&cat_entity));
                }
                exam
            })
            .collect();

        Ok(PagedResult::new(
            exams,
            results.total_elements,
            results.current_page,
            results.total_pages,
        ))
    }
}
```

---

## FieldNames Derive Macro

### Purpose

The `FieldNames` procedural macro provides **compile-time field introspection** for structs. It generates methods to query field names and types without runtime reflection.

### Location

`field_names/src/lib.rs` (separate crate)

### Syntax

```rust
use field_names::FieldNames;

#[derive(FieldNames)]
struct MyStruct {
    field1: Type1,
    field2: Type2,
}
```

### Generated Methods

#### field_names() -> &'static [&'static str]

Returns an array of field names as string slices.

```rust
let names = MyStruct::field_names();
// ["field1", "field2"]
```

---

#### field_count() -> usize

Returns the number of fields in the struct.

```rust
let count = MyStruct::field_count();
// 2
```

---

#### has_field(name: &str) -> bool

Checks if a field with the given name exists.

```rust
let exists = MyStruct::has_field("field1");
// true

let exists = MyStruct::has_field("nonexistent");
// false
```

---

#### field_types() -> &'static [&'static str]

Returns an array of field type names as strings.

```rust
let types = MyStruct::field_types();
// ["Type1", "Type2"]
```

---

#### fields_with_types() -> Vec<(&'static str, &'static str)>

Returns a vector of (field_name, field_type) tuples.

```rust
let fields = MyStruct::fields_with_types();
// [("field1", "Type1"), ("field2", "Type2")]
```

---

### Examples

#### Example 1: Basic Usage

```rust
use field_names::FieldNames;

#[derive(FieldNames)]
struct User {
    id: i32,
    username: String,
    email: String,
}

// Query field names
assert_eq!(User::field_names(), &["id", "username", "email"]);

// Count fields
assert_eq!(User::field_count(), 3);

// Check field existence
assert!(User::has_field("username"));
assert!(!User::has_field("password"));

// Get types
assert_eq!(User::field_types(), &["i32", "String", "String"]);

// Get name-type pairs
let fields = User::fields_with_types();
assert_eq!(fields[0], ("id", "i32"));
assert_eq!(fields[1], ("username", "String"));
```

---

#### Example 2: Validation Field Discovery

```rust
use field_names::FieldNames;

#[derive(FieldNames)]
struct Exam {
    id: Option<i32>,
    name: String,
    description: Option<String>,
    duration: Option<i32>,
}

// Dynamically validate field names from user input
fn validate_sort_field(field_name: &str) -> Result<(), String> {
    if Exam::has_field(field_name) {
        Ok(())
    } else {
        Err(format!(
            "Invalid field '{}'. Valid fields: {:?}",
            field_name,
            Exam::field_names()
        ))
    }
}

// Usage
validate_sort_field("name")?;       // Ok
validate_sort_field("invalid")?;    // Err
```

---

#### Example 3: Dynamic Query Building

```rust
use field_names::FieldNames;

#[derive(FieldNames)]
struct Category {
    id: i32,
    name: String,
}

fn build_select_query() -> String {
    let fields = Category::field_names().join(", ");
    format!("SELECT {} FROM category", fields)
}

// Generated SQL: "SELECT id, name FROM category"
```

---

#### Example 4: API Field Whitelisting

```rust
use field_names::FieldNames;
use serde::Serialize;

#[derive(FieldNames, Serialize)]
struct User {
    id: i32,
    username: String,
    email: String,
    password_hash: String,
}

// Allow only specific fields in API responses
fn is_public_field(field: &str) -> bool {
    let public_fields = ["id", "username", "email"];
    public_fields.contains(&field)
}

fn get_public_fields() -> Vec<&'static str> {
    User::field_names()
        .iter()
        .filter(|&&name| is_public_field(name))
        .copied()
        .collect()
}

// ["id", "username", "email"] - password_hash excluded
```

---

#### Example 5: Debug and Logging

```rust
use field_names::FieldNames;

#[derive(FieldNames)]
struct Exam {
    id: Option<i32>,
    name: String,
    description: Option<String>,
}

fn log_struct_info<T: FieldNames>() {
    println!("Struct has {} fields:", T::field_count());
    for (name, ty) in T::fields_with_types() {
        println!("  - {}: {}", name, ty);
    }
}

// Output:
// Struct has 3 fields:
//   - id: Option < i32 >
//   - name: String
//   - description: Option < String >
```

---

#### Example 6: Type Introspection

```rust
use field_names::FieldNames;

#[derive(FieldNames)]
struct Order {
    id: i32,
    status: String,
    amount: f64,
    created_at: chrono::NaiveDateTime,
}

fn find_numeric_fields() -> Vec<&'static str> {
    Order::fields_with_types()
        .into_iter()
        .filter(|(_, ty)| ty.contains("i32") || ty.contains("f64"))
        .map(|(name, _)| name)
        .collect()
}

// ["id", "amount"]
```

---

### Real-World Usage in OpenXam

**In `exam_entity.rs`:**

```rust
use field_names::FieldNames;
use diesel::prelude::*;

#[derive(
    Debug,
    Clone,
    Queryable,
    Selectable,
    Identifiable,
    Associations,
    FieldNames,  // <-- Derive FieldNames
)]
#[diesel(table_name = exam)]
pub struct ExamEntity {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub fk_category_id: Option<i32>,
    pub duration: Option<i32>,
    pub points_to_succeeded: Option<i32>,
    pub status_type: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub max_questions_real_exam: Option<i32>,
}

// Now you can:
// - ExamEntity::field_names()
// - ExamEntity::has_field("name")
// - ExamEntity::field_count()
```

**Potential use cases:**
```rust
// Validate filter field names
pub fn validate_filter_field(field: &str) -> Result<(), String> {
    if ExamEntity::has_field(field) {
        Ok(())
    } else {
        Err(format!("Unknown field: {}", field))
    }
}

// Generate SQL dynamically
pub fn build_select() -> String {
    let fields = ExamEntity::field_names().join(", ");
    format!("SELECT {} FROM exam", fields)
}

// Debug logging
println!("ExamEntity has {} fields", ExamEntity::field_count());
```

---

### Limitations

#### Named Fields Only

The macro only works with structs that have **named fields**:

**Supported:**
```rust
#[derive(FieldNames)]
struct User {
    id: i32,
    name: String,
}
```

**Not Supported:**
```rust
#[derive(FieldNames)]
struct Tuple(i32, String);  // Unnamed fields

#[derive(FieldNames)]
struct Unit;  // Unit struct
```

For unsupported types, the macro returns empty arrays.

---

#### Type Names as Strings

Field types are returned as **formatted strings**, not actual types:

```rust
#[derive(FieldNames)]
struct Example {
    count: Vec<String>,
    data: Option<i32>,
}

// field_types() returns:
// ["Vec < String >", "Option < i32 >"]
```

These are string representations for logging/debugging, not usable for type-level operations.

---

### Performance

Both generated methods are **zero-cost**:
- `field_names()` and `field_types()` return static arrays (no allocation)
- All information is computed at compile time
- No runtime overhead

---

## Best Practices

### For pagination_repository_impl!

#### 1. Use Appropriate Join Type

```rust
// Use left_join for optional relationships
pagination_repository_impl!(
    exam, ExamEntity, crate::schema::exam::table,
    left_join: category, CategoryEntity  // Exam may have no category
);

// Use inner_join for required relationships
pagination_repository_impl!(
    exam_result, ExamResultEntity, crate::schema::exam_result::table,
    inner_join: exam, ExamEntity  // ExamResult must have an exam
);
```

---

#### 2. Map Entities to Domain Models

Don't expose entities directly to the presentation layer:

```rust
// Good: Map to domain model
pub fn find_exams(&mut self, page: i64) -> CRUDResult<PagedResult<Exam>> {
    let paged_entities = exam::find_all(self.conn, Some(page_options))?;

    let exams = paged_entities.data
        .iter()
        .map(Exam::from)
        .collect();

    Ok(PagedResult::new(exams, ...))
}

// Bad: Return entities directly
pub fn find_exams(&mut self, page: i64) -> PagedResult<ExamEntity> {
    exam::find_all(self.conn, Some(page_options))
}
```

---

#### 3. Use Module Namespacing

The macro creates a module, so use it for organization:

```rust
// In repository file
pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);
pagination_repository_impl!(category, CategoryEntity, crate::schema::category::table);

// Use with namespace
exam::find_all(conn, options);
category::find_all(conn, options);
```

---

#### 4. Combine with Filter API

```rust
use crate::infrastructure::filter::filter_query_builder::DieselFilterExprBuilder;
use crate::infrastructure::filter::exam_entity_column_resolver::ExamEntityColumnResolver;

pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

pub fn find_with_filter(
    &mut self,
    filter_option: &FilterOption,
    page_options: Option<PageOptions>,
) -> CRUDResult<PagedResult<Exam>> {
    let resolver = ExamEntityColumnResolver;
    let where_clause = DieselFilterExprBuilder::build_boxed(&resolver, filter_option);

    let paged = exam::find_filtered(self.conn, where_clause, page_options)?;
    // Map and return...
}
```

---

### For FieldNames

#### 1. Validate User Input

Use `has_field()` to validate field names from API requests:

```rust
pub fn validate_sort_field(field: &str) -> Result<(), String> {
    if !ExamEntity::has_field(field) {
        return Err(format!(
            "Invalid sort field. Valid options: {:?}",
            ExamEntity::field_names()
        ));
    }
    Ok(())
}
```

---

#### 2. Generate Dynamic Queries Safely

```rust
// Whitelist fields before using in queries
fn build_projection(requested_fields: &[&str]) -> String {
    let valid_fields: Vec<&str> = requested_fields
        .iter()
        .filter(|&&f| ExamEntity::has_field(f))
        .copied()
        .collect();

    valid_fields.join(", ")
}
```

---

#### 3. Debug and Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exam_entity_structure() {
        // Ensure entity has expected fields
        assert!(ExamEntity::has_field("id"));
        assert!(ExamEntity::has_field("name"));
        assert_eq!(ExamEntity::field_count(), 10);
    }
}
```

---

## Related Documentation

- [Architecture Documentation](./architecture.md)
- [Filter API Documentation](./filter-api.md)
- [Validation API Documentation](./validation-api.md)
- [Development Setup](./development-setup.md)
