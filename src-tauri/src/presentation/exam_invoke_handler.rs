use crate::application::crud::crud_repository_trait::CRUDError;
use crate::application::usecase::exam_use_case::ExamUseCase;
use crate::domain::model::exam::Exam;
use crate::domain::model::exam_overall_statistics::ExamOverallStatistics;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::validation::extended_validation_error::ExtendedValidationError;
use crate::presentation::sqlite_connection::get_connection;

#[tauri::command]
pub fn search_exams(
    filter: Vec<FilterTree>,
    page_options: Option<PageOptions>,
) -> Result<PagedResult<Exam>, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::search_exams(&mut conn, filter, page_options)
}

#[tauri::command]
pub fn create_exam(mut exam_to_create: Exam) -> Result<Exam, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::create_exam(&mut conn, &mut exam_to_create)
}

#[tauri::command]
pub fn get_exam(id: i32) -> Result<Option<Exam>, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::find_exam_by_id(&mut conn, id)
}

#[tauri::command]
pub fn get_exams(page_options: Option<PageOptions>) -> Result<PagedResult<Exam>, CRUDError> {
    let mut conn = get_connection()?;

    ExamUseCase::find_all_exams(&mut conn, page_options)
}

#[tauri::command]
pub fn update_exam(mut exam_to_update: Exam) -> Result<Exam, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::update_exam(&mut conn, &mut exam_to_update)
}

#[tauri::command]
pub fn delete_exam(id: i32) -> Result<usize, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::delete_exam(&mut conn, id)
}

#[tauri::command]
pub fn find_exam_with_relations(id: i32) -> Result<Option<Exam>, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::find_by_id_with_relations(&mut conn, id)
}

#[tauri::command]
pub fn get_exam_overall_statistics() -> Result<ExamOverallStatistics, CRUDError> {
    let mut conn = get_connection()?;
    ExamUseCase::get_exam_overall_statistics(&mut conn)
}

#[tauri::command]
pub fn validate_exam(exam: Exam) -> Result<(), ExtendedValidationError> {
    ExamUseCase::validate_exam(&exam)
}
