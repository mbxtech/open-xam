use crate::domain::validation::validation_result::ValidationResult;

pub trait Validation {
    fn validate(&self) -> ValidationResult;
}
