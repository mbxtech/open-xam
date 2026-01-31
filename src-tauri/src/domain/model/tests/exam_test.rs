use crate::domain::model::exam::Exam;
use crate::domain::model::status_type::StatusType;
use crate::domain::traits::validation::Validation;

#[test]
fn test_exam_validation_valid() {
    let e = Exam {
        id: None,
        name: "Valid Exam Name".into(),
        description: Some("Optional description".into()),
        points_to_succeeded: Some(50),
        duration: Some(60),
        status_type: Some(StatusType::Draft),
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    };
    assert!(e.validate().is_ok());
}

#[test]
fn test_exam_validation_invalid_name() {
    let mut e = Exam {
        id: None,
        name: "abc".into(), // Too short
        description: None,
        points_to_succeeded: None,
        duration: None,
        status_type: None,
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    };
    assert!(e.validate().is_err());

    e.name = "a".repeat(256); // Too long
    assert!(e.validate().is_err());
}

#[test]
fn test_exam_validation_invalid_description() {
    let e = Exam {
        id: None,
        name: "Valid Name".into(),
        description: Some("a".repeat(256)), // Too long
        points_to_succeeded: None,
        duration: None,
        status_type: None,
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    };
    assert!(e.validate().is_err());
}

#[test]
fn test_exam_clone_and_debug() {
    let e = Exam {
        id: Some(1),
        name: "Exam".into(),
        description: None,
        points_to_succeeded: None,
        duration: None,
        status_type: None,
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    };
    let e2 = e.clone();
    assert_eq!(e.name, e2.name);
    assert!(format!("{:?}", e).contains("Exam"));
}
