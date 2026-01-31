use crate::domain::traits::validation::Validation;
use crate::domain::validation::field_validator::FieldValidator;
use crate::domain::validation::validation_result::ValidationResult;
use crate::domain::validation::validators::str_rules::{max_len, min_len, required};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<i32>,
    pub name: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

impl Validation for Category {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors = vec![];

        let name_validator = FieldValidator::new("name")
            .rule(required())
            .rule(min_len(5))
            .rule(max_len(255));
        validation_errors.extend(name_validator.validate(&self.name));

        if validation_errors.is_empty() {
            Ok(())
        } else {
            Err(validation_errors)
        }
    }
}
