use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository};

pub trait AnswerRepository<T>: CRUDRepository<T> {
    fn get_all_for_question(&mut self, question_id: i32) -> Result<Vec<T>, CRUDError>;
    fn remove_all_for_question(&mut self, question_id: i32) -> Result<usize, CRUDError>;
}
