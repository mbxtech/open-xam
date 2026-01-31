use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository};
use crate::application::crud::execute_transactionally::{execute_transactionally, execute_transactionally_mut};
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

fn drop_connection() {}

#[test]
fn it_commits_on_ok_mut() {
    let mut conn = get_connection();
    let result = execute_transactionally_mut(&mut conn, |conn| {
        let mut repo = SQLiteCategoryCrudRepository::new(conn);
        let cat = Category {
            id: None,
            name: "TxCat".into(),
            created_at: None,
            updated_at: None,
        };
        repo.create(&cat).map(|_| ())
    });
    assert!(result.is_ok());

    // Verify data is persisted
    let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
    let all = repo.find_all(None).unwrap();
    drop_connection();
    assert_eq!(all.data.len(), 1);
}

#[test]
fn it_commits_on_ok() {
    let mut conn = get_connection();
    let result = execute_transactionally(&mut conn, |conn| {
        let mut repo = SQLiteCategoryCrudRepository::new(conn);
        let cat = Category {
            id: None,
            name: "TxCat".into(),
            created_at: None,
            updated_at: None,
        };
        repo.create(&cat).map(|_| ())
    });
    assert!(result.is_ok());

    // Verify data is persisted
    let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
    let all = repo.find_all(None).unwrap();
    drop_connection();
    assert_eq!(all.data.len(), 1);
}

#[test]
fn it_rolls_back_on_err() {
    let mut conn = get_connection();
    let result: Result<(), CRUDError> = execute_transactionally_mut(&mut conn, |conn| {
        let mut repo = SQLiteCategoryCrudRepository::new(conn);
        let cat = Category {
            id: None,
            name: "WillRollback".into(),
            created_at: None,
            updated_at: None,
        };
        let _ = repo.create(&cat)?;
        Err(CRUDError::new("force error", None))
    });
    assert!(result.is_err());

    // Verify nothing was committed
    let mut repo = SQLiteCategoryCrudRepository::new(&mut conn);
    let all = repo.find_all(None).unwrap();
    drop_connection();
    assert_eq!(all.data.len(), 0);
}
