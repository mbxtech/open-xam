use crate::{
    application::{
        crud::crud_repository_trait::CRUDError,
        usecase::assignment_option_use_case::AssignmentOptionUseCase,
    },
    domain::model::assignment_option::AssignmentOption,
    presentation::sqlite_connection::get_connection,
};

#[tauri::command]
pub fn update_assignment_option(option: AssignmentOption) -> Result<AssignmentOption, CRUDError> {
    let mut conn = get_connection()?;
    AssignmentOptionUseCase::update_assignment_option(&mut conn, option)
}

#[tauri::command]
pub fn delete_assignment_option(id: i32) -> Result<usize, CRUDError> {
    let mut conn = get_connection()?;
    AssignmentOptionUseCase::delete_assignment_option(&mut conn, id)
}
