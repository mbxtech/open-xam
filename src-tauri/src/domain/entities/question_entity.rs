use crate::domain::entities::category_entity::CategoryEntity;
use crate::domain::entities::exam_entity::ExamEntity;
use crate::schema::question;
use chrono::NaiveDateTime;
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(
    Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Associations, Selectable,
)]
#[diesel(table_name = question)]
#[diesel(belongs_to(ExamEntity, foreign_key = fk_exam_id))]
#[diesel(belongs_to(CategoryEntity, foreign_key = fk_category_id))]
pub struct QuestionEntity {
    pub id: i32,
    pub question_text: String,
    pub points_total: i32,
    pub points_per_correct_answer: Option<i32>,
    pub question_typ: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub fk_exam_id: i32,
    pub fk_category_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = question)]
pub struct NewQuestion<'a> {
    pub question_text: &'a str,
    pub points_total: i32,
    pub points_per_correct_answer: Option<i32>,
    pub question_typ: &'a str,
    pub created_at: Option<NaiveDateTime>,
    pub fk_exam_id: i32,
    pub fk_category_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = question)]
pub struct UpdateQuestion<'a> {
    pub question_text: Option<&'a str>,
    pub points_total: Option<i32>,
    pub points_per_correct_answer: Option<i32>,
    pub question_typ: Option<&'a str>,
    pub fk_category_id: Option<i32>,
    pub updated_at: Option<NaiveDateTime>,
}
