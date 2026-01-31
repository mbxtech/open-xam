pub(crate) mod answer_invoke_handler_test;
pub(crate) mod assignment_option_invoke_handler_test;
pub(crate) mod category_invoke_handlers_test;
pub(crate) mod exam_invoke_handler_test;
pub(crate) mod question_invoke_handler_test;

#[cfg(test)]
pub mod test_utils {
    use diesel::prelude::*;
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
    use std::fs;

    pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

    pub fn setup(test_name: &str) -> String {
        let n = std::time::SystemTime::now()
            .duration_since(std::time::SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let db_path = format!("./test-db/{}_{}.db", test_name, n);
        std::env::set_var("TEST_DB_PATH", &db_path);
        {
            let mut conn = SqliteConnection::establish(&db_path).unwrap();
            conn.run_pending_migrations(MIGRATIONS).unwrap();
        }
        db_path
    }

    pub fn teardown(db_path: String) {
        let _ = fs::remove_file(db_path);
    }
}
