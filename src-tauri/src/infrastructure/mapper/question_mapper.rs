use crate::domain::entities::question_entity::{NewQuestion, QuestionEntity, UpdateQuestion};
use crate::domain::model::question::Question;
use crate::domain::model::question_type::QuestionType;
use chrono::Utc;
use crate::domain::model::category::Category;

pub fn question_type_to_string(question_type: &QuestionType) -> &str {
    match question_type {
        QuestionType::Assignment => "Assignment",
        QuestionType::MultipleChoice => "MultipleChoice",
        QuestionType::SingleChoice => "SingleChoice",
    }
}

pub fn question_type_to_enum(question_type: &str) -> QuestionType {
    match question_type {
        "Assignment" => QuestionType::Assignment,
        "MultipleChoice" => QuestionType::MultipleChoice,
        "SingleChoice" => QuestionType::SingleChoice,
        &_ => QuestionType::SingleChoice,
    }
}

fn extract_category_id(category: &Option<Category>) -> Option<i32> {
    if let Some(cat) = &category {
       cat.id
    } else {
        None
    }
}

impl<'a> From<&'a Question> for NewQuestion<'a> {
    fn from(value: &'a Question) -> Self {
        NewQuestion {
            question_text: &value.question_text,
            points_total: value.points_total,
            points_per_correct_answer: value.points_per_correct_answer,
            question_typ: question_type_to_string(&value.r#type),
            created_at: Some(Utc::now().naive_utc()),
            fk_exam_id: value.exam_id.expect("Exam ID is not set"),
            fk_category_id: extract_category_id(&value.category),
        }
    }
}

impl<'a> From<&'a Question> for UpdateQuestion<'a> {
    fn from(value: &'a Question) -> Self {
        UpdateQuestion {
            question_text: Some(&value.question_text),
            points_total: Some(value.points_total),
            points_per_correct_answer: value.points_per_correct_answer,
            question_typ: Some(question_type_to_string(&value.r#type)),
            fk_category_id: if let Some(cat) = &value.category {
                let id: Option<i32> = cat.id;
                Some(id.expect("Category ID is not set"))
            } else {
                None
            },
            updated_at: Some(Utc::now().naive_utc()),
        }
    }
}

impl<'a> From<&'a QuestionEntity> for Question {
    fn from(value: &'a QuestionEntity) -> Self {
        Question {
            id: Some(value.id),
            question_text: value.question_text.to_string(),
            points_total: value.points_total,
            r#type: question_type_to_enum(value.question_typ.as_str()),
            answers: vec![],
            points_per_correct_answer: value.points_per_correct_answer,
            category: None,
            created_at: value.created_at.map(|created| created.and_utc()),
            updated_at: value.updated_at.map(|updated| updated.and_utc()),
            options: None,
            exam_id: Option::from(value.fk_exam_id),
        }
    }
}

