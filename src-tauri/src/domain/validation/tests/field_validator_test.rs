use crate::domain::validation::field_validator::FieldValidator;

#[test]
fn test_new_validator() {
    let validator = FieldValidator::<String>::new("test_field");
    assert!(validator.validate(&"".to_string()).is_empty());
}

#[test]
fn test_single_rule() {
    let validator = FieldValidator::new("test_field").rule(|s: &String| {
        if s.is_empty() {
            Some("Field cannot be empty".to_string())
        } else {
            None
        }
    });

    let errors = validator.validate(&"".to_string());
    assert_eq!(errors.len(), 1);
    assert_eq!(errors[0].field, "test_field");
    assert_eq!(errors[0].message, "Field cannot be empty");

    assert!(validator.validate(&"not empty".to_string()).is_empty());
}

#[test]
fn test_multiple_rules() {
    let validator = FieldValidator::new("test_field")
        .rule(|s: &String| {
            if s.is_empty() {
                Some("Field cannot be empty".to_string())
            } else {
                None
            }
        })
        .rule(|s: &String| {
            if s.len() < 3 {
                Some("Must be at least 3 characters".to_string())
            } else {
                None
            }
        });

    let errors = validator.validate(&"".to_string());
    assert_eq!(errors.len(), 2);

    let errors = validator.validate(&"ab".to_string());
    assert_eq!(errors.len(), 1);
    assert_eq!(errors[0].message, "Must be at least 3 characters");

    assert!(validator.validate(&"valid".to_string()).is_empty());
}

#[test]
fn test_no_rules() {
    let validator = FieldValidator::<String>::new("test_field");
    assert!(validator.validate(&"any value".to_string()).is_empty());
}

#[test]
fn test_different_types() {
    let validator = FieldValidator::new("age")
        .rule(|age: &i32| {
            if *age < 0 {
                Some("Age cannot be negative".to_string())
            } else {
                None
            }
        })
        .rule(|age: &i32| {
            if *age > 150 {
                Some("Age seems unrealistic".to_string())
            } else {
                None
            }
        });

    assert!(validator.validate(&25).is_empty());
    assert_eq!(validator.validate(&-1).len(), 1);
    assert_eq!(validator.validate(&200).len(), 1);
}
