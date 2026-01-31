use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::application::crud::question_repository_trait::QuestionRepository;
use crate::domain::entities::category_entity::CategoryEntity;
use crate::domain::entities::question_entity::{NewQuestion, QuestionEntity};
use crate::domain::model::category::Category;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::model::question::Question;
use crate::domain::traits::validation::Validation;
use crate::pagination_repository_impl;
use crate::schema::question::fk_exam_id;
use diesel::{ExpressionMethods, NullableExpressionMethods};
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper, SqliteConnection};

pub struct SQLiteQuestionCrudRepository<'a> {
    conn: &'a mut SqliteConnection,
}

impl<'a> SQLiteQuestionCrudRepository<'a> {
    pub fn new(conn: &'a mut SqliteConnection) -> Self {
        Self { conn }
    }
}

impl<'a> CRUDRepository<Question> for SQLiteQuestionCrudRepository<'a> {
    fn create(&mut self, entity: &Question) -> CRUDResult<Question> {
        use crate::schema::question;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let created_question: QuestionEntity = diesel::insert_into(question::table)
            .values(NewQuestion::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(Question::from(&created_question))
    }

    fn update(&mut self, entity: &Question) -> CRUDResult<Question> {
        use crate::domain::entities::question_entity::{QuestionEntity, UpdateQuestion};
        use crate::schema::question::dsl::*;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let Some(question_id) = entity.id else {
            return Err(CRUDError::new("Id is required to update a question", None));
        };

        let updated_row: QuestionEntity = diesel::update(question.find(question_id))
            .set(UpdateQuestion::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(Question::from(&updated_row))
    }

    fn delete(&mut self, id: i32) -> CRUDResult<usize> {
        use crate::schema::question;
        let size = diesel::delete(question::table)
            .filter(question::id.eq(id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(size)
    }

    fn find_by_id(&mut self, _id: i32) -> CRUDResult<Option<Question>> {
        use crate::schema::question::dsl::*;

        let result = question
            .filter(id.eq(_id))
            .limit(1)
            .select(QuestionEntity::as_select())
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

        Ok(result.first().map(Question::from))
    }

    fn find_all(&mut self, page_options: Option<PageOptions>) -> CRUDResult<PagedResult<Question>> {
        pagination_repository_impl!(question, QuestionEntity, crate::schema::question::table);
        let result = question::find_all(self.conn, page_options)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(PagedResult::new(
            result
                .data
                .into_iter()
                .map(|e| Question::from(&e))
                .collect(),
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}

impl<'a> QuestionRepository for SQLiteQuestionCrudRepository<'a> {
    fn find_by_exam_id(
        &mut self,
        exam_id: i32,
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Question>> {
        pagination_repository_impl!(question, QuestionEntity, crate::schema::question::table, left_join: category, CategoryEntity);
        let result = question::find_filtered_with_join(
            self.conn,
            Box::new(fk_exam_id.eq(exam_id).nullable()),
            page_options,
        )
        .map_err(|e| CRUDError::new(e.to_string(), None))?;
        Ok(PagedResult::new(
            result
                .data
                .into_iter()
                .map(|(q, c)| {
                    let mut question = Question::from(&q);
                    question.category = c.as_ref().map(|c| Category::from(c));
                    question
                })
                .collect(),
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}
