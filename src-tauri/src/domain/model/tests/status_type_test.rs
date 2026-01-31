use crate::domain::model::status_type::StatusType;
use crate::application::crud::enum_converter_trait::EnumConverterTrait;

#[test]
fn test_convert_to_string_active() {
    assert_eq!(StatusType::Active.convert_to_string(), "Active");
}

#[test]
fn test_convert_to_string_inactive() {
    assert_eq!(StatusType::Inactive.convert_to_string(), "Inactive");
}

#[test]
fn test_convert_to_string_draft() {
    assert_eq!(StatusType::Draft.convert_to_string(), "Draft");
}

#[test]
fn test_convert_to_string_archived() {
    assert_eq!(StatusType::Archived.convert_to_string(), "Archived");
}

#[test]
fn test_convert_from_string_active() {
    let result = StatusType::convert_from_string("Active");
    assert_eq!(result.convert_to_string(), "Active");
}

#[test]
fn test_convert_from_string_inactive() {
    let result = StatusType::convert_from_string("Inactive");
    assert_eq!(result.convert_to_string(), "Inactive");
}

#[test]
fn test_convert_from_string_draft() {
    let result = StatusType::convert_from_string("Draft");
    assert_eq!(result.convert_to_string(), "Draft");
}

#[test]
fn test_convert_from_string_archived() {
    let result = StatusType::convert_from_string("Archived");
    assert_eq!(result.convert_to_string(), "Archived");
}

#[test]
fn test_convert_from_string_invalid_defaults_to_inactive() {
    let result = StatusType::convert_from_string("InvalidValue");
    assert_eq!(result.convert_to_string(), "Inactive");
}

#[test]
fn test_convert_from_string_empty_defaults_to_inactive() {
    let result = StatusType::convert_from_string("");
    assert_eq!(result.convert_to_string(), "Inactive");
}

#[test]
fn test_status_type_debug() {
    assert_eq!(format!("{:?}", StatusType::Active), "Active");
}

#[test]
fn test_status_type_clone() {
    let s = StatusType::Draft;
    let s2 = s.clone();
    assert_eq!(s.convert_to_string(), s2.convert_to_string());
}
