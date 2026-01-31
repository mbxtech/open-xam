use crate::application::crud::crud_repository_trait::CRUDError;
use crate::application::usecase::category_use_case::CategoryUseCase;
use crate::domain::model::category::Category;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::presentation::sqlite_connection::get_connection;

#[tauri::command]
pub fn get_categories(
    page_options: Option<PageOptions>,
) -> Result<PagedResult<Category>, CRUDError> {
    let mut conn = get_connection()?;
    CategoryUseCase::get_all_categories(&mut conn, page_options)
}

#[tauri::command]
pub fn create_category(category_to_create: Category) -> Result<Category, CRUDError> {
    let mut conn = get_connection()?;
    CategoryUseCase::create_category(&mut conn, category_to_create)
}

#[tauri::command]
pub fn update_category(category_to_update: Category) -> Result<Category, CRUDError> {
    let mut conn = get_connection()?;
    CategoryUseCase::update_category(&mut conn, category_to_update)
}

#[tauri::command]
pub fn delete_category(id: i32) -> Result<usize, CRUDError> {
    let mut conn = get_connection()?;
    CategoryUseCase::delete_category(&mut conn, id)
}

#[tauri::command]
pub fn get_category_by_id(id: i32) -> Result<Option<Category>, CRUDError> {
    let mut conn = get_connection()?;
    CategoryUseCase::get_category_by_id(&mut conn, id)
}

#[tauri::command]
pub fn search_categories(
    filter: Vec<FilterTree>,
    page_options: Option<PageOptions>,
) -> Result<PagedResult<Category>, CRUDError> {
    let mut conn = get_connection()?;
    CategoryUseCase::search(&mut conn, filter, page_options)
}
