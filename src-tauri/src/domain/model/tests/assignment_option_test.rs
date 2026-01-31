use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::traits::validation::Validation;

#[test]
fn test_assignment_option_validation_valid() {
    let ao = AssignmentOption {
        row_id: None,
        id: 1,
        text: "Valid Option".into(),
        question_id: Some(1),
    };
    assert!(ao.validate().is_ok());
}

#[test]
fn test_assignment_option_validation_invalid_id() {
    let ao = AssignmentOption {
        row_id: None,
        id: 0,
        text: "Valid Text".into(),
        question_id: None,
    };
    assert!(ao.validate().is_err());
}

#[test]
fn test_assignment_option_validation_invalid_text() {
    let mut ao = AssignmentOption {
        row_id: None,
        id: 1,
        text: "".into(),
        question_id: None,
    };
    assert!(ao.validate().is_err());
    
    ao.text = "a".repeat(256);
    assert!(ao.validate().is_err());
}

#[test]
fn test_assignment_option_clone_and_debug() {
    let ao = AssignmentOption {
        row_id: Some(1),
        id: 1,
        text: "Opt".into(),
        question_id: Some(1),
    };
    let ao2 = ao.clone();
    assert_eq!(ao.text, ao2.text);
    assert!(format!("{:?}", ao).contains("AssignmentOption"));
}
