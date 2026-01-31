use crate::domain::model::conjunction_type::ConjunctionType;
use crate::domain::model::filter_option::{FilterOption, FilterTree, FilterValue};
use crate::domain::model::operator::Operator;
use diesel::expression::BoxableExpression;
use diesel::sql_types::{Bool, Nullable};
use diesel::sqlite::Sqlite;
use diesel::BoolExpressionMethods;

#[allow(dead_code)]
pub struct FilterQueryBuilder;

#[allow(dead_code)]
impl FilterQueryBuilder {
    pub fn build_where_clause(filter: &FilterOption) -> String {
        Self::build(filter)
    }

    fn build(filter: &FilterOption) -> String {
        match filter {
            FilterOption::Group {
                conjunction,
                filters,
            } => {
                let glue = match conjunction {
                    ConjunctionType::And => " AND ",
                    ConjunctionType::Or => " OR ",
                };
                let parts: Vec<String> = filters
                    .iter()
                    .map(|f| {
                        let inner = Self::build(f);
                        format!("({inner})")
                    })
                    .collect();
                parts.join(glue)
            }
            FilterOption::Condition {
                field,
                operator,
                value,
            } => Self::condition_to_sql(field, operator, value),
        }
    }

    pub fn condition_to_sql_exposed(field: &str, operator: &Operator, value: &FilterValue) -> String {
        Self::condition_to_sql(field, operator, value)
    }

    fn condition_to_sql(field: &str, operator: &Operator, value: &FilterValue) -> String {
        match operator {
            Operator::Eq => format!("{} = {}", field, Self::value_to_sql(value)),
            Operator::Ne => format!("{} <> {}", field, Self::value_to_sql(value)),
            Operator::Gt => format!("{} > {}", field, Self::value_to_sql(value)),
            Operator::Ge => format!("{} >= {}", field, Self::value_to_sql(value)),
            Operator::Lt => format!("{} < {}", field, Self::value_to_sql(value)),
            Operator::Le => format!("{} <= {}", field, Self::value_to_sql(value)),
            Operator::In => match value {
                FilterValue::StrList { values } => {
                    let list = values
                        .iter()
                        .map(|v| Self::escape_and_quote_str(v))
                        .collect::<Vec<_>>()
                        .join(", ");
                    format!("{field} IN ({list})")
                }
                FilterValue::IntList { values } => {
                    let list = values
                        .iter()
                        .map(|v| v.to_string())
                        .collect::<Vec<_>>()
                        .join(", ");
                    format!("{field} IN ({list})")
                }
                _ => panic!("IN operator requires a list value"),
            },
            Operator::Like => match value {
                FilterValue::Str { value } => format!(
                    "LOWER({}) LIKE {}",
                    field,
                    Self::quote_str(&format!("%{}%", value.to_lowercase()))
                ),
                _ => panic!("LIKE operator requires a string value"),
            },
            Operator::StartsWith => match value {
                FilterValue::Str { value } => format!(
                    "LOWER({}) LIKE {}",
                    field,
                    Self::quote_str(&format!("{}%", value.to_lowercase()))
                ),
                _ => panic!("STARTS_WITH operator requires a string value"),
            },
            Operator::EndsWith => match value {
                FilterValue::Str { value } => format!(
                    "LOWER({}) LIKE {}",
                    field,
                    Self::quote_str(&format!("%{}", value.to_lowercase()))
                ),
                _ => panic!("ENDS_WITH operator requires a string value"),
            },
        }
    }

    pub fn value_to_sql_exposed(value: &FilterValue) -> String {
        Self::value_to_sql(value)
    }

    fn value_to_sql(value: &FilterValue) -> String {
        match value {
            FilterValue::Str { value } => Self::quote_str(value),
            FilterValue::Int { value } => value.to_string(),
            FilterValue::Bool { value } => {
                if *value {
                    "1".to_string()
                } else {
                    "0".to_string()
                }
            }
            FilterValue::StrList { .. } | FilterValue::IntList { .. } => {
                panic!("Use IN operator for list values")
            }
        }
    }

    fn quote_str(s: &str) -> String {
        format!("'{}'", Self::escape_str(s))
    }
    fn escape_and_quote_str(s: &str) -> String {
        Self::quote_str(s)
    }
    pub fn escape_str_exposed(s: &str) -> String {
        Self::escape_str(s)
    }
    fn escape_str(s: &str) -> String {
        s.replace('\\', "\\\\").replace('\'', "\\'")
    }
}

pub trait FilterColumnResolver<T> {
    fn build_condition<'a>(
        &self,
        field: &str,
        operator: &Operator,
        value: &FilterValue,
    ) -> Box<dyn BoxableExpression<T, Sqlite, SqlType = Nullable<Bool>> + 'a>;
}

pub struct DieselFilterExprBuilder;

impl DieselFilterExprBuilder {
    pub fn build_boxed<'a, T: 'a, R: FilterColumnResolver<T>>(
        resolver: &R,
        filter: &FilterOption,
    ) -> Box<dyn BoxableExpression<T, Sqlite, SqlType = Nullable<Bool>> + 'a> {
        match filter {
            FilterOption::Condition {
                field,
                operator,
                value,
            } => resolver.build_condition(field, operator, value),
            FilterOption::Group {
                conjunction,
                filters,
            } => {
                let mut iter = filters
                    .iter()
                    .map(|f| Self::build_boxed::<T, R>(resolver, f));
                let first = iter.next().expect("Empty filter group is not allowed");
                iter.fold(first, |acc, next| match conjunction {
                    ConjunctionType::And => Box::new(acc.and(next)),
                    ConjunctionType::Or => Box::new(acc.or(next)),
                })
            }
        }
    }

    pub fn build_tree<'a, T: 'a, R: FilterColumnResolver<T>>(
        resolver: &R,
        tree: &[FilterTree],
    ) -> Box<dyn BoxableExpression<T, Sqlite, SqlType = Nullable<Bool>> + 'a> {
        assert!(!tree.is_empty(), "Filter tree must not be empty");

        if tree.len() > 1 {
            for (idx, node) in tree.iter().enumerate().take(tree.len() - 1) {
                assert!(
                    node.conjunction.is_some(),
                    "Only the last element may have an empty conjunction (failed at index {idx})"
                );
            }
        }

        let mut exprs = tree
            .iter()
            .map(|node| Self::build_boxed::<T, R>(resolver, &node.root));

        let first = exprs
            .next()
            .expect("Filter tree must contain at least one element");

        tree.iter().enumerate().fold(first, |acc, (idx, _)| {
            if idx == 0 {
                return acc;
            }
            let conj = tree[idx - 1].conjunction.as_ref().unwrap_or_else(|| {
                panic!(
                    "Conjunction missing at index {} (only the last element may be empty)",
                    idx - 1
                )
            });
            let next = exprs
                .next()
                .expect("Expression iterator shorter than filter tree");
            match conj {
                ConjunctionType::And => Box::new(acc.and(next)),
                ConjunctionType::Or => Box::new(acc.or(next)),
            }
        })
    }
}

