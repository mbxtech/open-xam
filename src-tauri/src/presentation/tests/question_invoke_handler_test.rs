use crate::domain::model::exam::Exam;
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use crate::domain::model::status_type::StatusType;
use crate::presentation::exam_invoke_handler::create_exam;
use crate::presentation::question_invoke_handler::*;
use crate::presentation::tests::test_utils::{setup, teardown};
use serial_test::serial;

fn sample_exam() -> Exam {
    Exam {
        id: None,
        name: "Exam for Questions".into(),
        description: Some("Description".into()),
        points_to_succeeded: Some(50),
        duration: Some(60),
        status_type: Some(StatusType::Draft),
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    }
}

fn sample_question(exam_id: i32) -> Question {
    Question {
        id: None,
        question_text: "Test Question Text".to_string(),
        points_total: 10,
        r#type: QuestionType::SingleChoice,
        answers: vec![],
        points_per_correct_answer: Some(10),
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(exam_id),
    }
}

#[test]
#[serial]
fn test_question_invoke_handlers() {
    let db_path = setup("test_question_invoke");

    let exam = create_exam(sample_exam()).expect("Failed to create exam");
    let exam_id = exam.id.unwrap();

    // Test create (expect failure because of missing answers)
    let question = sample_question(exam_id);
    let result = create_question(question);
    assert!(result.is_err());

    // Test get questions by exam id
    let questions = get_questions_by_exam_id(exam_id, None).expect("Failed to get questions");
    assert_eq!(questions.data.len(), 0);

    // Test update (failure expected)
    let mut q_to_update = sample_question(exam_id);
    q_to_update.id = Some(1);
    let update_res = update_question(q_to_update);
    assert!(update_res.is_err());

    // Test delete
    let delete_res = delete_question(1);
    assert!(delete_res.is_ok());

    teardown(db_path);
    
}

#[test]
#[serial]
fn test_get_question_not_found() {
    let db_path = setup("test_question_not_found");
    let result = get_question(999);
    assert!(result.is_err());
    teardown(db_path);
}
