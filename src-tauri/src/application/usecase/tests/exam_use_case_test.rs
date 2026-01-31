use crate::application::usecase::exam_use_case::ExamUseCase;
use crate::domain::model::answer::Answer;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::exam::Exam;
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use crate::domain::model::status_type::StatusType;
use diesel::{Connection, SqliteConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

fn get_connection() -> SqliteConnection {
    let mut connection = SqliteConnection::establish(":memory:").unwrap();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
    connection
}

fn sample_exam() -> Exam {
    Exam {
        id: None,
        duration: None,
        name: "Network Security Exam".into(),
        description: Some("Covers network security topics".into()),
        points_to_succeeded: Some(60),
        status_type: Some(StatusType::Active),
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![
            Question {
                id: None,
                question_text: "What is a firewall long text?".into(),
                points_total: 10,
                r#type: QuestionType::SingleChoice,
                answers: vec![
                    Answer {
                        id: None,
                        answer_text: "Blocks unauthorized traffic".into(),
                        description: Some("Blocks unauthorized traffic".into()),
                        is_correct: Some(true),
                        assigned_option_id: None,
                        created_at: None,
                        updated_at: None,
                        question_id: Some(0),
                    },
                    Answer {
                        id: None,
                        answer_text: "Allows all packets blindly".into(),
                        description: Some("Allows all packets blindly".into()),
                        is_correct: Some(false),
                        assigned_option_id: None,
                        created_at: None,
                        updated_at: None,
                        question_id: Some(0),
                    },
                ],
                points_per_correct_answer: Some(10),
                category: None,
                created_at: None,
                updated_at: None,
                options: Some(vec![
                    AssignmentOption {
                        row_id: Some(0),
                        id: 1,
                        text: "Stateful".into(),
                        question_id: Some(0),
                    },
                    AssignmentOption {
                        row_id: Some(0),
                        id: 2,
                        text: "Stateless".into(),
                        question_id: Some(0),
                    },
                ]),
                exam_id: None,
            },
        ],
    }
}

#[test]
fn create_find_all_find_by_id_and_delete_exam() {
    let mut conn = get_connection();
    let mut exam = sample_exam();
    let created = ExamUseCase::create_exam(&mut conn, &mut exam).unwrap();
    assert!(created.id.unwrap() > 0);
    assert_eq!(created.questions.len(), 1);

    // find_by_id
    let found = ExamUseCase::find_exam_by_id(&mut conn, created.id.unwrap()).unwrap();
    assert!(found.is_some());

    // find_all
    let all = ExamUseCase::find_all_exams(&mut conn, None).unwrap();
    assert!(!all.data.is_empty());

    // delete
    let del = ExamUseCase::delete_exam(&mut conn, created.id.unwrap()).unwrap();
    assert_eq!(del, 1);
}

#[test]
fn it_should_add_new_question_to_exam() {
    let mut conn = get_connection();
    let mut exam = sample_exam();
    let created = ExamUseCase::create_exam(&mut conn, &mut exam).unwrap();

    let found = ExamUseCase::find_exam_by_id(&mut conn, created.id.unwrap()).unwrap();
    let mut exam_to_update = found.unwrap();

    let new_question = Question {
        id: None,
        question_text: "New Question Text Here".into(),
        points_total: 5,
        r#type: QuestionType::MultipleChoice,
        answers: vec![
             Answer {
                id: None,
                answer_text: "Answer A text".into(),
                description: None,
                is_correct: Some(true),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: None,
            },
            Answer {
                id: None,
                answer_text: "Answer B text".into(),
                description: None,
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: None,
            },
        ],
        points_per_correct_answer: Some(5),
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(exam_to_update.id.unwrap()),
    };

    exam_to_update.questions.push(new_question);
    let updated = ExamUseCase::update_exam(&mut conn, &mut exam_to_update).unwrap();
    assert_eq!(updated.questions.len(), 2);
}

#[test]
fn it_should_get_overall_statistics() {
    let mut conn = get_connection();
    let mut exam = sample_exam();
    ExamUseCase::create_exam(&mut conn, &mut exam).unwrap();

    let stats = ExamUseCase::get_exam_overall_statistics(&mut conn).unwrap();
    assert_eq!(stats.exam_count, 1);
}

#[test]
fn it_should_validate_exam_successfully() {
    let exam = sample_exam();
    let result = ExamUseCase::validate_exam(&exam);
    assert!(result.is_ok());
}

#[test]
fn it_should_fail_validation_for_exam() {
    let mut exam = sample_exam();
    exam.name = "abc".into(); // too short
    let result = ExamUseCase::validate_exam(&exam);
    assert!(result.is_err());
}

#[test]
fn it_should_search_exams() {
    let mut conn = get_connection();
    let mut exam = sample_exam();
    ExamUseCase::create_exam(&mut conn, &mut exam).unwrap();

    let result = ExamUseCase::search_exams(&mut conn, vec![], None).unwrap();
    assert_eq!(result.total_elements, 1);
}

#[test]
fn it_should_find_by_id_with_relations() {
    let mut conn = get_connection();
    let mut exam = sample_exam();
    let created = ExamUseCase::create_exam(&mut conn, &mut exam).unwrap();

    let found = ExamUseCase::find_by_id_with_relations(&mut conn, created.id.unwrap()).unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().questions.len(), 1);
}

#[test]
fn it_should_remove_question_from_exam_on_update() {
    let mut conn = get_connection();
    let mut exam = sample_exam();
    // Add another question to sample_exam
    exam.questions.push(Question {
        id: None,
        question_text: "Second Question text here?".into(),
        points_total: 5,
        r#type: QuestionType::SingleChoice,
        answers: vec![
            Answer {
                id: None,
                answer_text: "Correct answer".into(),
                description: None,
                is_correct: Some(true),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: None,
            },
            Answer {
                id: None,
                answer_text: "Wrong answer".into(),
                description: None,
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: None,
            },
        ],
        points_per_correct_answer: Some(5),
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: None,
    });

    let created = ExamUseCase::create_exam(&mut conn, &mut exam).unwrap();
    assert_eq!(created.questions.len(), 2);

    let mut exam_to_update = created.clone();
    exam_to_update.questions.remove(1); // remove second question

    let updated = ExamUseCase::update_exam(&mut conn, &mut exam_to_update).unwrap();
    assert_eq!(updated.questions.len(), 1);

    // Verify it's actually removed from DB
    let found = ExamUseCase::find_by_id_with_relations(&mut conn, created.id.unwrap()).unwrap();
    assert_eq!(found.unwrap().questions.len(), 1);
}

#[test]
fn it_should_fail_validation_for_answers_and_options() {
    let mut exam = sample_exam();

    // Invalid answer (too short text)
    exam.questions[0].answers[0].answer_text = "abc".into();

    let result = ExamUseCase::validate_exam(&exam);
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(!err.nested_errors.is_empty());
    // Check if the nested error contains the answer validation error
    let question_err = &err.nested_errors[0];
    assert!(!question_err.nested_errors.is_empty());
    let answer_err = &question_err.nested_errors[0];
    assert!(answer_err.message.contains("Answer: abc"));
    assert_eq!(answer_err.errors[0].field, "answer_text");

    // Invalid option (too short text)
    let mut exam2 = sample_exam();
    if let Some(ref mut options) = exam2.questions[0].options {
        options[0].text = "".into(); // Invalid, required and min_len(1)
    }
    let result2 = ExamUseCase::validate_exam(&exam2);
    assert!(result2.is_err());
    let err2 = result2.unwrap_err();
    let question_err2 = &err2.nested_errors[0];
    // Find option error in nested_errors
    let option_err = question_err2
        .nested_errors
        .iter()
        .find(|e| e.message.contains("Option: "))
        .unwrap();
    assert_eq!(option_err.errors[0].field, "text");
}
