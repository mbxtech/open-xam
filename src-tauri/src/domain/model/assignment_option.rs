use crate::domain::traits::validation::Validation;
use crate::domain::validation::field_validator::FieldValidator;
use crate::domain::validation::validation_error::ValidationError;
use crate::domain::validation::validation_result::ValidationResult;
use crate::domain::validation::validators::num_rules::min;
use crate::domain::validation::validators::str_rules::{max_len, min_len, required};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentOption {
    pub row_id: Option<i32>,
    pub id: i32,
    pub text: String,
    pub question_id: Option<i32>,
}

impl Validation for AssignmentOption {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        let id_validator = FieldValidator::new("id").rule(min(1));
        validation_errors.extend(id_validator.validate(&self.id));

        let text_validator = FieldValidator::new("text")
            .rule(required())
            .rule(min_len(1))
            .rule(max_len(255));
        validation_errors.extend(text_validator.validate(&self.text));

        if validation_errors.is_empty() {
            return Ok(());
        }

        Err(validation_errors)
    }
}
