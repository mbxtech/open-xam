use crate::application::crud::crud_repository_trait::CRUDError;
use crate::domain::validation::validation_error::ValidationError;
use diesel::result::Error as DieselError;

#[test]
fn test_crud_error_display_without_validation_errors() {
    let err = CRUDError::new("Something went wrong", None);
    assert_eq!(format!("{err}"), "Something went wrong: ");
}

#[test]
fn test_crud_error_display_with_validation_errors() {
    let v_errs = vec![
        ValidationError::new("name", "too short"),
        ValidationError::new("email", "invalid"),
    ];
    let err = CRUDError::new("Validation failed", Some(v_errs));
    let expected = "Validation failed: field: name error: too short, field: email error: invalid";
    assert_eq!(format!("{err}"), expected);
}

#[test]
fn test_crud_error_from_diesel_error() {
    let diesel_err = DieselError::NotFound;
    let err = CRUDError::from(diesel_err);
    assert_eq!(format!("{err}"), "Record not found: ");
}
