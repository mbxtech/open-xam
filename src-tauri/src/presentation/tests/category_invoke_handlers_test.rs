use crate::domain::model::category::Category;
use crate::presentation::category_invoke_handlers::*;
use crate::presentation::tests::test_utils::{setup, teardown};
use serial_test::serial;

#[test]
#[serial]
fn test_category_invoke_handlers() {
    let db_path = setup("test_category_invoke");

    // Test create
    let category = Category {
        id: None,
        name: "Test Category".to_string(),
        created_at: None,
        updated_at: None,
    };
    let created = create_category(category).expect("Failed to create category");
    assert!(created.id.is_some());
    assert_eq!(created.name, "Test Category");

    // Test get by id
    let found = get_category_by_id(created.id.unwrap()).expect("Failed to get category");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Test Category");

    // Test update
    let mut to_update = created.clone();
    to_update.name = "Updated Category".to_string();
    let updated = update_category(to_update).expect("Failed to update category");
    assert_eq!(updated.name, "Updated Category");

    // Test get all
    let all = get_categories(None).expect("Failed to get categories");
    assert_eq!(all.data.len(), 1);

    // Test delete
    let deleted = delete_category(updated.id.unwrap()).expect("Failed to delete category");
    assert_eq!(deleted, 1);

    // Verify delete
    let found_after_delete = get_category_by_id(updated.id.unwrap());
    assert!(found_after_delete.is_err());

    teardown(db_path);
}

#[test]
#[serial]
fn test_get_category_not_found() {
    let db_path = setup("test_category_not_found");
    let result = get_category_by_id(999);
    assert!(result.is_err()); // find_by_id in repository returns error if not found
    teardown(db_path);
}

#[test]
#[serial]
fn test_get_connection_error_on_invalid_path() {
    std::env::set_var("TEST_DB_PATH", "/invalid/path/that/does/not/exist/db.sqlite");
    let result = crate::presentation::sqlite_connection::get_connection();
    assert!(result.is_err());
}
