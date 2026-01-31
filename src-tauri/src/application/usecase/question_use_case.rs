use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository, CRUDResult};
use crate::application::crud::execute_transactionally::execute_transactionally;
use crate::application::crud::question_repository_trait::QuestionRepository;
use crate::application::usecase::answer_use_case::AnswerUseCase;
use crate::application::usecase::assignment_option_use_case::AssignmentOptionUseCase;
use crate::domain::model::answer::Answer;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::page_options::PageOptions;
use crate::domain::model::paged_result::PagedResult;
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
use diesel::SqliteConnection;
const LOG_TAG: &str = "[QuestionUseCase]";

pub struct QuestionUseCase();

impl QuestionUseCase {
    pub fn update_question(
        conn: &mut SqliteConnection,
        question_to_update: &Question,
    ) -> Result<Question, CRUDError> {
        execute_transactionally(conn, |conn| {
            QuestionUseCase::validate_fks(question_to_update)?;
            question_to_update
                .validate_answers()
                .map_err(|e| CRUDError::new("Validation errors: ", Some(e)))?;
            question_to_update
                .validate_options(true)
                .map_err(|e| CRUDError::new("AssignmentOptions validation errors: ", Some(e)))?;

            let (old_type, existing_id) = {
                {
                    let mut question_repository = SQLiteQuestionCrudRepository::new(conn);
                    let existing_question = question_repository
                        .find_by_id(
                            question_to_update
                                .id
                                .ok_or(CRUDError::new("Question id is missing", None))?,
                        )?
                        .ok_or(CRUDError::new("Question not found", None))?;
                    (existing_question.r#type, existing_question.id.unwrap())
                }
            };

            let new_type = &question_to_update.r#type;
            let is_special_switch = (old_type == QuestionType::Assignment
                && new_type != &QuestionType::Assignment)
                || (old_type != QuestionType::Assignment && new_type == &QuestionType::Assignment);

            let mut q_to_up = question_to_update.clone();

            if is_special_switch {
                log::info!(
                    "{LOG_TAG} Question with id: {existing_id} is switching type from {old_type} to {new_type}"
                );
                log::info!("{LOG_TAG} Removing old answers and options from db, before updating to prevent inconsistency");

                let removed_assignment_options_count =
                    AssignmentOptionUseCase::remove_all_for_question(conn, existing_id)?;
                log::info!(
                    "{LOG_TAG} Removed {removed_assignment_options_count} assignment options for question with id: {existing_id}"
                );

                let removed_answers_count =
                    AnswerUseCase::remove_all_for_question(conn, existing_id)?;
                log::info!(
                    "{LOG_TAG} Removed {removed_answers_count} answers for question with id: {existing_id}"
                );

                log::info!("{LOG_TAG} Updating given answers and assignments to ensure id is not set and recognized as new");

                q_to_up.answers.iter_mut().for_each(|a| a.id = None);
                if let Some(ref mut opts) = q_to_up.options {
                    opts.iter_mut().for_each(|o| o.row_id = Some(0));
                }
            }

            let mut updated_question = SQLiteQuestionCrudRepository::new(conn).update(&q_to_up)?;

            let updated_answers =
                AnswerUseCase::update_answers_by_question_id(conn, existing_id, q_to_up.answers)?;

            let mut updated_assignment_option: Option<Vec<AssignmentOption>> = None;
            if q_to_up.options.is_some() || new_type == &QuestionType::Assignment {
                updated_assignment_option = Some(AssignmentOptionUseCase::update_by_question_id(
                    conn,
                    existing_id,
                    q_to_up.options.unwrap_or_default(),
                )?)
            }

            updated_question.answers = updated_answers;
            updated_question.options = updated_assignment_option;
            Ok(updated_question)
        })
    }

    pub fn create_question(
        conn: &mut SqliteConnection,
        question: Question,
    ) -> Result<Question, CRUDError> {
        execute_transactionally(conn, |conn| {
            QuestionUseCase::validate_fks(&question)?;
            question
                .validate_answers()
                .map_err(|e| CRUDError::new("Answer validation errors: ", Some(e)))?;
            question
                .validate_options(false)
                .map_err(|e| CRUDError::new("AssignmentOptions validation errors: ", Some(e)))?;

            let mut question_repository = SQLiteQuestionCrudRepository::new(conn);
            let mut created_question = question_repository.create(&question)?;

            let question_id = created_question.id.unwrap();

            let mut created_answers: Vec<Answer> = Vec::new();
            for mut answer in question.answers {
                answer.question_id = Some(question_id);
                created_answers.push(AnswerUseCase::create_answer(conn, answer)?)
            }

            let mut created_assignment_options: Vec<AssignmentOption> = Vec::new();
            if let Some(options) = question.options {
                for mut option in options {
                    option.question_id = Some(question_id);
                    created_assignment_options.push(
                        AssignmentOptionUseCase::create_assignment_option(conn, option)?,
                    )
                }
            }

            created_question.answers = created_answers;
            created_question.options = Some(created_assignment_options);

            Ok(created_question)
        })
    }

    pub fn get_question_by_id(
        conn: &mut SqliteConnection,
        question_id: i32,
    ) -> Result<Option<Question>, CRUDError> {
        let mut question_repository = SQLiteQuestionCrudRepository::new(conn);
        question_repository.find_by_id(question_id)
    }

    pub fn delete_question(
        conn: &mut SqliteConnection,
        question_id: i32,
    ) -> Result<usize, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut question_repository = SQLiteQuestionCrudRepository::new(conn);
            question_repository.delete(question_id)
        })
    }

    pub fn get_questions_by_exam_id(
        exam_id: i32,
        page_options: Option<PageOptions>,
        conn: &mut SqliteConnection,
    ) -> CRUDResult<PagedResult<Question>> {
        let mut question_repository = SQLiteQuestionCrudRepository::new(conn);
        question_repository.find_by_exam_id(exam_id, page_options)
    }

    fn validate_fks(question: &Question) -> Result<(), CRUDError> {
        if question.exam_id.is_none() {
            return Err(CRUDError::new("Exam id is required", None));
        }
        Ok(())
    }
}
