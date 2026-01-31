use crate::application::crud::crud_repository_trait::{CRUDRepository, CRUDResult};
use crate::domain::model::category::Category;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;

pub trait CategoryRepository<T>: CRUDRepository<T>  {
    fn search(
        &mut self,
        filter: &[FilterTree],
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Category>>;
}