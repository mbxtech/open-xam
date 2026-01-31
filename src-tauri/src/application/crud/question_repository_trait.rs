use crate::application::crud::crud_repository_trait::CRUDResult;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::model::question::Question;

pub trait QuestionRepository {
    fn find_by_exam_id(
        &mut self,
        exam_id: i32,
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Question>>;
}
