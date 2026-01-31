use crate::application::crud::enum_converter_trait::EnumConverterTrait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum StatusType {
    Active,
    Inactive,
    Draft,
    Archived,
}

impl EnumConverterTrait for StatusType {
    fn convert_to_string(&self) -> &str {
        match self {
            StatusType::Active => "Active",
            StatusType::Inactive => "Inactive",
            StatusType::Draft => "Draft",
            StatusType::Archived => "Archived",
        }
    }

    fn convert_from_string(value: &str) -> Self {
        match value {
            "Active" => StatusType::Active,
            "Inactive" => StatusType::Inactive,
            "Draft" => StatusType::Draft,
            "Archived" => StatusType::Archived,
            _ => StatusType::Inactive,
        }
    }
}

