use crate::application::crud::crud_repository_trait::CRUDError;
use diesel::{Connection, RunQueryDsl, SqliteConnection};
use std::fs;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

pub fn get_connection() -> Result<SqliteConnection, CRUDError> {
    let mut db_path = String::from(":memory:");
    log::info!("Start connecting to database");

    if cfg!(test) {
        db_path = std::env::var("TEST_DB_PATH").unwrap_or_else(|_| ":memory:".to_string());
    } else if cfg!(dev) {
        let current_dir =
            std::env::current_dir().map_err(|e| CRUDError::new(e.to_string(), None))?;

        let Some(current_dir) = current_dir.as_path().parent() else {
            return Err(CRUDError::new(
                "Failed to establish db connection: unable to determine parent directory",
                None,
            ));
        };

        let current_dir = format!("{}/{}/exam-sim.db", current_dir.display(), "db");

        log::info!("Connecting to development database: {}", current_dir);
        db_path = current_dir;
    } else {
        log::info!("Connecting to production database: {}", db_path);
        let Some(home_path) = dirs::home_dir() else {
            let err = "Failed to establish db connection: unable to resolve home directory";
            log::error!("{}", err);
            return Err(CRUDError::new(err, None));
        };

        if !fs::exists(format!("{}/.open-xam/db/open-xam.db", home_path.display()))
            .map_err(|e| CRUDError::new(e.to_string(), None))?
        {
            log::info!(
                "Database does not exist, creating it, to directory: {}/.open-xam",
                home_path.display()
            );
            fs::create_dir(format!("{}/.open-xam", home_path.display()))
                .map_err(|e| CRUDError::new(e.to_string(), None))?;
            fs::create_dir(format!("{}/.open-xam/db", home_path.display())).map_err(|e| {
                log::error!("Failed to create db directory: {}", e.to_string());
                CRUDError::new(e.to_string(), None)
            })?;
            let _ = fs::File::create(format!("{}/.open-xam/db/open-xam.db", home_path.display()))
                .map_err(|e| CRUDError::new(e.to_string(), None))?;
            log::info!("Database created successfully");
        }

        db_path = format!("{}/.open-xam/db/open-xam.db", home_path.display());
    }

    let mut conn = SqliteConnection::establish(&db_path).map_err(|e| {
        CRUDError::new(
            format!("Unable to connect to database: {}", e.to_string()),
            None,
        )
    })?;
    
    conn.run_pending_migrations(MIGRATIONS).map_err(|e| {
        CRUDError::new(format!("Unable to run pending migrations: {}", e.to_string()), None)
    })?;

    log::info!("Database connection established successfully, turning on foreign keys");

    diesel::sql_query("PRAGMA foreign_keys = ON;")
        .execute(&mut conn)
        .map_err(|e| {
            CRUDError::new(
                format!("Unable to set foreign_keys = ON :{}", e.to_string()),
                None,
            )
        })?;

    log::info!("Foreign keys turned on successfully");
    Ok(conn)
}
