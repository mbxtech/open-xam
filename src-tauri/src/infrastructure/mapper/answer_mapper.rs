use crate::domain::entities::answer_entity::{AnswerEntity, NewAnswer, UpdateAnswer};
use crate::domain::model::answer::Answer;
use chrono::Utc;

impl<'a> From<&'a Answer> for NewAnswer<'a> {
    fn from(value: &'a Answer) -> Self {
        NewAnswer {
            answer_text: value.answer_text.as_str(),
            description: value.description.as_deref(),
            is_correct: value.is_correct,
            assigned_option_id: value.assigned_option_id,
            fk_question_id: value.question_id.expect("question_id is required for NewAnswer"),
            created_at: Some(Utc::now().naive_utc()),
        }
    }
}

impl<'a> From<&'a Answer> for UpdateAnswer<'a> {
    fn from(value: &'a Answer) -> Self {
        UpdateAnswer {
            answer_text: Some(value.answer_text.as_str()),
            description: value.description.as_deref(),
            is_correct: value.is_correct,
            assigned_option_id: value.assigned_option_id,
            fk_question_id: value.question_id,
            updated_at: Some(Utc::now().naive_utc()),
        }
    }
}

impl<'a> From<&'a AnswerEntity> for Answer {
    fn from(value: &'a AnswerEntity) -> Self {
        Answer {
            id: Some(value.id),
            answer_text: value.answer_text.to_string(),
            description: value.description.clone(),
            is_correct: value.is_correct,
            assigned_option_id: value.assigned_option_id,
            created_at: value.created_at.map(|created| created.and_utc()),
            updated_at: value.updated_at.map(|updated_at| updated_at.and_utc()),
            question_id: Some(value.fk_question_id),
        }
    }
}

