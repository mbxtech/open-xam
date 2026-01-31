use crate::domain::validation::validation_error::ValidationError;

type Rule<T> = Box<dyn Fn(&T) -> Option<String> + Send + Sync>;

pub struct FieldValidator<T> {
    field_name: String,
    rules: Vec<Rule<T>>,
}

impl<T> FieldValidator<T> {
    pub fn new(field_name: impl Into<String>) -> Self {
        Self {
            field_name: field_name.into(),
            rules: Vec::new(),
        }
    }

    pub fn rule(mut self, f: impl Fn(&T) -> Option<String> + Send + Sync + 'static) -> Self {
        self.rules.push(Box::new(f));
        self
    }

    pub fn validate(&self, value: &T) -> Vec<ValidationError> {
        self.rules
            .iter()
            .filter_map(|r| r(value).map(|msg| ValidationError::new(&self.field_name, msg)))
            .collect()
    }
}

