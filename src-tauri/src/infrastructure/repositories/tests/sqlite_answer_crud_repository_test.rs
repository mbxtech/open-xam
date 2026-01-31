#[cfg(test)]
mod answer_repository_tests {
    use crate::domain::model::question::Question;
    use crate::domain::model::question_type::QuestionType;
    use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
    use diesel::{Connection, SqliteConnection};
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
    use crate::application::crud::answer_repository_trait::AnswerRepository;
    use crate::application::crud::crud_repository_trait::CRUDRepository;
    use crate::domain::model::answer::Answer;
    use crate::infrastructure::repositories::sqlite_answer_crud_repository::SQLiteAnswerCrudRepository;

    pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

    #[test]
    fn it_should_create_answer() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let answer = Answer {
            id: None,
            answer_text: "Answer Text".to_string(),
            description: Some("Answer Text".to_string()),
            is_correct: Some(true),
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: Some(question.id.unwrap()),
        };

        let created = repo.create(&answer).unwrap();
        drop_connection();
        assert!(created.id.unwrap() > 0);
        assert_eq!(created.answer_text, "Answer Text");
        assert_eq!(created.is_correct, Some(true));
        assert!(created.created_at.is_some());
    }

    #[test]
    fn it_should_update_answer() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let mut created = repo
            .create(&Answer {
                id: None,
                answer_text: "Old 12345".to_string(),
                description: Some("Old 12345".to_string()),
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();

        created.answer_text = "New 12345".to_string();
        created.description = Some("New 12345".to_string());
        created.is_correct = Some(true);
        let updated = repo.update(&created).unwrap();
        drop_connection();
        assert_eq!(updated.answer_text, "New 12345");
        assert_eq!(updated.description, Some("New 12345".to_string()));
        assert_eq!(updated.is_correct, Some(true));
        assert!(updated.updated_at.is_some());
    }

    #[test]
    fn it_should_find_by_id_and_all() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let a1 = repo
            .create(&Answer {
                id: None,
                answer_text: "A1 12345".to_string(),
                description: Some("A1 12345".to_string()),
                is_correct: Some(true),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();
        let _a2 = repo
            .create(&Answer {
                id: None,
                answer_text: "A2 12345".to_string(),
                description: Some("A2 12345".to_string()),
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();

        let by_id = repo.find_by_id(a1.id.unwrap());
        let all = repo.find_all(None);
        drop_connection();
        assert!(by_id.is_ok());
        assert_eq!(all.unwrap().data.len(), 2);
    }

    #[test]
    fn it_should_delete_answer() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);

        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let created = repo
            .create(&Answer {
                id: None,
                answer_text: "Del 12345".to_string(),
                description: Some("Del 12345".to_string()),
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(question.id.unwrap()),
            })
            .unwrap();

        let result = repo.delete(created.id.unwrap());
        drop_connection();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);
    }

    #[test]
    fn it_should_get_all_for_question() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);
        let qid = question.id.unwrap();

        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let _ = repo
            .create(&Answer {
                id: None,
                answer_text: "A1 12345".to_string(),
                description: Some("A1 12345".to_string()),
                is_correct: Some(true),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(qid),
            })
            .unwrap();
        let _ = repo
            .create(&Answer {
                id: None,
                answer_text: "A2 12345".to_string(),
                description: Some("A2 12345".to_string()),
                is_correct: Some(false),
                assigned_option_id: None,
                created_at: None,
                updated_at: None,
                question_id: Some(qid),
            })
            .unwrap();

        let list = repo.get_all_for_question(qid).unwrap();
        drop_connection();
        assert_eq!(list.len(), 2);
    }

    #[test]
    fn it_should_remove_all_for_question() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);
        let qid = question.id.unwrap();

        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        repo.create(&Answer {
            id: None,
            answer_text: "A1 12345".to_string(),
            description: None,
            is_correct: Some(true),
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: Some(qid),
        }).unwrap();

        let deleted = repo.remove_all_for_question(qid).unwrap();
        assert_eq!(deleted, 1);
        let list = repo.get_all_for_question(qid).unwrap();
        assert_eq!(list.len(), 0);
    }

    #[test]
    fn it_should_fail_create_on_validation_error() {
        let mut conn = get_connection();
        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let answer = Answer {
            id: None,
            answer_text: "abc".to_string(),
            description: None,
            is_correct: None,
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: None,
        };
        let result = repo.create(&answer);
        assert!(result.is_err());
    }

    #[test]
    fn it_should_fail_update_on_validation_error() {
        let mut conn = get_connection();
        let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question(&mut question_repo);
        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let mut created = repo.create(&Answer {
            id: None,
            answer_text: "Valid text".to_string(),
            description: None,
            is_correct: None,
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: Some(question.id.unwrap()),
        }).unwrap();

        created.answer_text = "abc".to_string();
        let result = repo.update(&created);
        assert!(result.is_err());
    }

    #[test]
    fn it_should_fail_update_when_id_is_missing() {
        let mut conn = get_connection();
        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
        let answer = Answer {
            id: None,
            answer_text: "Valid text".to_string(),
            description: None,
            is_correct: None,
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: None,
        };
        let result = repo.update(&answer);
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("Id is required to update an answer"));
    }

    #[test]
    fn it_should_fail_find_by_id_not_found() {
        let mut conn = get_connection();
        let mut repo = SQLiteAnswerCrudRepository::new(&mut conn);
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
            exam_id: Option::from(1),
        };

        repository.create(&question).unwrap()
    }

    fn get_connection() -> SqliteConnection {
        let mut connection = SqliteConnection::establish(":memory:").unwrap();
        connection.run_pending_migrations(MIGRATIONS).unwrap();
        connection
    }

    fn drop_connection() {}
}
