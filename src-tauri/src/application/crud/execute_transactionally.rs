use crate::application::crud::crud_repository_trait::CRUDError;
use diesel::{Connection, SqliteConnection};

pub fn execute_transactionally_mut<T>(
    conn: &mut SqliteConnection,
    f: impl FnOnce(&mut SqliteConnection) -> Result<T, CRUDError>,
) -> Result<T, CRUDError> {
    conn.transaction(|conn| f(conn))
}

pub fn execute_transactionally<T>(
    conn: &mut SqliteConnection,
    f: impl FnOnce(&mut SqliteConnection) -> Result<T, CRUDError>,
) -> Result<T, CRUDError> {
    conn.transaction(|conn| f(conn))
}
