use crate::domain::entities::question_entity::QuestionEntity;
use crate::schema::answer;
use chrono::NaiveDateTime;
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(
    Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Associations, Selectable,
)]
#[diesel(table_name = answer)]
#[diesel(belongs_to(QuestionEntity, foreign_key = fk_question_id))]
pub struct AnswerEntity {
    pub id: i32,
    pub answer_text: String,
    pub description: Option<String>,
    pub is_correct: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub assigned_option_id: Option<i32>,
    pub fk_question_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = answer)]
pub struct NewAnswer<'a> {
    pub answer_text: &'a str,
    pub description: Option<&'a str>,
    pub is_correct: Option<bool>,
    pub assigned_option_id: Option<i32>,
    pub fk_question_id: i32,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = answer)]
pub struct UpdateAnswer<'a> {
    pub answer_text: Option<&'a str>,
    pub description: Option<&'a str>,
    pub is_correct: Option<bool>,
    pub assigned_option_id: Option<i32>,
    pub fk_question_id: Option<i32>,
    pub updated_at: Option<NaiveDateTime>,
}
