use crate::domain::validation::validation_error::ValidationError;

pub type ValidationResult = Result<(), Vec<ValidationError>>;
