use crate::application::crud::assignment_option_repository_trait::AssignmentOptionRepository;
use crate::application::usecase::assignment_option_use_case::AssignmentOptionUseCase;
use crate::domain::model::assignment_option::AssignmentOption;
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
        question_text: "Assignment question text".to_string(),
        points_total: 5,
        r#type: QuestionType::Assignment,
        answers: vec![],
        points_per_correct_answer: None,
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(1),
    };
    repo.create(&q).unwrap()
}

#[test]
fn create_update_delete_assignment_option_usecase() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    // create
    let created = AssignmentOptionUseCase::create_assignment_option(
        &mut conn,
        AssignmentOption {
            row_id: Some(0),
            id: 100,
            text: "Option 100".into(),
            question_id: Some(qid),
        },
    )
    .unwrap();
    assert!(created.row_id.unwrap_or(0) > 0);

    // update
    let updated = AssignmentOptionUseCase::update_assignment_option(
        &mut conn,
        AssignmentOption {
            text: "Option 100 updated".into(),
            ..created.clone()
        },
    )
    .unwrap();
    assert_eq!(updated.text, "Option 100 updated");

    // delete
    let del = AssignmentOptionUseCase::delete_assignment_option(
        &mut conn,
        updated.id,
    )
    .unwrap();
    assert_eq!(del, 1);
}

#[test]
fn update_by_question_id_creates_updates_and_deletes() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    // initial create two options
    let opt1 = AssignmentOptionUseCase::create_assignment_option(
        &mut conn,
        AssignmentOption {
            row_id: Some(0),
            id: 200,
            text: "A".into(),
            question_id: Some(qid),
        },
    )
    .unwrap();
    let _opt2 = AssignmentOptionUseCase::create_assignment_option(
        &mut conn,
        AssignmentOption {
            row_id: Some(0),
            id: 201,
            text: "B".into(),
            question_id: Some(qid),
        },
    )
    .unwrap();

    // only process opt1 (update) and a new opt3, omit opt2 -> should be deleted
    let updated_list = AssignmentOptionUseCase::update_by_question_id(
        &mut conn,
        qid,
        vec![
            AssignmentOption {
                text: "A2".into(),
                ..opt1.clone()
            },
            AssignmentOption {
                row_id: Some(0),
                id: 202,
                text: "C".into(),
                question_id: Some(qid),
            },
        ],
    )
    .unwrap();

    // only 2 processed (update + create)
    assert_eq!(updated_list.len(), 2);
    assert!(updated_list.iter().any(|o| o.text == "A2"));
    assert!(updated_list.iter().any(|o| o.id == 202));

    // Verify opt2 was deleted
    let mut repo = crate::infrastructure::repositories::sqlite_assignment_option_crud_repository::SQLiteAssignmentOptionCrudRepository::new(&mut conn);
    let all = repo.get_assigment_options_by_question_id(qid).unwrap();
    assert_eq!(all.len(), 2);
    assert!(!all.iter().any(|o| o.id == 201));
}

#[test]
fn it_should_remove_all_for_question() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    AssignmentOptionUseCase::create_assignment_option(&mut conn, AssignmentOption {
        row_id: None,
        id: 1,
        text: "Option".into(),
        question_id: Some(qid),
    }).unwrap();

    let removed = AssignmentOptionUseCase::remove_all_for_question(&mut conn, qid).unwrap();
    assert_eq!(removed, 1);
}

#[test]
fn it_should_fail_on_validation_error() {
    let mut conn = get_connection();
    let q = create_question(&mut conn);
    let qid = q.id.unwrap();

    let invalid = AssignmentOption {
        row_id: None,
        id: 0, // invalid
        text: "".into(), // invalid
        question_id: Some(qid),
    };

    let result = AssignmentOptionUseCase::create_assignment_option(&mut conn, invalid);
    assert!(result.is_err());
}
