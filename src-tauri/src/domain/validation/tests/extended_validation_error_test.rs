use crate::domain::validation::extended_validation_error::ExtendedValidationError;
use crate::domain::validation::validation_error::ValidationError;

#[test]
fn test_extended_validation_error_new() {
    let errs = vec![ValidationError::new("f", "m")];
    let ext_err = ExtendedValidationError::new(1, "msg", errs.clone(), vec![]);
    assert_eq!(ext_err.index, 1);
    assert_eq!(ext_err.message, "msg");
    assert_eq!(ext_err.errors, errs);
    assert!(ext_err.nested_errors.is_empty());
}

#[test]
fn test_extended_validation_error_serialization() {
    let errs = vec![ValidationError::new("f", "m")];
    let ext_err = ExtendedValidationError::new(1, "msg", errs, vec![]);
    let json = serde_json::to_string(&ext_err).unwrap();
    assert!(json.contains("\"message\":\"msg\""));
    assert!(json.contains("\"errors\""));
    assert!(json.contains("\"index\":1"));
}

#[test]
fn test_extended_validation_error_debug_and_clone() {
    let errs = vec![ValidationError::new("f", "m")];
    let ext_err = ExtendedValidationError::new(1, "msg", errs, vec![]);
    let ext_err2 = ext_err.clone();
    assert_eq!(ext_err.message, ext_err2.message);
    assert_eq!(ext_err, ext_err2);
    assert!(format!("{:?}", ext_err).contains("ExtendedValidationError"));
}
