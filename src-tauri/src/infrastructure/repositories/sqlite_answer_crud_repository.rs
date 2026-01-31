use crate::application::crud::answer_repository_trait::AnswerRepository;
use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::domain::entities::answer_entity::{AnswerEntity, NewAnswer};
use crate::domain::model::answer::Answer;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::traits::validation::Validation;
use crate::pagination_repository_impl;
use diesel::ExpressionMethods;
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper, SqliteConnection};

pub struct SQLiteAnswerCrudRepository<'a> {
    conn: &'a mut SqliteConnection,
}

impl<'a> SQLiteAnswerCrudRepository<'a> {
    pub fn new(conn: &'a mut SqliteConnection) -> Self {
        Self { conn }
    }
}

impl<'a> CRUDRepository<Answer> for SQLiteAnswerCrudRepository<'a> {
    fn create(&mut self, entity: &Answer) -> CRUDResult<Answer> {
        use crate::schema::answer;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let created_answer: AnswerEntity = diesel::insert_into(answer::table)
            .values(NewAnswer::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(Answer::from(&created_answer))
    }

    fn update(&mut self, entity: &Answer) -> CRUDResult<Answer> {
        use crate::domain::entities::answer_entity::{AnswerEntity, UpdateAnswer};
        use crate::schema::answer::dsl::*;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let Some(answer_id) = entity.id else {
            return Err(CRUDError::new("Id is required to update an answer", None));
        };

        let updated_row: AnswerEntity = diesel::update(answer.find(answer_id))
            .set(UpdateAnswer::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(Answer::from(&updated_row))
    }

    fn delete(&mut self, id: i32) -> CRUDResult<usize> {
        use crate::schema::answer;
        let size = diesel::delete(answer::table)
            .filter(answer::id.eq(id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(size)
    }

    fn find_by_id(&mut self, _id: i32) -> CRUDResult<Option<Answer>> {
        use crate::schema::answer::dsl::*;

        let result = answer
            .filter(id.eq(_id))
            .limit(1)
            .select(AnswerEntity::as_select())
            .load(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        if result.is_empty() {
            return Err(CRUDError::new(
                format!("Entity with id: {_id} not found"),
                None,
            ));
        }

        if result.len() > 1 {
            return Err(CRUDError::new("More than one entry was found", None));
        }

        Ok(result.first().map(Answer::from))
    }

    fn find_all(&mut self, page_options: Option<PageOptions>) -> CRUDResult<PagedResult<Answer>> {
        pagination_repository_impl!(answer, AnswerEntity, crate::schema::answer::table);
        let result = answer::find_all(self.conn, page_options)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(PagedResult::new(
            result.data.into_iter().map(|e| Answer::from(&e)).collect(),
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}

impl<'a> AnswerRepository<Answer> for SQLiteAnswerCrudRepository<'a> {
    fn get_all_for_question(&mut self, question_id: i32) -> Result<Vec<Answer>, CRUDError> {
        use crate::schema::answer::dsl::*;
        let answer_entities = answer
            .filter(fk_question_id.eq(question_id))
            .load(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(answer_entities.iter().map(Answer::from).collect())
    }

    fn remove_all_for_question(&mut self, question_id: i32) -> Result<usize, CRUDError> {
        use crate::schema::answer::dsl::*;
        let size = diesel::delete(answer)
            .filter(fk_question_id.eq(question_id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;
        Ok(size)
    }
}
