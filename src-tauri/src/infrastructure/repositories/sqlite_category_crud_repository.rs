use crate::application::crud::category_repository_trait::CategoryRepository;
use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::domain::entities::category_entity::CategoryEntity;
use crate::domain::model::category::Category;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::traits::validation::Validation;
use crate::infrastructure::filter::category_entity_column_resolver::CategoryEntityColumnResolver;
use crate::infrastructure::filter::filter_query_builder::DieselFilterExprBuilder;
use crate::pagination_repository_impl;
use diesel::prelude::*;

const LOG_TARGET: &str = "SQLiteCategoryCrudRepository";
pub struct SQLiteCategoryCrudRepository<'a> {
    conn: &'a mut SqliteConnection,
}

impl<'a> SQLiteCategoryCrudRepository<'a> {
    pub fn new(conn: &'a mut SqliteConnection) -> Self {
        Self { conn }
    }
}

impl<'a> CRUDRepository<Category> for SQLiteCategoryCrudRepository<'a> {
    fn create(&mut self, entity: &Category) -> CRUDResult<Category> {
        use crate::domain::entities::category_entity::{CategoryEntity, NewCategory};
        use crate::schema::category;

        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let created_row: CategoryEntity = diesel::insert_into(category::table)
            .values(NewCategory::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let category_domain: Category = Category::from(&created_row);

        Ok(category_domain)
    }

    fn update(&mut self, entity: &Category) -> CRUDResult<Category> {
        use crate::domain::entities::category_entity::{CategoryEntity, UpdateCategory};
        use crate::schema::category::dsl::*;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        if entity.id.is_none() {
            return Err(CRUDError::new("Id of Category can not be null!", None));
        }

        let updated_row: CategoryEntity = diesel::update(category.find(entity.id.unwrap()))
            .set(UpdateCategory::from(entity))
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(Category::from(&updated_row))
    }

    fn delete(&mut self, id: i32) -> CRUDResult<usize> {
        use crate::schema::category;
        let size = diesel::delete(category::table)
            .filter(category::id.eq(id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(size)
    }

    fn find_by_id(&mut self, _id: i32) -> CRUDResult<Option<Category>> {
        use crate::schema::category::dsl::*;

        let result = category
            .filter(id.eq(_id))
            .limit(1)
            .select(CategoryEntity::as_select())
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

        Ok(result.first().map(Category::from))
    }

    fn find_all(&mut self, page_options: Option<PageOptions>) -> CRUDResult<PagedResult<Category>> {
        pagination_repository_impl!(category, CategoryEntity, crate::schema::category::table);
        let result = category::find_all(self.conn, page_options)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(PagedResult::new(
            result
                .data
                .into_iter()
                .map(|e| Category::from(&e))
                .collect(),
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}

impl CategoryRepository<Category> for SQLiteCategoryCrudRepository<'_> {
    fn search(&mut self, filter: &[FilterTree], page_options: Option<PageOptions>) -> CRUDResult<PagedResult<Category>> {
        let available_fields = CategoryEntity::field_names();
        let has_filter = available_fields.iter().any(|field| {
            filter
                .iter()
                .map(|tree| tree.root.clone())
                .any(|o| o.contains_field(field))
        });
        pagination_repository_impl!(category, CategoryEntity, crate::schema::category::table);

        let result = if has_filter {
            if cfg!(dev) {
                log::debug!("{LOG_TARGET} searching with filter params")
            }
            let expr = DieselFilterExprBuilder::build_tree::<
                crate::schema::category::table,
                CategoryEntityColumnResolver,
            >(&CategoryEntityColumnResolver, filter);
            category::find_filtered(self.conn, expr, page_options)?
        } else {
            log::info!(
                "{LOG_TARGET} No filter was provided, returning all categories based on given page options"
            );
            category::find_all(self.conn, page_options)?
        };

        let mapped_categories: Vec<Category> = result
            .data
            .into_iter()
            .map(|e| Category::from(&e))
            .collect();

        Ok(PagedResult::new(
            mapped_categories,
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}