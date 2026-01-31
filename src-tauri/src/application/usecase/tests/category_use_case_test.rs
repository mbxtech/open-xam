use crate::application::usecase::category_use_case::CategoryUseCase;
use crate::domain::model::category::Category;
use diesel::{Connection, SqliteConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

fn get_connection() -> SqliteConnection {
    let mut connection = SqliteConnection::establish(":memory:").unwrap();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
    connection
}

fn new_category(name: &str) -> Category {
    Category {
        id: None,
        name: name.to_string(),
        created_at: None,
        updated_at: None,
    }
}

#[test]
fn create_and_get_all_and_get_by_id() {
    let mut conn = get_connection();
    // create
    let created = CategoryUseCase::create_category(&mut conn, new_category("Category A"));
    assert!(created.is_ok());
    let created = created.unwrap();

    // get all
    let all = CategoryUseCase::get_all_categories(&mut conn, None).unwrap();
    assert_eq!(all.data.len(), 1);

    // get by id
    let found = CategoryUseCase::get_category_by_id(&mut conn, created.id.unwrap()).unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Category A");
}

#[test]
fn update_and_delete() {
    let mut conn = get_connection();
    let mut created =
        CategoryUseCase::create_category(&mut conn, new_category("ToUpdate")).unwrap();
    created.name = "Updated".into();

    let updated = CategoryUseCase::update_category(&mut conn, created.clone()).unwrap();
    assert_eq!(updated.name, "Updated");

    let found = CategoryUseCase::get_category_by_id(&mut conn, updated.id.unwrap()).unwrap();
    assert_eq!(found.unwrap().name, "Updated");

    let del_count = CategoryUseCase::delete_category(&mut conn, created.id.unwrap()).unwrap();
    assert_eq!(del_count, 1);
}

#[test]
fn it_should_fail_on_validation_error() {
    let mut conn = get_connection();
    let invalid = new_category("abc"); // too short
    let result = CategoryUseCase::create_category(&mut conn, invalid);
    assert!(result.is_err());
}

#[test]
fn it_should_return_err_when_not_found() {
    let mut conn = get_connection();
    let result = CategoryUseCase::get_category_by_id(&mut conn, 999);
    assert!(result.is_err());
}
