use crate::domain::traits::validation::Validation;
use crate::domain::validation::field_validator::FieldValidator;
use crate::domain::validation::validation_error::ValidationError;
use crate::domain::validation::validation_result::ValidationResult;
use crate::domain::validation::validators::optional;
use crate::domain::validation::validators::str_rules::{max_len, min_len, required};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Answer {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<i32>,

    pub answer_text: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    pub is_correct: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub assigned_option_id: Option<i32>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub question_id: Option<i32>,
}

impl Validation for Answer {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        let answer_text_validator = FieldValidator::new("answer_text")
            .rule(required())
            .rule(min_len(5))
            .rule(max_len(255));
        validation_errors.extend(answer_text_validator.validate(&self.answer_text));

        let description_validator = FieldValidator::new("description")
            .rule(optional(min_len(5)))
            .rule(optional(max_len(255)));
        validation_errors.extend(description_validator.validate(&self.description));

        if validation_errors.is_empty() {
            Ok(())
        } else {
            Err(validation_errors)
        }
    }
}
