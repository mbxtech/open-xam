use crate::domain::model::answer::Answer;
use crate::domain::traits::validation::Validation;

#[test]
fn test_answer_validation_valid() {
    let a = Answer {
        id: None,
        answer_text: "Valid answer text".into(),
        description: Some("Optional description".into()),
        is_correct: Some(true),
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: Some(1),
    };
    assert!(a.validate().is_ok());
}

#[test]
fn test_answer_validation_invalid_text() {
    let mut a = Answer {
        id: None,
        answer_text: "abc".into(), // Too short
        description: None,
        is_correct: None,
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: None,
    };
    assert!(a.validate().is_err());
    
    a.answer_text = "a".repeat(256); // Too long
    assert!(a.validate().is_err());
}

#[test]
fn test_answer_validation_invalid_description() {
    let mut a = Answer {
        id: None,
        answer_text: "Valid text".into(),
        description: Some("abc".into()), // Too short
        is_correct: None,
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: None,
    };
    assert!(a.validate().is_err());
    
    a.description = Some("a".repeat(256)); // Too long
    assert!(a.validate().is_err());
}

#[test]
fn test_answer_clone_and_debug() {
    let a = Answer {
        id: Some(1),
        answer_text: "Text".into(),
        description: None,
        is_correct: Some(true),
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: Some(1),
    };
    let a2 = a.clone();
    assert_eq!(a.answer_text, a2.answer_text);
    assert!(format!("{:?}", a).contains("Answer"));
}
