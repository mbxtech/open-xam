#[cfg(test)]
mod assignment_option_repository_tests {
    use crate::application::crud::assignment_option_repository_trait::AssignmentOptionRepository;
    use crate::application::crud::crud_repository_trait::CRUDRepository;
    use crate::domain::model::assignment_option::AssignmentOption;
    use crate::domain::model::question::Question;
    use crate::domain::model::question_type::QuestionType;
    use crate::infrastructure::repositories::sqlite_assignment_option_crud_repository::SQLiteAssignmentOptionCrudRepository;
    use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
    use diesel::{Connection, SqliteConnection};
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

    pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

    #[test]
    fn it_should_create_assignment_option() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let created = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 1,
                text: "Option A".to_string(),
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();
        assert!(created.row_id.unwrap_or(0) > 0);
        assert_eq!(created.id, 1);
        assert_eq!(created.text, "Option A");
    }

    #[test]
    fn it_should_update_assignment_option() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let mut created = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 2,
                text: "Old".to_string(),
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();

        created.text = "New".to_string();
        let updated = repo.update(&created).unwrap();
        assert_eq!(updated.text, "New");
        assert_eq!(updated.id, 2);
    }

    #[test]
    fn it_should_find_by_id_and_all() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let a1 = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 3,
                text: "O1".to_string(),
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();
        let _a2 = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 4,
                text: "O2".to_string(),
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();

        let by_id = repo.find_by_id(a1.id);
        let all = repo.find_all(None);
        assert!(by_id.is_ok());
        assert_eq!(all.unwrap().data.len(), 2);
    }

    #[test]
    fn it_should_delete_assignment_option() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let created = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 5,
                text: "Del".to_string(),
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();

        let result = repo.delete(created.id);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);
    }

    #[test]
    fn it_should_get_by_question_id() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);
        let qid = question.id.unwrap();

        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let _ = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 6,
                text: "O1".to_string(),
                question_id: Some(qid),
            })
            .unwrap();
        let _ = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 7,
                text: "O2".to_string(),
                question_id: Some(qid),
            })
            .unwrap();

        let list = repo.get_assigment_options_by_question_id(qid).unwrap();
        assert_eq!(list.len(), 2);
    }

    #[test]
    fn it_should_delete_all_for_question() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);
        let qid = question.id.unwrap();

        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let _ = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 6,
                text: "O1".to_string(),
                question_id: Some(qid),
            })
            .unwrap();
        let _ = repo
            .create(&AssignmentOption {
                row_id: Some(0),
                id: 7,
                text: "O2".to_string(),
                question_id: Some(qid),
            })
            .unwrap();

        let list = repo.get_assigment_options_by_question_id(qid).unwrap();
        assert_eq!(list.len(), 2);

        let result = repo.remove_all_for_question(qid);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 2);
    }

    #[test]
    fn it_should_fail_create_on_validation_error() {
        let mut conn = get_connection();
        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let option = AssignmentOption {
            row_id: None,
            id: 0, // id min 1
            text: "".to_string(), // text min 1
            question_id: None,
        };
        let result = repo.create(&option);
        assert!(result.is_err());
    }

    #[test]
    fn it_should_fail_update_on_validation_error() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);
        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let mut created = repo.create(&AssignmentOption {
            row_id: None,
            id: 1,
            text: "Valid".to_string(),
            question_id: Some(question.id.unwrap()),
        }).unwrap();

        created.text = "".to_string();
        let result = repo.update(&created);
        assert!(result.is_err());
    }

    #[test]
    fn it_should_fail_update_when_row_id_is_missing() {
        let mut conn = get_connection();
        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let option = AssignmentOption {
            row_id: None,
            id: 1,
            text: "Valid".to_string(),
            question_id: None,
        };
        let result = repo.update(&option);
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("row_id is required for update"));
    }

    #[test]
    fn it_should_fail_find_by_id_not_found() {
        let mut conn = get_connection();
        let mut repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
        let result = repo.find_by_id(999);
        assert!(result.is_err());
    }

    fn create_question(repository: &mut SQLiteQuestionCrudRepository) -> Question {
        let question = Question {
            id: None,
            question_text: "Test Question".to_string(),
            points_total: 100,
            r#type: QuestionType::SingleChoice,
            answers: vec![],
            points_per_correct_answer: Some(100),
            category: None,
            created_at: None,
            updated_at: None,
            options: None,
            exam_id: Some(1),
        };

        repository.create(&question).unwrap()
    }

    fn get_connection() -> SqliteConnection {
        let mut connection = SqliteConnection::establish(":memory:").unwrap();
        connection.run_pending_migrations(MIGRATIONS).unwrap();
        connection
    }

}
