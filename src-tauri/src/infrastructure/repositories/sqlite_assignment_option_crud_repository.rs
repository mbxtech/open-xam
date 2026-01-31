use crate::application::crud::assignment_option_repository_trait::AssignmentOptionRepository;
use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::domain::entities::assignment_option_entity::AssignmentOptionEntity;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::traits::validation::Validation;
use crate::pagination_repository_impl;
use diesel::prelude::*;

const LOG_TAG: &str = "sqlite_assignment_option_crud_repository";

pub struct SQLiteAssignmentOptionCrudRepository<'a> {
    conn: &'a mut SqliteConnection,
}

impl<'a> SQLiteAssignmentOptionCrudRepository<'a> {
    pub fn new(conn: &'a mut SqliteConnection) -> Self {
        Self { conn }
    }
}

impl<'a> CRUDRepository<AssignmentOption> for SQLiteAssignmentOptionCrudRepository<'a> {
    fn create(&mut self, entity: &AssignmentOption) -> CRUDResult<AssignmentOption> {
        use crate::domain::entities::assignment_option_entity::{
            AssignmentOptionEntity, NewAssignmentOption,
        };
        use crate::schema::assignment_option;

        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let created_row: AssignmentOptionEntity = diesel::insert_into(assignment_option::table)
            .values(NewAssignmentOption::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let created_assignment_option: AssignmentOption = AssignmentOption::from(&created_row);

        Ok(created_assignment_option)
    }

    fn update(&mut self, entity: &AssignmentOption) -> CRUDResult<AssignmentOption> {
        use crate::domain::entities::assignment_option_entity::{
            AssignmentOptionEntity, UpdateAssignmentOption,
        };
        use crate::schema::assignment_option::dsl::*;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let Some(row_id_val) = entity.row_id else {
            return Err(CRUDError::new("row_id is required for update", None));
        };

        let updated_row: AssignmentOptionEntity =
            diesel::update(assignment_option.find(row_id_val))
                .set(UpdateAssignmentOption::from(entity))
                .get_result(self.conn)
                .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(AssignmentOption::from(&updated_row))
    }

    fn delete(&mut self, id: i32) -> CRUDResult<usize> {
        use crate::schema::assignment_option;
        let size = diesel::delete(assignment_option::table)
            .filter(assignment_option::id.eq(id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(size)
    }

    fn find_by_id(&mut self, _id: i32) -> CRUDResult<Option<AssignmentOption>> {
        use crate::schema::assignment_option::dsl::*;

        let result = assignment_option
            .filter(id.eq(_id))
            .limit(1)
            .select(AssignmentOptionEntity::as_select())
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

        Ok(result.first().map(AssignmentOption::from))
    }

    fn find_all(
        &mut self,
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<AssignmentOption>> {
        pagination_repository_impl!(
            assignment_option,
            AssignmentOptionEntity,
            crate::schema::assignment_option::table
        );
        let result = assignment_option::find_all(self.conn, page_options)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(PagedResult::new(
            result
                .data
                .into_iter()
                .map(|e| AssignmentOption::from(&e))
                .collect(),
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}

impl<'a> AssignmentOptionRepository<AssignmentOption> for SQLiteAssignmentOptionCrudRepository<'a> {
    fn get_assigment_options_by_question_id(
        &mut self,
        question_id: i32,
    ) -> Result<Vec<AssignmentOption>, CRUDError> {
        use crate::schema::assignment_option::dsl::*;
        let assignment_option_entities = assignment_option
            .filter(fk_question_id.eq(question_id))
            .load::<AssignmentOptionEntity>(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;
        Ok(assignment_option_entities
            .iter()
            .map(AssignmentOption::from)
            .collect())
    }

    fn remove_all_for_question(&mut self, question_id: i32) -> Result<usize, CRUDError> {
        use crate::schema::assignment_option::dsl::*;
        let size: usize = diesel::delete(assignment_option)
            .filter(fk_question_id.eq(question_id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;
        if size == 0 {
            log::info!(
                "{LOG_TAG} No assignment options where removed for question with id: {question_id}"
            );
        }
        Ok(size)
    }
}