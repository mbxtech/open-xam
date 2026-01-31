use crate::domain::model::question::Question;
use crate::domain::model::answer::Answer;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::question_type::QuestionType;
use crate::domain::traits::validation::Validation;

fn base_question() -> Question {
    Question {
        id: None,
        question_text: "Valid question text?".into(),
        points_total: 10,
        r#type: QuestionType::SingleChoice,
        answers: vec![
            Answer {
                id: None,
                answer_text: "A1 12345".into(),
                description: None,
                is_correct: Some(true),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(0),
            },
            Answer {
                id: None,
                answer_text: "A2 12345".into(),
                description: None,
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(0),
            },
        ],
        points_per_correct_answer: Some(5),
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(1),
    }
}

#[test]
fn test_question_new() {
    let q = Question {
        id: None,
        question_text: "Base".into(),
        points_total: 10,
        r#type: QuestionType::SingleChoice,
        answers: vec![],
        points_per_correct_answer: None,
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: None,
    };
    let answers = vec![Answer {
        id: None,
        answer_text: "Ans".into(),
        description: None,
        is_correct: None,
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: None,
    }];
    let options = vec![AssignmentOption {
        row_id: None,
        id: 1,
        text: "Opt".into(),
        question_id: None,
    }];
    let new_q = Question::new(q, answers.clone(), options.clone());
    assert_eq!(new_q.answers.len(), 1);
    assert_eq!(new_q.options.unwrap().len(), 1);
}

#[test]
fn test_question_validation_valid() {
    let q = base_question();
    assert!(q.validate().is_ok());
}

#[test]
fn test_question_validation_invalid_text() {
    let mut q = base_question();
    q.question_text = "abc".into();
    assert!(q.validate().is_err());
    
    q.question_text = "a".repeat(501);
    assert!(q.validate().is_err());
}

#[test]
fn test_question_validation_invalid_points() {
    let mut q = base_question();
    q.points_total = 0;
    assert!(q.validate().is_err());
    
    q.points_total = 1001;
    assert!(q.validate().is_err());
}

#[test]
fn test_validate_answers_count() {
    let mut q = base_question();
    q.answers = vec![q.answers[0].clone()];
    assert!(q.validate_answers().is_err());
}

#[test]
fn test_validate_answers_single_choice() {
    let mut q = base_question();
    q.r#type = QuestionType::SingleChoice;
    assert!(q.validate_answers().is_ok());

    // No correct answer
    q.answers[0].is_correct = Some(false);
    assert!(q.validate_answers().is_err());

    // Multiple correct answers
    q.answers[0].is_correct = Some(true);
    q.answers[1].is_correct = Some(true);
    assert!(q.validate_answers().is_err());
}

#[test]
fn test_validate_answers_multiple_choice() {
    let mut q = base_question();
    q.r#type = QuestionType::MultipleChoice;
    assert!(q.validate_answers().is_ok());
}

#[test]
fn test_validate_answers_assignment() {
    let mut q = base_question();
    q.r#type = QuestionType::Assignment;
    q.options = Some(vec![AssignmentOption {
        row_id: Some(1),
        id: 1,
        text: "O1".into(),
        question_id: Some(0),
    }]);
    q.answers[0].assigned_option_id = Some(1);
    q.answers[1].assigned_option_id = Some(1);
    assert!(q.validate_answers().is_ok());

    // Missing options
    q.options = None;
    assert!(q.validate_answers().is_err());

    // Empty options
    q.options = Some(vec![]);
    assert!(q.validate_answers().is_err());

    // Missing assigned_option_id
    q.options = Some(vec![AssignmentOption {
        row_id: Some(1),
        id: 1,
        text: "O1".into(),
        question_id: Some(0),
    }]);
    q.answers[0].assigned_option_id = None;
    assert!(q.validate_answers().is_err());
}

#[test]
fn test_validate_options() {
    let mut q = base_question();
    q.options = Some(vec![AssignmentOption {
        row_id: None,
        id: 1,
        text: "".into(), // Invalid text
        question_id: Some(1),
    }]);
    assert!(q.validate_options(true).is_err());
    
    // constraint_check = false should filter out question_id errors
    // but text error should still be there
    assert!(q.validate_options(false).is_err());
    
    // Valid options
    q.options = Some(vec![AssignmentOption {
        row_id: None,
        id: 1,
        text: "Valid".into(),
        question_id: Some(1),
    }]);
    assert!(q.validate_options(true).is_ok());
}
