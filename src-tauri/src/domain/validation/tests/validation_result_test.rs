use crate::domain::validation::validation_result::ValidationResult;
use crate::domain::validation::validation_error::ValidationError;

#[test]
fn test_validation_result_ok() {
    let res: ValidationResult = Ok(());
    assert!(res.is_ok());
}

#[test]
fn test_validation_result_err() {
    let err = vec![ValidationError::new("f", "m")];
    let res: ValidationResult = Err(err);
    assert!(res.is_err());
    assert_eq!(res.unwrap_err().len(), 1);
}
