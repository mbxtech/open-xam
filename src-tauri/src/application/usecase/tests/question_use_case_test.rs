use crate::application::usecase::question_use_case::QuestionUseCase;
use crate::application::crud::answer_repository_trait::AnswerRepository;
use crate::application::crud::crud_repository_trait::CRUDRepository;
use crate::domain::model::answer::Answer;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::exam::Exam;
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use crate::infrastructure::repositories::sqlite_answer_crud_repository::SQLiteAnswerCrudRepository;
use crate::infrastructure::repositories::sqlite_exam_crud_repository::SQLiteExamCrudRepository;
use diesel::{Connection, SqliteConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

fn get_connection() -> SqliteConnection {
    let mut connection = SqliteConnection::establish(":memory:").unwrap();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
    connection
}

fn create_exam(conn: &mut SqliteConnection) -> Exam {
    let mut repo = SQLiteExamCrudRepository::new(conn);
    let exam = Exam {
        id: None,
        duration: None,
        name: "Sample Exam for Question UC".into(),
        description: Some("Desc".into()),
        points_to_succeeded: Some(50),
        status_type: None,
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    };
    repo.create(&exam).unwrap()
}

fn base_question(exam_id: i32) -> Question {
    Question {
        id: None,
        question_text: "What is a long enough question?".to_string(),
        points_total: 10,
        r#type: QuestionType::SingleChoice,
        answers: vec![
            Answer {
                id: None,
                answer_text: "First correct text".into(),
                description: Some("First correct text".into()),
                is_correct: Some(true),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(0),
            },
            Answer {
                id: None,
                answer_text: "Second wrong text".into(),
                description: Some("Second wrong text".into()),
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
                text: "Option Alpha".into(),
                question_id: Some(0),
            },
            AssignmentOption {
                row_id: Some(0),
                id: 2,
                text: "Option Beta".into(),
                question_id: Some(0),
            },
        ]),
        exam_id: Some(exam_id),
    }
}

#[test]
fn create_update_delete_question() {
    let mut conn = get_connection();
    let exam = create_exam(&mut conn);

    // create
    let q = base_question(exam.id.unwrap());
    let created = QuestionUseCase::create_question(&mut conn, q).unwrap();
    assert!(created.id.unwrap() > 0);

    // update
    let mut to_update = created;
    to_update.question_text = "Updated question text long enough".into();
    let mut answers = to_update.answers.clone();
    answers[0].answer_text = "First answer UPDATED text".into();
    to_update.answers = answers;

    let updated = QuestionUseCase::update_question(&mut conn, &to_update).unwrap();
    assert_eq!(updated.question_text, "Updated question text long enough");

    // delete
    let del = QuestionUseCase::delete_question(&mut conn, updated.id.unwrap()).unwrap();
    assert_eq!(del, 1);
}

#[test]
fn it_should_handle_type_switch() {
    let mut conn = get_connection();
    let exam = create_exam(&mut conn);

    // Assignment -> SingleChoice
    let mut q = base_question(exam.id.unwrap());
    q.r#type = QuestionType::Assignment;
    q.answers.iter_mut().for_each(|a| {
        a.is_correct = None;
        a.assigned_option_id = Some(1);
    });

    let created = QuestionUseCase::create_question(&mut conn, q).unwrap();
    let q_id = created.id.unwrap();

    let mut to_update = created;
    to_update.r#type = QuestionType::SingleChoice;
    to_update.options = None;
    to_update.answers = vec![
        Answer {
            id: None,
            answer_text: "New SC Answer 1".into(),
            is_correct: Some(true),
            assigned_option_id: None,
            description: None,
            created_at: None,
            updated_at: None,
            question_id: Some(q_id),
        },
        Answer {
            id: None,
            answer_text: "New SC Answer 2".into(),
            is_correct: Some(false),
            assigned_option_id: None,
            description: None,
            created_at: None,
            updated_at: None,
            question_id: Some(q_id),
        },
    ];

    let updated = QuestionUseCase::update_question(&mut conn, &to_update).unwrap();
    assert_eq!(updated.r#type, QuestionType::SingleChoice);
    assert!(updated.options.is_none());

    let mut answer_repo = SQLiteAnswerCrudRepository::new(&mut conn);
    let all_answers = answer_repo.get_all_for_question(q_id).unwrap();
    assert_eq!(all_answers.len(), 2);
}

#[test]
fn it_should_fail_create_without_exam_id() {
    let mut conn = get_connection();
    let mut q = base_question(1);
    q.exam_id = None;
    let result = QuestionUseCase::create_question(&mut conn, q);
    assert!(result.is_err());
}

#[test]
fn it_should_fail_on_validation_errors() {
    let mut conn = get_connection();
    let exam = create_exam(&mut conn);
    let mut q = base_question(exam.id.unwrap());
    q.question_text = "abc".into(); // too short
    let result = QuestionUseCase::create_question(&mut conn, q);
    assert!(result.is_err());
}

#[test]
fn it_should_get_questions_by_exam_id() {
    let mut conn = get_connection();
    let exam = create_exam(&mut conn);
    let q = base_question(exam.id.unwrap());
    QuestionUseCase::create_question(&mut conn, q).unwrap();

    let result = QuestionUseCase::get_questions_by_exam_id(exam.id.unwrap(), None, &mut conn).unwrap();
    assert_eq!(result.total_elements, 1);
}

#[test]
fn it_should_fail_update_when_not_found() {
    let mut conn = get_connection();
    let mut q = base_question(1);
    q.id = Some(999);
    let result = QuestionUseCase::update_question(&mut conn, &q);
    assert!(result.is_err());
}

#[test]
fn it_should_fail_when_getting_non_existing_question() {
    let mut conn = get_connection();
    let fetched = QuestionUseCase::get_question_by_id(&mut conn, 999);
    assert!(fetched.is_err());
}
