use crate::domain::model::conjunction_type::ConjunctionType;
use crate::domain::model::operator::Operator;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FilterTree {
    pub root: FilterOption,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conjunction: Option<ConjunctionType>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FilterOption {
    Group {
        conjunction: ConjunctionType,
        filters: Vec<FilterOption>,
    },
    Condition {
        field: String,
        operator: Operator,
        value: FilterValue,
    },
}

impl FilterOption {
    pub fn contains_field(&self, field_name: &str) -> bool {
        match self {
            FilterOption::Group { filters, .. } => filters
                .iter()
                .any(|filter| filter.contains_field(field_name)),
            FilterOption::Condition { field, .. } => field == field_name,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FilterValue {
    Str { value: String },
    Int { value: i64 },
    Bool { value: bool },
    StrList { values: Vec<String> },
    IntList { values: Vec<i64> },
}

