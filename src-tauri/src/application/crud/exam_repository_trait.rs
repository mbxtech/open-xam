use crate::application::crud::crud_repository_trait::{CRUDRepository, CRUDResult};
use crate::domain::entities::exam_entity::ExamEntity;
use crate::domain::model::exam::Exam;
use crate::domain::model::exam_overall_statistics::ExamOverallStatistics;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;

pub trait ExamRepository<T>: CRUDRepository<T> {
    fn get_overall_statistics(&mut self) -> CRUDResult<ExamOverallStatistics>;
    fn find_by_id_with_relations(&mut self, _id: i32) -> CRUDResult<Option<Exam>>;
    fn load_associations(&mut self, exam: &ExamEntity) -> CRUDResult<Exam>;
    fn search(
        &mut self,
        filter: &[FilterTree],
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Exam>>;
}
