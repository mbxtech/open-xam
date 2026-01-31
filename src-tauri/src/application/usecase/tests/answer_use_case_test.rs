use crate::application::crud::answer_repository_trait::AnswerRepository;
use crate::application::usecase::answer_use_case::AnswerUseCase;
use crate::domain::model::answer::Answer;
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
use crate::application::crud::crud_repository_trait::CRUDRepository;
use diesel::{Connection, SqliteConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

fn get_connection() -> SqliteConnection {
    let mut connection = SqliteConnection::establish(":memory:").unwrap();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
    connection
}

fn create_question(conn: &mut SqliteConnection) -> Question {
    let mut repo = SQLiteQuestionCrudRepository::new(conn);
    let q = Question {
        id: None,
        question_text: "What is Rust language?".to_string(),
        points_total: 10,
        r#type: QuestionType::SingleChoice,
        answers: vec![],
        points_per_correct_answer: Some(10),
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(1),
    };
    repo.create(&q).unwrap()
}

#[test]
fn create_update_delete_answer_usecase() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    // create
    let new_answer = Answer {
        id: None,
        answer_text: "First answer text".into(),
        description: Some("First answer text".into()),
        is_correct: Some(true),
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: Some(qid),
    };
    let created = AnswerUseCase::create_answer(&mut conn, new_answer).unwrap();
    assert!(created.id.unwrap() > 0);

    // update
    let updated = AnswerUseCase::update_answer(
        &mut conn,
        Answer {
            answer_text: "Updated answer text".into(),
            ..created.clone()
        },
    )
    .unwrap();
    assert_eq!(updated.answer_text, "Updated answer text");

    // delete
    let del = AnswerUseCase::delete_answer(&mut conn, updated.id.unwrap()).unwrap();
    assert_eq!(del, 1);
}

#[test]
fn update_answers_by_question_id_creates_updates_and_deletes() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    let a1 = AnswerUseCase::create_answer(
        &mut conn,
        Answer {
            id: None,
            answer_text: "Answer one text".into(),
            description: Some("Answer one text".into()),
            is_correct: Some(true),
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: Some(qid),
        },
    )
    .unwrap();
    let _a2 = AnswerUseCase::create_answer(
        &mut conn,
        Answer {
            id: None,
            answer_text: "Answer two text".into(),
            description: Some("Answer two text".into()),
            is_correct: Some(false),
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: Some(qid),
        },
    )
    .unwrap();

    let updated_list = AnswerUseCase::update_answers_by_question_id(
        &mut conn,
        qid,
        vec![
            Answer {
                answer_text: "Answer one UPDATED".into(),
                ..a1.clone()
            },
            Answer {
                id: None,
                answer_text: "Answer three text".into(),
                description: Some("Answer three text".into()),
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(qid),
            },
        ],
    )
    .unwrap();

    assert_eq!(updated_list.len(), 2);
    assert!(updated_list.iter().any(|a| a.answer_text == "Answer one UPDATED"));
    assert!(updated_list.iter().any(|a| a.answer_text == "Answer three text"));

    // Verify a2 was deleted
    let mut repo = crate::infrastructure::repositories::sqlite_answer_crud_repository::SQLiteAnswerCrudRepository::new(&mut conn);
    let all = repo.get_all_for_question(qid).unwrap();
    assert_eq!(all.len(), 2);
    assert!(!all.iter().any(|a| a.answer_text == "Answer two text"));
}

#[test]
fn it_should_remove_all_for_question() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    AnswerUseCase::create_answer(&mut conn, Answer {
        id: None,
        answer_text: "Answer text".into(),
        description: None,
        is_correct: None,
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: Some(qid),
    }).unwrap();

    let removed = AnswerUseCase::remove_all_for_question(&mut conn, qid).unwrap();
    assert_eq!(removed, 1);

    let mut repo = crate::infrastructure::repositories::sqlite_answer_crud_repository::SQLiteAnswerCrudRepository::new(&mut conn);
    let all = repo.get_all_for_question(qid).unwrap();
    assert_eq!(all.len(), 0);
}

#[test]
fn it_should_fail_on_validation_error() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    let invalid_answer = Answer {
        id: None,
        answer_text: "abc".into(), // too short
        description: None,
        is_correct: None,
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: Some(qid),
    };

    let result = AnswerUseCase::create_answer(&mut conn, invalid_answer);
    assert!(result.is_err());
}
