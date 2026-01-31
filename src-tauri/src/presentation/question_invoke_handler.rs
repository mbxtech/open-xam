use crate::application::crud::crud_repository_trait::CRUDError;
use crate::application::usecase::question_use_case::QuestionUseCase;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::model::question::Question;
use crate::presentation::sqlite_connection::get_connection;

#[tauri::command]
pub fn create_question(question_to_create: Question) -> Result<Question, CRUDError> {
    let mut conn = get_connection()?;
    QuestionUseCase::create_question(&mut conn, question_to_create)
}

#[tauri::command]
pub fn get_question(id: i32) -> Result<Option<Question>, CRUDError> {
    let mut conn = get_connection()?;
    QuestionUseCase::get_question_by_id(&mut conn, id)
}

#[tauri::command]
pub fn get_questions_by_exam_id(
    exam_id: i32,
    page_options: Option<PageOptions>,
) -> Result<PagedResult<Question>, CRUDError> {
    let mut conn = get_connection()?;
    QuestionUseCase::get_questions_by_exam_id(exam_id, page_options, &mut conn)
}

#[tauri::command]
pub fn update_question(question_to_update: Question) -> Result<Question, CRUDError> {
    let mut conn = get_connection()?;
    QuestionUseCase::update_question(&mut conn, &question_to_update)
}

#[tauri::command]
pub fn delete_question(id: i32) -> Result<usize, CRUDError> {
    let mut conn = get_connection()?;
    QuestionUseCase::delete_question(&mut conn, id)
}
