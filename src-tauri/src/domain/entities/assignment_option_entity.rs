use crate::domain::entities::question_entity::QuestionEntity;
use crate::schema::assignment_option;
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(
    Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Associations, Selectable,
)]
#[diesel(table_name = assignment_option)]
#[diesel(belongs_to(QuestionEntity, foreign_key = fk_question_id))]
pub struct AssignmentOptionEntity {
    pub row_id: i32,
    pub id: i32,
    pub text: String,
    pub fk_question_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = assignment_option)]
pub struct NewAssignmentOption<'a> {
    pub id: i32,
    pub text: &'a str,
    pub fk_question_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = assignment_option)]
pub struct UpdateAssignmentOption<'a> {
    pub id: i32,
    pub text: Option<&'a str>,
    pub fk_question_id: i32,
}
