use serde::{Deserialize, Serialize};
use crate::domain::validation::validation_error::ValidationError;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtendedValidationError {
    pub index: i32,
    pub message: String,
    pub errors: Vec<ValidationError>,
    pub nested_errors: Vec<ExtendedValidationError>,
}

impl ExtendedValidationError {
    pub fn new(index: i32, message: impl Into<String>, errors: Vec<ValidationError>, nested_errors: Vec<ExtendedValidationError>) -> Self {
        Self {
            index,
            message: message.into(),
            errors,
            nested_errors
        }
    }
}