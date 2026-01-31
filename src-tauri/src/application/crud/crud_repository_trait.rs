use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use diesel::result::Error;
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub struct CRUDError {
    validation_errors: Option<Vec<crate::domain::validation::validation_error::ValidationError>>,
    message: String,
}

impl CRUDError {
    pub fn new(
        message: impl Into<String>,
        validation_errors: Option<
            Vec<crate::domain::validation::validation_error::ValidationError>,
        >,
    ) -> Self {
        Self {
            message: message.into(),
            validation_errors,
        }
    }
}

impl From<Error> for CRUDError {
    fn from(value: Error) -> Self {
        CRUDError::new(value.to_string(), None)
    }
}

impl fmt::Display for CRUDError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let validation_errors = if let Some(errors) = &self.validation_errors {
            errors
                .iter()
                .map(|e| format!("field: {} error: {}", e.field, e.message).to_string())
                .collect::<Vec<_>>()
                .join(", ")
        } else {
            "".to_string()
        };
        write!(f, "{}: {}", self.message, validation_errors)
    }
}

impl std::error::Error for CRUDError {}

pub type CRUDResult<T> = Result<T, CRUDError>;

pub trait CRUDRepository<T> {
    fn create(&mut self, entity: &T) -> CRUDResult<T>;
    fn update(&mut self, entity: &T) -> CRUDResult<T>;
    fn delete(&mut self, id: i32) -> CRUDResult<usize>;
    fn find_by_id(&mut self, id: i32) -> CRUDResult<Option<T>>;
    fn find_all(&mut self, page_options: Option<PageOptions>) -> CRUDResult<PagedResult<T>>;
}
