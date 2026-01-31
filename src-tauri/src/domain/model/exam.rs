use crate::domain::model::category::Category;
use crate::domain::model::question::Question;
use crate::domain::model::status_type::StatusType;
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
pub struct Exam {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<i32>,
    
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub points_to_succeeded: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_type: Option<StatusType>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Category>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_questions_real_exam: Option<i32>,

    pub questions: Vec<Question>,
}

impl Validation for Exam {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        let name_validator = FieldValidator::new("name")
            .rule(required())
            .rule(min_len(5))
            .rule(max_len(255));
        validation_errors.extend(name_validator.validate(&self.name));

        let description_validator = FieldValidator::new("description").rule(optional(max_len(255)));
        validation_errors.extend(description_validator.validate(&self.description));

        if validation_errors.is_empty() {
            Ok(())
        } else {
            Err(validation_errors)
        }
    }
}
