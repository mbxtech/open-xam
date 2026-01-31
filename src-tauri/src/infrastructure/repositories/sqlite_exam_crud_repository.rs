use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::application::crud::enum_converter_trait::EnumConverterTrait;
use crate::application::crud::exam_repository_trait::ExamRepository;
use crate::domain::entities::answer_entity::AnswerEntity;
use crate::domain::entities::assignment_option_entity::AssignmentOptionEntity;
use crate::domain::entities::category_entity::CategoryEntity;
use crate::domain::entities::exam_entity::ExamEntity;
use crate::domain::entities::question_entity::QuestionEntity;
use crate::domain::model::answer::Answer;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::category::Category;
use crate::domain::model::exam::Exam;
use crate::domain::model::exam_overall_statistics::ExamOverallStatistics;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::model::question::Question;
use crate::domain::model::status_type::StatusType;
use crate::domain::traits::validation::Validation;
use crate::infrastructure::filter::exam_entity_column_resolver::ExamEntityColumnResolver;
use crate::infrastructure::filter::filter_query_builder::DieselFilterExprBuilder;
use crate::pagination_repository_impl;
use crate::schema::category::dsl::category;
use diesel::dsl::count;
use diesel::prelude::*;

const LOG_TARGET: &str = "exam_crud_repository";

pub struct SQLiteExamCrudRepository<'a> {
    pub conn: &'a mut SqliteConnection,
}

impl<'a> SQLiteExamCrudRepository<'a> {
    pub fn new(conn: &'a mut SqliteConnection) -> Self {
        Self { conn }
    }
}

impl<'a> CRUDRepository<Exam> for SQLiteExamCrudRepository<'a> {
    fn create(&mut self, entity: &Exam) -> CRUDResult<Exam> {
        use crate::domain::entities::exam_entity::{ExamEntity, NewExam};
        use crate::schema::exam;

        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let created_row: ExamEntity = diesel::insert_into(exam::table)
            .values(NewExam::from(entity))
            .returning(ExamEntity::as_returning())
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let created_exam: Exam = Exam::from(&created_row);

        Ok(created_exam)
    }

    fn update(&mut self, entity: &Exam) -> CRUDResult<Exam> {
        use crate::domain::entities::exam_entity::{ExamEntity, UpdateExam};
        use crate::schema::exam::dsl::*;
        entity
            .validate()
            .map_err(|e| CRUDError::new("Validation error:", Some(e)))?;

        let Some(exam_id) = entity.id else {
            return Err(CRUDError::new("Id is required to update an exam", None));
        };

        let updated_row: ExamEntity = diesel::update(exam.find(exam_id))
            .set(UpdateExam::from(entity))
            .returning(ExamEntity::as_returning())
            .get_result(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(Exam::from(&updated_row))
    }

    fn delete(&mut self, id: i32) -> CRUDResult<usize> {
        use crate::schema::exam;
        let size = diesel::delete(exam::table)
            .filter(exam::id.eq(id))
            .execute(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        Ok(size)
    }

    fn find_by_id(&mut self, _id: i32) -> CRUDResult<Option<Exam>> {
        use crate::schema::exam::dsl::*;

        let result = exam
            .find(_id)
            .left_join(category)
            .select((ExamEntity::as_select(), Option::<CategoryEntity>::as_select()))
            .load::<(ExamEntity, Option<CategoryEntity>)>(self.conn)
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

        if let Some((exam_entity, category_entity)) = result.first() {
            let mut new_exam = self.load_associations(exam_entity)?;
            new_exam.category = category_entity.as_ref().map(|c| Category::from(c));
            return Ok(Some(new_exam));
        }

        Ok(None)
    }

    fn find_all(&mut self, page_options: Option<PageOptions>) -> CRUDResult<PagedResult<Exam>> {
        pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table, left_join: category, CategoryEntity);
        let result = exam::find_all_with_join(self.conn, page_options)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let mapped_result_with_associations: Result<Vec<Exam>, CRUDError> = result
            .data
            .into_iter()
            .map(|(e, c)| {
                let mut exam_new = self.load_associations(&e)?;
                exam_new.category = c.as_ref().map(|c| Category::from(c));
                Ok(exam_new)
            })
            .collect();

        Ok(PagedResult::new(
            mapped_result_with_associations?,
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}

fn get_status_type_count(status_type: StatusType, vec: &[(Option<String>, i64)]) -> i32 {
    vec.iter()
        .filter(|(status, _)| status == &Some(status_type.convert_to_string().to_string()))
        .map(|(_, count)| count)
        .sum::<i64>() as i32
}

impl ExamRepository<Exam> for SQLiteExamCrudRepository<'_> {
    fn get_overall_statistics(&mut self) -> CRUDResult<ExamOverallStatistics> {
        use crate::schema::exam::dsl::*;
        use crate::schema::question::dsl::*;
        allow_columns_to_appear_in_same_group_by_clause!();

        let grouped_question_count_by_exam =
            question::group_by(crate::schema::question::table, fk_exam_id)
                .select((fk_exam_id, count(crate::schema::question::id)))
                .load::<(i32, i64)>(self.conn)
                .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let question_count: i64 = grouped_question_count_by_exam
            .iter()
            .map(|(_exam_id, count)| count)
            .sum::<i64>();

        let exam_count = grouped_question_count_by_exam.len() as i32;

        let average_question_count = if exam_count > 0 {
            question_count / exam_count as i64
        } else {
            0
        };

        let succeeding_score_list = exam
            .select(points_to_succeed)
            .load::<Option<i32>>(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let succeeding_score_count = succeeding_score_list.len();
        let average_succeeding_score = if succeeding_score_count > 0 {
            succeeding_score_list.into_iter().flatten().sum::<i32>() / succeeding_score_count as i32
        } else {
            0
        };

        let grouped_exam_status = exam
            .group_by(status_type)
            .select((status_type, count(crate::schema::exam::id)))
            .load::<(Option<String>, i64)>(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let archive_count = get_status_type_count(StatusType::Archived, &grouped_exam_status);
        let active_count = get_status_type_count(StatusType::Active, &grouped_exam_status);
        let draft_count = get_status_type_count(StatusType::Draft, &grouped_exam_status);
        let inactive_count = get_status_type_count(StatusType::Inactive, &grouped_exam_status);

        Ok(ExamOverallStatistics {
            average_question_count,
            exam_count,
            average_succeeding_score,
            archive_count,
            active_count,
            draft_count,
            inactive_count,
        })
    }

    fn find_by_id_with_relations(&mut self, _id: i32) -> CRUDResult<Option<Exam>> {
        use crate::schema::exam::dsl::*;

        let result = exam
            .filter(id.eq(_id))
            .limit(1)
            .select(ExamEntity::as_select())
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

        let exam_entity_opt = result.first();
        let mut exam_option: Option<Exam> = None;
        if let Some(exam_entity) = exam_entity_opt {
            let mut new_exam = self.load_associations(exam_entity)?;
            if let Some(category_id) = exam_entity.fk_category_id {
                let category_result= category.find(category_id).load::<CategoryEntity>(self.conn).map_err(|e| CRUDError::new(e.to_string(), None))?;
                if let Some(found_category) = category_result.first() {
                    new_exam.category = Some(Category::from(found_category));
                }
            }
            exam_option = Some(new_exam);
        }

        Ok(exam_option)
    }

    fn load_associations(&mut self, exam: &ExamEntity) -> CRUDResult<Exam> {
        let questions = QuestionEntity::belonging_to(exam)
            .left_join(category)
            .load::<(QuestionEntity,Option<CategoryEntity>)>(self.conn)
            .map_err(|e| CRUDError::new(e.to_string(), None))?;

        let questions_new = questions
            .iter()
            .map(|(q, c)| {
                let answers: Vec<AnswerEntity> = AnswerEntity::belonging_to(q)
                    .load(self.conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))
                    .unwrap();
                let assigment_options: Vec<AssignmentOptionEntity> =
                    AssignmentOptionEntity::belonging_to(q)
                        .load(self.conn)
                        .map_err(|e| CRUDError::new(e.to_string(), None))
                        .unwrap();

                let mut question = Question::new(
                    Question::from(q),
                    answers.iter().map(Answer::from).collect(),
                    assigment_options
                        .iter()
                        .map(AssignmentOption::from)
                        .collect(),
                );

                if let Some(category_entity) = c {
                    question.category = Option::from(Category::from(category_entity));
                }

                question
            })
            .collect();
        let mut new_exam = Exam::from(exam);
        new_exam.questions = questions_new;
        Ok(new_exam)
    }

    fn search(
        &mut self,
        filter: &[FilterTree],
        page_options: Option<PageOptions>,
    ) -> CRUDResult<PagedResult<Exam>> {
        let available_fields = ExamEntity::field_names();
        let has_filter = available_fields.iter().any(|field| {
            filter
                .iter()
                .map(|tree| tree.root.clone())
                .any(|o| o.contains_field(field))
        });
        pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

        let result = if has_filter {
            if cfg!(dev) {
                log::debug!("{LOG_TARGET} searching with filter params")
            }
            let expr = DieselFilterExprBuilder::build_tree::<
                crate::schema::exam::table,
                ExamEntityColumnResolver,
            >(&ExamEntityColumnResolver, filter);
            exam::find_filtered(self.conn, expr, page_options)?
        } else {
            log::info!(
                "{LOG_TARGET} No filter was provided, returning all exams based on given page options"
            );
            exam::find_all(self.conn, page_options)?
        };

        let mapped_exams: Result<Vec<Exam>, CRUDError> = result
            .data
            .into_iter()
            .map(|e| self.load_associations(&e))
            .collect();

        Ok(PagedResult::new(
            mapped_exams?,
            result.total_elements,
            result.current_page,
            result.total_pages,
        ))
    }
}
