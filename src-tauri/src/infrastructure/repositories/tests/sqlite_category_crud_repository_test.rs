#[cfg(test)]
mod category_repository_tests {
    use crate::application::crud::crud_repository_trait::CRUDRepository;
    use crate::domain::model::category::Category;
    use crate::infrastructure::repositories::sqlite_category_crud_repository::SQLiteCategoryCrudRepository;
    use diesel::{Connection, SqliteConnection};
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

    pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

    fn get_connection() -> SqliteConnection {
        let mut connection = SqliteConnection::establish(":memory:").unwrap();
        connection.run_pending_migrations(MIGRATIONS).unwrap();
        connection
    }
    

    fn create_category(repo: &mut SQLiteCategoryCrudRepository) -> Category {
        let category = Category {
            id: None,
            name: "Networking".to_string(),
            created_at: None,
            updated_at: None,
        };
        let result = repo.create(&category);
        assert!(result.is_ok());
        result.unwrap()
    }

    #[test]
    fn it_should_create_category() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        let created = create_category(&mut repo);
        
        assert!(created.id.unwrap() > 0);
        assert_eq!(created.name, "Networking");
        assert!(created.created_at.is_some());
    }

    #[test]
    fn it_should_update_category() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        let mut created = create_category(&mut repo);
        created.name = "Updated".to_string();
        let updated = repo.update(&created).unwrap();
        
        assert_eq!(updated.id, created.id);
        assert_eq!(updated.name, "Updated");
        assert!(updated.updated_at.is_some());
    }

    #[test]
    fn it_should_delete_category() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        let created = create_category(&mut repo);
        let result = repo.delete(created.id.unwrap());
        
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);
    }

    #[test]
    fn it_should_find_all_categories() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        create_category(&mut repo);
        create_category(&mut repo);
        let result = repo.find_all(None);
        
        assert!(result.is_ok());
        assert_eq!(result.unwrap().data.len(), 2);
    }

    #[test]
    fn it_should_find_by_id_or_error_when_missing() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        let created = create_category(&mut repo);
        let found = repo.find_by_id(created.id.unwrap());
        assert!(found.is_ok());
        assert_eq!(found.unwrap().unwrap().name, "Networking");

        let not_found = repo.find_by_id(99999);
        
        assert!(not_found.is_err());
    }

    #[test]
    fn it_should_fail_create_on_validation_error() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        // "Short" is 5 chars. min_len(5) should pass for "Short".
        // Let's use "abc"
        let category = Category {
            id: None,
            name: "abc".to_string(),
            created_at: None,
            updated_at: None,
        };
        let result = repo.create(&category);
        assert!(result.is_err());
    }

    #[test]
    fn it_should_fail_update_on_validation_error() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        let mut created = create_category(&mut repo);
        created.name = "abc".to_string();
        let result = repo.update(&created);
        assert!(result.is_err());
    }

    #[test]
    fn it_should_fail_update_when_id_is_missing() {
        let mut conn = get_connection();
        let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
        let category = Category {
            id: None,
            name: "Valid Name".to_string(),
            created_at: None,
            updated_at: None,
        };
        let result = repo.update(&category);
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("Id of Category can not be null!"));
    }
}
