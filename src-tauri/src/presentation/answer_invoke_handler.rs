use crate::{
    application::{
        crud::crud_repository_trait::CRUDError, usecase::answer_use_case::AnswerUseCase,
    },
    domain::model::answer::Answer,
    presentation::sqlite_connection::get_connection,
};

#[tauri::command]
pub fn delete_answer(id: i32) -> Result<usize, CRUDError> {
    let mut conn = get_connection()?;
    AnswerUseCase::delete_answer(&mut conn, id)
}

#[tauri::command]
pub fn update_answer(answer: Answer) -> Result<Answer, CRUDError> {
    let mut conn = get_connection()?;
    AnswerUseCase::update_answer(&mut conn, answer)
}

#[tauri::command]
pub fn create_answer(answer: Answer) -> Result<Answer, CRUDError> {
    let mut conn = get_connection()?;
    AnswerUseCase::create_answer(&mut conn, answer)
}
