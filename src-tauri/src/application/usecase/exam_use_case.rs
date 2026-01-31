use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::application::crud::exam_repository_trait::ExamRepository;
use crate::application::crud::execute_transactionally::execute_transactionally_mut;
use crate::application::usecase::question_use_case::QuestionUseCase;
use crate::domain::model::exam::Exam;
use crate::domain::model::exam_overall_statistics::ExamOverallStatistics;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::model::question::Question;
use crate::domain::traits::validation::Validation;
use crate::domain::validation::extended_validation_error::ExtendedValidationError;
use crate::domain::validation::validation_error::ValidationError;
use crate::infrastructure::repositories::sqlite_exam_crud_repository::SQLiteExamCrudRepository;
use diesel::SqliteConnection;

const LOG_TAG: &str = "[ExamUseCase]";

pub struct ExamUseCase();

impl ExamUseCase {
    pub fn validate_exam(exam: &Exam) -> Result<(), ExtendedValidationError> {
        let mut extended_result: ExtendedValidationError =
            ExtendedValidationError::new(0, "Exam validation errors", vec![], vec![]);
        let exam_errors = exam.validate().err();
        if let Some(exam_errors) = exam_errors {
            extended_result.errors.extend(exam_errors);
        }

        exam.questions.iter().enumerate().for_each(|(index, q)| {
            let mut question_errors_vec: Vec<ValidationError> = vec![];
            let question_errors = q.validate().err();
            let validated_answer_errors = q.validate_answers().err();
            let validated_option_errors = q.validate_options(false).err();
            if let Some(question_errors) = question_errors {
                question_errors_vec.extend(question_errors);
            }
            if let Some(question_answer_errors) = validated_answer_errors {
                question_errors_vec.extend(question_answer_errors);
            }

            if let Some(option_errors) = validated_option_errors {
                question_errors_vec.extend(option_errors);
            }

            let mut question_extended_error = ExtendedValidationError::new(
                index as i32,
                format!("Question: {}", q.question_text),
                question_errors_vec,
                vec![],
            );

            q.answers.iter().enumerate().for_each(|(index, a)| {
                let answer_errors = a.validate().err();
                if let Some(answer_errors) = answer_errors {
                    question_extended_error
                        .nested_errors
                        .push(ExtendedValidationError::new(
                            index as i32,
                            format!("Answer: {}", a.answer_text),
                            answer_errors,
                            vec![],
                        ));
                }
            });

            if let Some(options) = &q.options {
                options.iter().enumerate().for_each(|(index, o)| {
                    let option_errors = o.validate().err();
                    if let Some(options_errors) = option_errors {
                        question_extended_error
                            .nested_errors
                            .push(ExtendedValidationError::new(
                                index as i32,
                                format!("Option: {}", o.text),
                                options_errors,
                                vec![],
                            ));
                    }
                });
            }

            if !question_extended_error.errors.is_empty()
                || !question_extended_error.nested_errors.is_empty()
            {
                extended_result.nested_errors.push(question_extended_error);
            }
        });

        if extended_result.errors.is_empty() && extended_result.nested_errors.is_empty() {
            Ok(())
        } else {
            Err(extended_result)
        }
    }

    pub fn get_exam_overall_statistics(
        conn: &mut SqliteConnection,
    ) -> CRUDResult<ExamOverallStatistics> {
        let mut exam_repository = SQLiteExamCrudRepository::new(conn);
        exam_repository.get_overall_statistics()
    }
    pub fn create_exam(
        conn: &mut SqliteConnection,
        exam_to_create: &mut Exam,
    ) -> Result<Exam, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            log::info!("{LOG_TAG} Creating new Exam");
            let mut exam_repository = SQLiteExamCrudRepository::new(conn);
            if cfg!(dev) {
                log::debug!("{LOG_TAG} Exam: {exam_to_create:?}");
            }
            let mut new_exam = exam_repository.create(exam_to_create)?;
            log::info!(
                "{} Created new Exam with id: {}",
                LOG_TAG,
                new_exam.id.unwrap()
            );
            let mut created_questions: Vec<Question> = vec![];
            if !exam_to_create.questions.is_empty() {
                for q in &mut exam_to_create.questions {
                    q.exam_id = Some(new_exam.id.unwrap());
                    created_questions.push(QuestionUseCase::create_question(conn, q.clone())?);
                }
                new_exam.questions = created_questions;
            }

            Ok(new_exam)
        })
    }

    pub fn find_exam_by_id(
        conn: &mut SqliteConnection,
        exam_id: i32,
    ) -> Result<Option<Exam>, CRUDError> {
        SQLiteExamCrudRepository::new(conn).find_by_id(exam_id)
    }

    pub fn find_all_exams(
        conn: &mut SqliteConnection,
        page_options: Option<PageOptions>,
    ) -> Result<PagedResult<Exam>, CRUDError> {
        SQLiteExamCrudRepository::new(conn).find_all(page_options)
    }

    pub fn update_exam(
        conn: &mut SqliteConnection,
        exam_to_update: &mut Exam,
    ) -> Result<Exam, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            log::info!(
                "{} Updating Exam with id: {}",
                LOG_TAG,
                exam_to_update.id.unwrap()
            );
            let mut exam_repository = SQLiteExamCrudRepository::new(conn);
            let mut updated_exam = exam_repository.update(exam_to_update)?;
            log::info!("{LOG_TAG} Exam was updated successfully, proceeding with questions...");
            let mut updated_questions: Vec<Question> = vec![];
            let questions_to_remove: Vec<i32> =
                QuestionUseCase::get_questions_by_exam_id(exam_to_update.id.unwrap(), None, conn)?
                    .data
                    .iter()
                    .map(|q| q.id.unwrap())
                    .filter(|id| !exam_to_update.questions.iter().any(|q| q.id == Some(*id)))
                    .collect();
            log::debug!("{} Questions to delete: {:?}", LOG_TAG, questions_to_remove);

            for to_remove in questions_to_remove {
                log::debug!("{} Removing Question with id: {}", LOG_TAG, to_remove);
                let size = QuestionUseCase::delete_question(conn, to_remove)?;
                if size == 0 {
                    log::warn!(
                        "{} Question with id: {} was not deleted",
                        LOG_TAG,
                        to_remove
                    );
                }
            }

            for q in exam_to_update.questions.iter_mut() {
                if q.id.is_none() || (q.id.is_some() && q.id.unwrap() == 0) {
                    log::info!("{}[update_exam] Creating new question for exam with id: {}", LOG_TAG, exam_to_update.id.unwrap());
                    updated_questions.push(QuestionUseCase::create_question(conn, q.clone())?);
                } else {
                    log::info!("{}[update_exam] Updating question with id: {} for exam with id: {}", LOG_TAG, q.id.unwrap(), exam_to_update.id.unwrap());
                    updated_questions.push(QuestionUseCase::update_question(conn, q)?);
                }
            }
            updated_exam.questions = updated_questions;
            Ok(updated_exam)
        })
    }

    pub fn delete_exam(conn: &mut SqliteConnection, exam_id: i32) -> Result<usize, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut exam_repository = SQLiteExamCrudRepository::new(conn);
            exam_repository.delete(exam_id)
        })
    }

    pub fn search_exams(
        conn: &mut SqliteConnection,
        filter: Vec<FilterTree>,
        page_options: Option<PageOptions>,
    ) -> Result<PagedResult<Exam>, CRUDError> {
        let mut exam_repository = SQLiteExamCrudRepository::new(conn);
        exam_repository.search(&filter, page_options)
    }

    pub fn find_by_id_with_relations(
        conn: &mut SqliteConnection,
        id: i32,
    ) -> Result<Option<Exam>, CRUDError> {
        SQLiteExamCrudRepository::new(conn).find_by_id_with_relations(id)
    }
}
