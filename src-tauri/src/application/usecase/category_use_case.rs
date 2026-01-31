use crate::application::crud::category_repository_trait::CategoryRepository;
use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository};
use crate::application::crud::execute_transactionally::execute_transactionally_mut;
use crate::domain::model::category::Category;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::infrastructure::repositories::sqlite_category_crud_repository::SQLiteCategoryCrudRepository;
use diesel::SqliteConnection;

pub struct CategoryUseCase();

impl CategoryUseCase {
    pub fn create_category(
        conn: &mut SqliteConnection,
        category: Category,
    ) -> Result<Category, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut category_repository = SQLiteCategoryCrudRepository::new(conn);
            category_repository.create(&category)
        })
    }
    #[allow(dead_code)]
    pub fn update_category(
        conn: &mut SqliteConnection,
        category: Category,
    ) -> Result<Category, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut category_repository = SQLiteCategoryCrudRepository::new(conn);
            category_repository.update(&category)
        })
    }

    pub fn delete_category(conn: &mut SqliteConnection, id: i32) -> Result<usize, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut category_repository = SQLiteCategoryCrudRepository::new(conn);
            category_repository.delete(id)
        })
    }

    pub fn get_all_categories(
        conn: &mut SqliteConnection,
        page_options: Option<PageOptions>,
    ) -> Result<PagedResult<Category>, CRUDError> {
        let mut category_repository = SQLiteCategoryCrudRepository::new(conn);
        category_repository.find_all(page_options)
    }

    pub fn get_category_by_id(
        conn: &mut SqliteConnection,
        id: i32,
    ) -> Result<Option<Category>, CRUDError> {
        let mut category_repository = SQLiteCategoryCrudRepository::new(conn);
        category_repository.find_by_id(id)
    }

    pub fn search(
        conn: &mut SqliteConnection,
        filter: Vec<FilterTree>,
        page_options: Option<PageOptions>,
    ) -> Result<PagedResult<Category>, CRUDError> {
        let mut category_repository = SQLiteCategoryCrudRepository::new(conn);
        category_repository.search(&filter, page_options)
    }
}
