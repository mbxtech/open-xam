use crate::domain::validation::validation_error::ValidationError;

#[test]
fn test_validation_error_new() {
    let err = ValidationError::new("field", "message");
    assert_eq!(err.field, "field");
    assert_eq!(err.message, "message");
}

#[test]
fn test_validation_error_clone_and_debug() {
    let err = ValidationError::new("field", "message");
    let err2 = err.clone();
    assert_eq!(err.field, err2.field);
    assert!(format!("{:?}", err).contains("ValidationError"));
}

#[test]
fn test_validation_error_serialization() {
    let err = ValidationError::new("field", "message");
    let json = serde_json::to_string(&err).unwrap();
    assert!(json.contains("\"field\":\"field\""));
    assert!(json.contains("\"message\":\"message\""));
}

#[test]
fn test_validation_error_deserialization() {
    let json = r#"{"field":"field","message":"message"}"#;
    let err: ValidationError = serde_json::from_str(json).unwrap();
    assert_eq!(err.field, "field");
    assert_eq!(err.message, "message");
}

#[test]
fn fmt_test() {
    let err = ValidationError::new("field", "message");
    assert_eq!(format!("{}", err), "field: message");
}

