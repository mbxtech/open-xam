use crate::domain::model::question_type::QuestionType;

#[test]
fn test_question_type_display() {
    assert_eq!(format!("{}", QuestionType::Assignment), "Assignment");
    assert_eq!(format!("{}", QuestionType::MultipleChoice), "MultipleChoice");
    assert_eq!(format!("{}", QuestionType::SingleChoice), "SingleChoice");
}

#[test]
fn test_question_type_serialization() {
    assert_eq!(serde_json::to_string(&QuestionType::Assignment).unwrap(), "\"ASSIGNMENT\"");
    assert_eq!(serde_json::to_string(&QuestionType::MultipleChoice).unwrap(), "\"MULTIPLE_CHOICE\"");
    assert_eq!(serde_json::to_string(&QuestionType::SingleChoice).unwrap(), "\"SINGLE_CHOICE\"");
}

#[test]
fn test_question_type_equality() {
    assert_eq!(QuestionType::Assignment, QuestionType::Assignment);
    assert_ne!(QuestionType::Assignment, QuestionType::SingleChoice);
}
