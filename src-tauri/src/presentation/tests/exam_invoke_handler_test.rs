use crate::domain::model::answer::Answer;
use crate::domain::model::exam::Exam;
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use crate::domain::model::status_type::StatusType;
use crate::presentation::exam_invoke_handler::*;
use crate::presentation::tests::test_utils::{setup, teardown};
use serial_test::serial;

fn sample_exam() -> Exam {
    Exam {
        id: None,
        name: "Network Security Exam".into(),
        description: Some("Covers network security topics".into()),
        points_to_succeeded: Some(60),
        duration: Some(60),
        status_type: Some(StatusType::Active),
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![
            Question {
                id: None,
                question_text: "What is Rust?".into(),
                points_total: 10,
                r#type: QuestionType::SingleChoice,
                answers: vec![
                    Answer {
                        id: None,
                        answer_text: "A language".into(),
                        description: None,
                        is_correct: Some(true),
                        assigned_option_id: None,
                        created_at: None,
                        updated_at: None,
                        question_id: None,
                    },
                    Answer {
                        id: None,
                        answer_text: "A fruit".into(),
                        description: None,
                        is_correct: Some(false),
                        assigned_option_id: None,
                        created_at: None,
                        updated_at: None,
                        question_id: None,
                    },
                ],
                points_per_correct_answer: Some(10),
                category: None,
                created_at: None,
                updated_at: None,
                options: None,
                exam_id: None,
            }
        ],
    }
}

#[test]
#[serial]
fn test_exam_invoke_handlers() {
    let db_path = setup("test_exam_invoke");

    // Test create
    let exam = sample_exam();
    let created = create_exam(exam.clone()).expect("Failed to create exam");
    assert!(created.id.is_some());
    assert_eq!(created.name, "Network Security Exam");

    // Test get by id
    let found = get_exam(created.id.unwrap()).expect("Failed to get exam");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Network Security Exam");

    // Test update
    let mut to_update = created.clone();
    to_update.name = "Updated Exam Name".to_string();
    let updated = update_exam(to_update).expect("Failed to update exam");
    assert_eq!(updated.name, "Updated Exam Name");

    // Test get all
    let all = get_exams(None).expect("Failed to get exams");
    assert_eq!(all.data.len(), 1);

    // Test search
    let search_result = search_exams(vec![], None).expect("Failed to search exams");
    assert_eq!(search_result.data.len(), 1);

    // Test overall statistics
    let stats = get_exam_overall_statistics().expect("Failed to get statistics");
    assert_eq!(stats.exam_count, 1);

    // Test find with relations
    let found_with_rel = find_exam_with_relations(created.id.unwrap()).expect("Failed to find with relations");
    assert!(found_with_rel.is_some());

    // Test validate
    let validate_res = validate_exam(created);
    assert!(validate_res.is_ok());

    // Test delete
    let deleted = delete_exam(updated.id.unwrap()).expect("Failed to delete exam");
    assert_eq!(deleted, 1);

    teardown(db_path);

}

#[test]
#[serial]
fn test_get_exam_not_found() {
    let db_path = setup("test_exam_not_found");
    let result = get_exam(999);
    assert!(result.is_err());
    teardown(db_path);

}
