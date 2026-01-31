use crate::schema::category;
use diesel::{AsChangeset, Identifiable, Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};
use field_names::FieldNames;

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Identifiable, Selectable, FieldNames)]
#[diesel(table_name = category)]
pub struct CategoryEntity {
    pub id: i32,
    pub name: String,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = category)]
pub struct NewCategory<'a> {
    pub name: &'a str,
    pub created_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = category)]
pub struct UpdateCategory<'a> {
    pub name: Option<&'a str>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}
