use crate::domain::entities::category_entity::CategoryEntity;
use crate::schema::exam;
use chrono::NaiveDateTime;
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use field_names::FieldNames;
use serde::{Deserialize, Serialize};

#[derive(
    Debug,
    Clone,
    Serialize,
    Deserialize,
    Queryable,
    Identifiable,
    Associations,
    Selectable,
    FieldNames,
)]
#[diesel(table_name = exam)]
#[diesel(belongs_to(CategoryEntity, foreign_key = fk_category_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ExamEntity {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub duration: Option<i32>,
    pub status_type: Option<String>,
    pub points_to_succeed: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub fk_category_id: Option<i32>,
    pub max_questions_real_exam: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = exam)]
#[diesel(check_for_backend(Sqlite))]
pub struct NewExam<'a> {
    pub name: &'a str,
    pub description: &'a str,
    pub points_to_succeed: Option<i32>,
    pub duration: Option<i32>,
    pub fk_category_id: Option<i32>,
    pub status_type: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub max_questions_real_exam: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = exam)]
#[diesel(check_for_backend(Sqlite))]
pub struct UpdateExam<'a> {
    pub name: Option<&'a str>,
    pub description: Option<&'a str>,
    pub duration: Option<i32>,
    pub points_to_succeed: Option<i32>,
    pub status_type: Option<String>,
    pub fk_category_id: Option<i32>,
    pub updated_at: Option<NaiveDateTime>,
    pub max_questions_real_exam: Option<i32>,
}
