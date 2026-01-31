#[cfg(test)]
mod question_repository_tests {
    use crate::application::crud::crud_repository_trait::CRUDRepository;
    use crate::application::crud::question_repository_trait::QuestionRepository;
    use crate::domain::model::page_options::PageOptions;
    use crate::domain::model::question::Question;
    use crate::domain::model::question_type::QuestionType;
    use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
    use diesel::{Connection, SqliteConnection};
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

    pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

    #[test]
    pub fn it_should_find_paged() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);

        create_question(&mut repository);
        create_question(&mut repository);
        create_question(&mut repository);
        create_question(&mut repository);
        create_question(&mut repository);
        create_question(&mut repository);

        let result = repository.find_by_exam_id(
            1,
            Some(PageOptions {
                page: 1,
                elements_per_page: 3,
            }),
        );

        assert!(result.is_ok());
        let unboxed_result = result.unwrap();
        assert_eq!(unboxed_result.data.len(), 3);
        assert_eq!(unboxed_result.current_page, 1);
        assert_eq!(unboxed_result.total_pages, 2);
        assert_eq!(unboxed_result.total_elements, 6);
    }

    #[test]
    pub fn it_should_find_all() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);

        create_question(&mut repository);
        create_question(&mut repository);

        let result = repository.find_all(None);

        

        assert!(result.is_ok());
        let unboxed_result = result.unwrap();
        assert_eq!(unboxed_result.data.len(), 2);
    }
    #[test]
    pub fn it_should_find_by_id() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);

        create_question(&mut repository);
        create_question(&mut repository);

        let result = repository.find_by_id(2);

        

        assert!(result.is_ok());
        let unboxed_result = result.unwrap();
        assert_eq!(unboxed_result.unwrap().id.unwrap(), 2);
    }

    #[test]
    pub fn it_should_create_question() {
        use crate::domain::model::question_type::QuestionType;

        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);

        let question_result = create_question(&mut repository);
        
        assert!(question_result.id.unwrap() > 0);
        assert_eq!(question_result.question_text, "Test Question");
        assert_eq!(question_result.points_total, 100);
        assert_eq!(question_result.r#type, QuestionType::SingleChoice);
        assert_eq!(question_result.points_per_correct_answer, Some(100));
        assert!(question_result.created_at.is_some());
    }

    #[test]
    pub fn it_should_update_question() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);

        let mut created_question = create_question(&mut repository);
        created_question.question_text = "Updated Question".to_string();
        let updated_question = repository.update(&created_question).unwrap();
        
        assert_eq!(updated_question.question_text, "Updated Question");
        assert_eq!(updated_question.id.unwrap(), created_question.id.unwrap());
        assert_eq!(updated_question.points_total, 100);
        assert_eq!(updated_question.r#type, QuestionType::SingleChoice);
        assert_eq!(updated_question.points_per_correct_answer, Some(100));
        assert!(updated_question.created_at.is_some());
        assert!(updated_question.updated_at.is_some());
    }

    #[test]
    pub fn it_should_delete_question() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);

        let created_question = create_question(&mut repository);
        let result = repository.delete(created_question.id.unwrap());
        
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);
    }

    #[test]
    pub fn it_should_fail_create_on_validation_error() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);
        let mut question = create_question_struct();
        question.question_text = "abc".to_string(); // Too short
        let result = repository.create(&question);
        assert!(result.is_err());
    }

    #[test]
    pub fn it_should_fail_update_on_validation_error() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);
        let mut created = create_question(&mut repository);
        created.question_text = "abc".to_string();
        let result = repository.update(&created);
        assert!(result.is_err());
    }

    #[test]
    pub fn it_should_fail_update_when_id_is_missing() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);
        let question = create_question_struct();
        let result = repository.update(&question);
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("Id is required to update a question"));
    }

    #[test]
    pub fn it_should_fail_find_by_id_not_found() {
        let mut conn = get_connection();
        let mut repository = SQLiteQuestionCrudRepository::new(&mut conn);
        let result = repository.find_by_id(999);
        assert!(result.is_err());
    }

    fn create_question_struct() -> Question {
        Question {
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
        }
    }

    fn create_question(repository: &mut SQLiteQuestionCrudRepository) -> Question {
        let question = create_question_struct();
        let result = repository.create(&question);
        assert!(result.is_ok());
        result.unwrap()
    }

    fn get_connection() -> SqliteConnection {
        let mut connection = SqliteConnection::establish(":memory:").unwrap();
        connection.run_pending_migrations(MIGRATIONS).unwrap();
        connection
    }
    
}
