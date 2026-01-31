use crate::application::crud::assignment_option_repository_trait::AssignmentOptionRepository;
use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository};
use crate::application::crud::execute_transactionally::{
    execute_transactionally, execute_transactionally_mut,
};
use crate::domain::model::assignment_option::AssignmentOption;
use crate::infrastructure::repositories::sqlite_assignment_option_crud_repository::SQLiteAssignmentOptionCrudRepository;
use diesel::SqliteConnection;

pub struct AssignmentOptionUseCase {}

impl AssignmentOptionUseCase {
    pub fn update_by_question_id(
        conn: &mut SqliteConnection,
        question_id: i32,
        assignment_options_to_update: Vec<AssignmentOption>,
    ) -> Result<Vec<AssignmentOption>, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut repository = SQLiteAssignmentOptionCrudRepository::new(conn);
            let existing_options = repository.get_assigment_options_by_question_id(question_id)?;
            let mut updated_options = Vec::new();

            for existing in &existing_options {
                if !assignment_options_to_update
                    .iter()
                    .any(|option| option.id == existing.id)
                {
                    if cfg!(dev) {
                        log::debug!(
                            "{} Deleting existing AssignmentOption with id: {}",
                            "AssignmentOptionUseCase",
                            existing.id
                        );
                    }
                    repository.delete(existing.id)?;
                }
            }

            let assignment_options_to_process = assignment_options_to_update
                .iter()
                .filter(|option| {
                    existing_options
                        .iter()
                        .any(|existing| {
                            existing.id == option.id || option.row_id.is_none() || option.row_id == Some(0)
                        })
                        || option.row_id.is_none()
                        || option.row_id == Some(0)
                })
                .collect::<Vec<&AssignmentOption>>();

            for option in assignment_options_to_process {
                let result = if option.row_id.is_some() && option.row_id.unwrap() > 0 && option.id > 0 {
                    repository.update(option)?
                } else {
                    repository.create(option)?
                };
                updated_options.push(result);
            }

            Ok(updated_options)
        })
    }

    pub fn create_assignment_option(
        conn: &mut SqliteConnection,
        assignment_option: AssignmentOption,
    ) -> Result<AssignmentOption, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut assignment_option_repository = SQLiteAssignmentOptionCrudRepository::new(conn);
            assignment_option_repository.create(&assignment_option)
        })
    }

    pub fn remove_all_for_question(
        conn: &mut SqliteConnection,
        question_id: i32,
    ) -> Result<usize, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut assignment_option_repository = SQLiteAssignmentOptionCrudRepository::new(conn);
            assignment_option_repository.remove_all_for_question(question_id)
        })
    }

    #[allow(dead_code)]
    pub fn update_assignment_option(
        conn: &mut SqliteConnection,
        assignment_option: AssignmentOption,
    ) -> Result<AssignmentOption, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut assignment_option_repository = SQLiteAssignmentOptionCrudRepository::new(conn);
            assignment_option_repository.update(&assignment_option)
        })
    }

    #[allow(dead_code)]
    pub fn delete_assignment_option(conn: &mut SqliteConnection, id: i32) -> Result<usize, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut assignment_option_repository = SQLiteAssignmentOptionCrudRepository::new(conn);
            assignment_option_repository.delete(id)
        })
    }
}
