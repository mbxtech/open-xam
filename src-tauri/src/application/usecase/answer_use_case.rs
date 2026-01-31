use crate::application::crud::answer_repository_trait::AnswerRepository;
use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository};
use crate::application::crud::execute_transactionally::{
    execute_transactionally, execute_transactionally_mut,
};
use crate::domain::model::answer::Answer;
use crate::infrastructure::repositories::sqlite_answer_crud_repository::SQLiteAnswerCrudRepository;
use diesel::SqliteConnection;

const LOG_TAG: &str = "[AnswerUseCase]";
pub struct AnswerUseCase();

impl AnswerUseCase {
    pub fn update_answers_by_question_id(
        conn: &mut SqliteConnection,
        question_id: i32,
        answers: Vec<Answer>,
    ) -> Result<Vec<Answer>, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut answer_repository = SQLiteAnswerCrudRepository::new(conn);
            let answers_for_questions: Vec<Answer> =
                answer_repository.get_all_for_question(question_id)?;
            log::info!(
                "{LOG_TAG}[update_answers_by_question_id] updating answers for question with id: {question_id}"
            );

            let answers_to_delete: Vec<&Answer> = answers_for_questions
                .iter()
                .filter(|existing_answer| {
                    !answers
                        .iter()
                        .any(|answer_to_update| answer_to_update.id == existing_answer.id)
                })
                .collect();

            log::info!(
                "{}[update_answers_by_question_id] deleting {:?} answers",
                LOG_TAG,
                answers_to_delete.len()
            );
            for answer_to_delete in answers_to_delete.iter() {
                answer_repository.delete(answer_to_delete.id.unwrap())?;
            }

            let mut updated_answers = Vec::new();
            let answers_to_process: Vec<Answer> = answers
                .into_iter()
                .filter(|existing_answer| {
                    answers_for_questions.iter().any(|answer_to_update| {
                        answer_to_update.id == existing_answer.id || existing_answer.id.is_none()
                    }) || existing_answer.id.is_none()
                })
                .collect();

            for mut answer in answers_to_process {
                if let Some(id) = answer.id {
                    log::info!(
                        "{LOG_TAG}[update_answers_by_question_id] updating answer with id: {id:?}"
                    );
                    updated_answers.push(answer_repository.update(&answer)?);
                } else {
                    log::info!("{LOG_TAG}[update_answers_by_question_id] creating new answer");
                    answer.question_id = Some(question_id);
                    updated_answers.push(answer_repository.create(&answer)?);
                }
            }

            log::info!("{LOG_TAG}[update_answers_by_question_id] successfully updated answers");

            Ok(updated_answers)
        })
    }

    pub fn create_answer(conn: &mut SqliteConnection, answer: Answer) -> Result<Answer, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut answer_repository = SQLiteAnswerCrudRepository::new(conn);
            answer_repository.create(&answer)
        })
    }

    pub fn remove_all_for_question(
        conn: &mut SqliteConnection,
        question_id: i32,
    ) -> Result<usize, CRUDError> {
        execute_transactionally(conn, |conn| {
            let mut answer_repository = SQLiteAnswerCrudRepository::new(conn);
            answer_repository.remove_all_for_question(question_id)
        })
    }

    #[allow(dead_code)]
    pub fn update_answer(conn: &mut SqliteConnection, answer: Answer) -> Result<Answer, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut answer_repository = SQLiteAnswerCrudRepository::new(conn);
            answer_repository.update(&answer)
        })
    }

    #[allow(dead_code)]
    pub fn delete_answer(conn: &mut SqliteConnection, answer_id: i32) -> Result<usize, CRUDError> {
        execute_transactionally_mut(conn, |conn| {
            let mut answer_repository = SQLiteAnswerCrudRepository::new(conn);
            answer_repository.delete(answer_id)
        })
    }
}
