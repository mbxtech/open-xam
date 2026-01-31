# Filter API Documentation

## Table of Contents
- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Data Structures](#data-structures)
- [Filter Operators](#filter-operators)
- [Building Filters](#building-filters)
- [Implementation Guide](#implementation-guide)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

The Filter API provides a flexible, type-safe way to build dynamic database queries in OpenXam. It allows frontend clients to send complex filter criteria to the backend, which are then translated into SQL WHERE clauses using Diesel ORM.

### Key Features

- **Type-safe**: Compile-time checking via Rust's type system
- **Composable**: Build complex filters from simple conditions
- **SQL Injection Safe**: Parameterized queries via Diesel
- **Frontend-friendly**: JSON-serializable structures
- **Extensible**: Easy to add new operators and field resolvers

### Architecture

```
Frontend (TypeScript)
    ↓ (JSON via Tauri IPC)
Backend (Rust)
    ↓ FilterOption
DieselFilterExprBuilder
    ↓ Diesel AST
SQLite Query
```

## Core Concepts

### Filter Trees

Filters are organized as **trees** with two types of nodes:

1. **Condition** - A single filter criterion (field, operator, value)
2. **Group** - A collection of filters joined by AND/OR

### Conjunctions

Filters can be combined using:
- **AND** - All conditions must be true
- **OR** - At least one condition must be true

### Column Resolvers

Each entity (table) has a **Column Resolver** that maps field names to Diesel column expressions. This provides type safety and prevents invalid field access.

## Data Structures

### FilterOption

The main filter type, defined as an enum:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FilterOption {
    Group {
        conjunction: ConjunctionType,
        filters: Vec<FilterOption>,
    },
    Condition {
        field: String,
        operator: Operator,
        value: FilterValue,
    },
}
```

**JSON Representation (Condition):**
```json
{
  "type": "CONDITION",
  "field": "name",
  "operator": "LIKE",
  "value": {
    "kind": "STR",
    "value": "exam"
  }
}
```

**JSON Representation (Group):**
```json
{
  "type": "GROUP",
  "conjunction": "AND",
  "filters": [
    { "type": "CONDITION", ... },
    { "type": "CONDITION", ... }
  ]
}
```

### FilterTree

A wrapper for root-level filters with optional conjunctions between them:

```rust
pub struct FilterTree {
    pub root: FilterOption,
    pub conjunction: Option<ConjunctionType>,
}
```

**Usage:** Allows multiple filter trees to be combined at the query level.

### ConjunctionType

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConjunctionType {
    And,
    Or,
}
```

### FilterValue

Represents typed values for filter conditions:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FilterValue {
    Str { value: String },
    Int { value: i64 },
    Bool { value: bool },
    StrList { values: Vec<String> },
    IntList { values: Vec<i64> },
}
```

**JSON Examples:**
```json
{ "kind": "STR", "value": "test" }
{ "kind": "INT", "value": 42 }
{ "kind": "BOOL", "value": true }
{ "kind": "STR_LIST", "values": ["a", "b", "c"] }
{ "kind": "INT_LIST", "values": [1, 2, 3] }
```

### Operator

Supported comparison operators:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Operator {
    Eq,          // Equal
    Ne,          // Not equal
    Gt,          // Greater than
    Ge,          // Greater than or equal
    Lt,          // Less than
    Le,          // Less than or equal
    In,          // In list
    Like,        // Contains (case-insensitive)
    StartsWith,  // Starts with (case-insensitive)
    EndsWith,    // Ends with (case-insensitive)
}
```

## Filter Operators

### Comparison Operators

| Operator | SQL | Value Type | Example |
|----------|-----|------------|---------|
| `Eq` | `=` | Str, Int, Bool | `WHERE name = 'test'` |
| `Ne` | `<>` | Str, Int, Bool | `WHERE id <> 5` |
| `Gt` | `>` | Int | `WHERE score > 80` |
| `Ge` | `>=` | Int | `WHERE score >= 80` |
| `Lt` | `<` | Int | `WHERE score < 50` |
| `Le` | `<=` | Int | `WHERE score <= 50` |

### List Operators

| Operator | SQL | Value Type | Example |
|----------|-----|------------|---------|
| `In` | `IN` | StrList, IntList | `WHERE id IN (1, 2, 3)` |

### String Operators

All string operators are **case-insensitive**:

| Operator | SQL | Value Type | Example |
|----------|-----|------------|---------|
| `Like` | `LOWER(field) LIKE '%value%'` | Str | Contains substring |
| `StartsWith` | `LOWER(field) LIKE 'value%'` | Str | Starts with prefix |
| `EndsWith` | `LOWER(field) LIKE '%value'` | Str | Ends with suffix |

## Building Filters

### Frontend (TypeScript)

**Simple Condition:**
```typescript
const filter: FilterOption = {
  type: 'CONDITION',
  field: 'name',
  operator: 'LIKE',
  value: {
    kind: 'STR',
    value: 'exam'
  }
};
```

**AND Group:**
```typescript
const filter: FilterOption = {
  type: 'GROUP',
  conjunction: 'AND',
  filters: [
    {
      type: 'CONDITION',
      field: 'name',
      operator: 'LIKE',
      value: { kind: 'STR', value: 'test' }
    },
    {
      type: 'CONDITION',
      field: 'status_type',
      operator: 'EQ',
      value: { kind: 'STR', value: 'ACTIVE' }
    }
  ]
};
```

**Complex Nested Filter:**
```typescript
const filter: FilterOption = {
  type: 'GROUP',
  conjunction: 'OR',
  filters: [
    {
      type: 'CONDITION',
      field: 'name',
      operator: 'LIKE',
      value: { kind: 'STR', value: 'exam' }
    },
    {
      type: 'GROUP',
      conjunction: 'AND',
      filters: [
        {
          type: 'CONDITION',
          field: 'status_type',
          operator: 'EQ',
          value: { kind: 'STR', value: 'ACTIVE' }
        },
        {
          type: 'CONDITION',
          field: 'id',
          operator: 'IN',
          value: { kind: 'INT_LIST', values: [1, 2, 3] }
        }
      ]
    }
  ]
};
```

This translates to:
```sql
WHERE name LIKE '%exam%'
   OR (status_type = 'ACTIVE' AND id IN (1, 2, 3))
```

### Backend (Rust)

**Using DieselFilterExprBuilder:**

```rust
use crate::infrastructure::filter::filter_query_builder::DieselFilterExprBuilder;
use crate::infrastructure::filter::exam_entity_column_resolver::ExamEntityColumnResolver;

// Given a FilterOption from the frontend
let filter: FilterOption = /* ... */;

// Build Diesel expression
let resolver = ExamEntityColumnResolver;
let where_clause = DieselFilterExprBuilder::build_boxed(&resolver, &filter);

// Use in query
let results = exam::table
    .filter(where_clause)
    .load::<ExamEntity>(conn)?;
```

**Using FilterTree:**

```rust
// Multiple filter trees with inter-tree conjunctions
let filter_trees: Vec<FilterTree> = vec![
    FilterTree {
        root: FilterOption::Condition { /* ... */ },
        conjunction: Some(ConjunctionType::And),
    },
    FilterTree {
        root: FilterOption::Condition { /* ... */ },
        conjunction: None,  // Last tree has no conjunction
    },
];

let resolver = ExamEntityColumnResolver;
let where_clause = DieselFilterExprBuilder::build_tree(&resolver, &filter_trees);

let results = exam::table
    .filter(where_clause)
    .load::<ExamEntity>(conn)?;
```

## Implementation Guide

### Creating a Column Resolver

To enable filtering on a new entity, implement the `FilterColumnResolver` trait:

**Step 1: Define the resolver struct**

```rust
use crate::infrastructure::filter::filter_query_builder::FilterColumnResolver;
use crate::schema::my_entity;

pub struct MyEntityColumnResolver;
```

**Step 2: Implement FilterColumnResolver**

```rust
impl FilterColumnResolver<my_entity::table> for MyEntityColumnResolver {
    fn build_condition<'a>(
        &self,
        field: &str,
        operator: &Operator,
        value: &FilterValue,
    ) -> Box<dyn BoxableExpression<my_entity::table, Sqlite, SqlType = Nullable<Bool>> + 'a> {
        use crate::schema::my_entity::dsl::*;

        match (field, operator, value) {
            // Exact match on ID
            ("id", Operator::Eq, FilterValue::Int { value: v }) => {
                Box::new(id.eq(*v as i32).nullable())
            }

            // IN clause on ID
            ("id", Operator::In, FilterValue::IntList { values }) => {
                Box::new(
                    id.eq_any(values.iter().map(|x| *x as i32).collect::<Vec<_>>())
                      .nullable()
                )
            }

            // LIKE on name
            ("name", Operator::Like, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("%{s}%")).nullable())
            }

            // StartsWith on name
            ("name", Operator::StartsWith, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("{s}%")).nullable())
            }

            // EndsWith on name
            ("name", Operator::EndsWith, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("%{s}")).nullable())
            }

            // Fallback: always true (no filter)
            _ => Box::new(dsl::sql::<Bool>("1=1").nullable()),
        }
    }
}
```

**Step 3: Use in repository**

```rust
let filter = /* FilterOption from frontend */;
let resolver = MyEntityColumnResolver;
let where_clause = DieselFilterExprBuilder::build_boxed(&resolver, &filter);

let results = my_entity::table
    .filter(where_clause)
    .load::<MyEntity>(conn)?;
```

### Example: ExamEntityColumnResolver

See `src-tauri/src/infrastructure/filter/exam_entity_column_resolver.rs`:

```rust
pub struct ExamEntityColumnResolver;

impl FilterColumnResolver<exam::table> for ExamEntityColumnResolver {
    fn build_condition<'a>(
        &self,
        field: &str,
        operator: &Operator,
        value: &FilterValue,
    ) -> Box<dyn BoxableExpression<exam::table, Sqlite, SqlType = Nullable<Bool>> + 'a> {
        use crate::schema::exam::dsl::*;

        match (field, operator, value) {
            ("id", Operator::Eq, FilterValue::Int { value: v }) => {
                Box::new(id.eq(*v as i32).nullable())
            }
            ("id", Operator::In, FilterValue::IntList { values }) => {
                Box::new(
                    id.eq_any(values.iter().map(|x| *x as i32).collect::<Vec<_>>())
                      .nullable()
                )
            }
            ("name", Operator::Like, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("%{s}%")).nullable())
            }
            ("name", Operator::StartsWith, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("{s}%")).nullable())
            }
            ("name", Operator::EndsWith, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("%{s}")).nullable())
            }
            ("description", Operator::Like, FilterValue::Str { value: s }) => {
                Box::new(description.like(format!("%{s}%")).nullable())
            }
            ("status_type", Operator::Eq, FilterValue::Str { value: s }) => {
                Box::new(status_type.nullable().eq(s.clone()))
            }
            ("name", Operator::Eq, FilterValue::Str { value: s }) => {
                Box::new(name.eq(s.clone()).nullable())
            }
            _ => Box::new(dsl::sql::<Bool>("1=1").nullable()),
        }
    }
}
```

## Examples

### Example 1: Simple String Search

**Frontend:**
```typescript
const filter = {
  type: 'CONDITION',
  field: 'name',
  operator: 'LIKE',
  value: { kind: 'STR', value: 'angular' }
};

examService.findAll({ filter }).subscribe(results => {
  console.log(results); // Exams with "angular" in the name
});
```

**SQL Generated:**
```sql
SELECT * FROM exam WHERE LOWER(name) LIKE '%angular%'
```

### Example 2: Status Filter

**Frontend:**
```typescript
const filter = {
  type: 'CONDITION',
  field: 'status_type',
  operator: 'EQ',
  value: { kind: 'STR', value: 'ACTIVE' }
};
```

**SQL Generated:**
```sql
SELECT * FROM exam WHERE status_type = 'ACTIVE'
```

### Example 3: Multiple IDs

**Frontend:**
```typescript
const filter = {
  type: 'CONDITION',
  field: 'id',
  operator: 'IN',
  value: { kind: 'INT_LIST', values: [1, 2, 3, 5, 8] }
};
```

**SQL Generated:**
```sql
SELECT * FROM exam WHERE id IN (1, 2, 3, 5, 8)
```

### Example 4: Combined AND Filters

**Frontend:**
```typescript
const filter = {
  type: 'GROUP',
  conjunction: 'AND',
  filters: [
    {
      type: 'CONDITION',
      field: 'status_type',
      operator: 'EQ',
      value: { kind: 'STR', value: 'ACTIVE' }
    },
    {
      type: 'CONDITION',
      field: 'name',
      operator: 'LIKE',
      value: { kind: 'STR', value: 'test' }
    }
  ]
};
```

**SQL Generated:**
```sql
SELECT * FROM exam
WHERE status_type = 'ACTIVE'
  AND LOWER(name) LIKE '%test%'
```

### Example 5: OR with Nested AND

**Frontend:**
```typescript
const filter = {
  type: 'GROUP',
  conjunction: 'OR',
  filters: [
    {
      type: 'CONDITION',
      field: 'status_type',
      operator: 'EQ',
      value: { kind: 'STR', value: 'DRAFT' }
    },
    {
      type: 'GROUP',
      conjunction: 'AND',
      filters: [
        {
          type: 'CONDITION',
          field: 'status_type',
          operator: 'EQ',
          value: { kind: 'STR', value: 'ACTIVE' }
        },
        {
          type: 'CONDITION',
          field: 'name',
          operator: 'STARTS_WITH',
          value: { kind: 'STR', value: 'prod' }
        }
      ]
    }
  ]
};
```

**SQL Generated:**
```sql
SELECT * FROM exam
WHERE status_type = 'DRAFT'
   OR (status_type = 'ACTIVE' AND LOWER(name) LIKE 'prod%')
```

### Example 6: Backend Repository Usage

**Location:** `src-tauri/src/infrastructure/repositories/sqlite_exam_crud_repository.rs`

```rust
use crate::infrastructure::filter::exam_entity_column_resolver::ExamEntityColumnResolver;
use crate::infrastructure::filter::filter_query_builder::DieselFilterExprBuilder;

pub fn find_by_filter(
    &mut self,
    filter: &FilterOption
) -> CRUDResult<Vec<Exam>> {
    use crate::schema::exam::dsl::*;

    // Build the where clause
    let resolver = ExamEntityColumnResolver;
    let where_clause = DieselFilterExprBuilder::build_boxed(&resolver, filter);

    // Execute query
    let results = exam
        .left_join(category)
        .filter(where_clause)
        .select((
            ExamEntity::as_select(),
            Option::<CategoryEntity>::as_select()
        ))
        .load::<(ExamEntity, Option<CategoryEntity>)>(self.conn)
        .map_err(|e| CRUDError::new(e.to_string(), None))?;

    // Map to domain models
    let exams = results
        .into_iter()
        .map(|(exam_entity, cat_entity)| {
            let mut exam = Exam::from(&exam_entity);
            if let Some(cat) = cat_entity {
                exam.category = Some(Category::from(&cat));
            }
            exam
        })
        .collect();

    Ok(exams)
}
```

## Best Practices

### 1. Always Use Column Resolvers

Never build raw SQL strings directly. Always use the `FilterColumnResolver` trait:

**Good:**
```rust
let resolver = ExamEntityColumnResolver;
let where_clause = DieselFilterExprBuilder::build_boxed(&resolver, &filter);
```

**Bad:**
```rust
// DON'T DO THIS - SQL injection risk!
let sql = format!("WHERE name = '{}'", user_input);
```

### 2. Validate Field Names

Implement all supported fields in your column resolver and return a safe fallback for unknown fields:

```rust
_ => Box::new(dsl::sql::<Bool>("1=1").nullable()),
```

This ensures invalid field names don't cause runtime errors.

### 3. Handle Optional Fields

For nullable database columns, use `.nullable()` explicitly:

```rust
("description", Operator::Like, FilterValue::Str { value: s }) => {
    Box::new(description.like(format!("%{s}%")).nullable())
}
```

### 4. Type Safety in Frontend

Define TypeScript interfaces matching the Rust structures:

```typescript
interface FilterOption {
  type: 'CONDITION' | 'GROUP';
  // ... rest of fields
}

interface FilterValue {
  kind: 'STR' | 'INT' | 'BOOL' | 'STR_LIST' | 'INT_LIST';
  value?: string | number | boolean;
  values?: string[] | number[];
}
```

### 5. Test Your Filters

Write unit tests for both simple and complex filters:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_like_filter() {
        let filter = FilterOption::Condition {
            field: "name".into(),
            operator: Operator::Like,
            value: FilterValue::Str { value: "test".into() },
        };

        let sql = FilterQueryBuilder::build_where_clause(&filter);
        assert_eq!(sql, "LOWER(name) LIKE '%test%'");
    }
}
```

### 6. Use FilterTree for Complex Queries

When you need multiple root-level filters with different conjunctions:

```rust
let trees = vec![
    FilterTree {
        root: filter1,
        conjunction: Some(ConjunctionType::And),
    },
    FilterTree {
        root: filter2,
        conjunction: None,
    },
];

let where_clause = DieselFilterExprBuilder::build_tree(&resolver, &trees);
```

### 7. Document Supported Fields

Maintain documentation of which fields support which operators for each entity:

```rust
/// Supported filters:
/// - id: Eq, In
/// - name: Eq, Like, StartsWith, EndsWith
/// - description: Like
/// - status_type: Eq
impl FilterColumnResolver<exam::table> for ExamEntityColumnResolver {
    // ...
}
```

## Advanced Topics

### Custom Operators

To add a new operator:

1. **Add to Operator enum:**
```rust
pub enum Operator {
    // ... existing
    NotLike,  // New operator
}
```

2. **Implement in FilterQueryBuilder:**
```rust
Operator::NotLike => match value {
    FilterValue::Str { value } => format!(
        "LOWER({}) NOT LIKE {}",
        field,
        Self::quote_str(&format!("%{}%", value.to_lowercase()))
    ),
    _ => panic!("NOT_LIKE requires string value"),
},
```

3. **Add to column resolvers:**
```rust
("name", Operator::NotLike, FilterValue::Str { value: s }) => {
    Box::new(name.not_like(format!("%{s}%")).nullable())
}
```

### Joined Table Filtering

For filters across joined tables, extend your column resolver:

```rust
("category.name", Operator::Like, FilterValue::Str { value: s }) => {
    Box::new(category::name.like(format!("%{s}%")).nullable())
}
```

Ensure the join is included in your query.

### Performance Optimization

- **Index filtered columns** in the database
- **Limit complexity** of nested filters (e.g., max depth)
- **Use pagination** with filters
- **Cache common filter results** if applicable

## Related Documentation

- [Architecture Documentation](./architecture.md)
- [Validation API Documentation](./validation-api.md)
- [Development Setup](./development-setup.md)
