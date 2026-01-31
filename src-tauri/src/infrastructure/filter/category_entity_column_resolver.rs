use crate::domain::model::filter_option::FilterValue;
use crate::domain::model::operator::Operator;
use crate::infrastructure::filter::filter_query_builder::FilterColumnResolver;
use crate::schema::category;
use diesel::sql_types::{Bool, Nullable};
use diesel::sqlite::Sqlite;
use diesel::{dsl, BoxableExpression, ExpressionMethods, NullableExpressionMethods, TextExpressionMethods};

pub struct CategoryEntityColumnResolver;
impl FilterColumnResolver<category::table> for CategoryEntityColumnResolver {
    fn build_condition<'a>(&self, field: &str, operator: &Operator, value: &FilterValue) -> Box<dyn BoxableExpression<category::table, Sqlite, SqlType=Nullable<Bool>> + 'a> {
    use crate::schema::category::dsl::*;
        match (field, operator, value) {
            ("id", Operator::Eq, FilterValue::Int {value: v}) => {
                Box::new(id.eq(*v as i32).nullable())
            }
            ("name", Operator::Like, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("%{s}%")).nullable())
            }
            ("name", Operator::StartsWith, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("{s}%")).nullable())
            }
            ("name", Operator::EndsWith, FilterValue::Str { value: s }) => {
                Box::new(name.like(format!("%{s}")).nullable())
            }
            ("name", Operator::Eq, FilterValue::Str { value: s }) => {
                Box::new(name.eq(s.clone()).nullable())
            }
            _ => Box::new(dsl::sql::<Bool>("1=1").nullable())
        }
    
    }
}