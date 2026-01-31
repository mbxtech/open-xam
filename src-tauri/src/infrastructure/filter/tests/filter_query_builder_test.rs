#[cfg(test)]
mod tests {
    use crate::domain::model::conjunction_type::ConjunctionType;
    use crate::domain::model::filter_option::{FilterOption, FilterTree, FilterValue};
    use crate::domain::model::operator::Operator;
    use crate::infrastructure::filter::filter_query_builder::{
        DieselFilterExprBuilder, FilterColumnResolver, FilterQueryBuilder,
    };
    use crate::schema::exam;
    use diesel::connection::SimpleConnection;
    use diesel::dsl;
    use diesel::expression::BoxableExpression;
    use diesel::prelude::*;
    use diesel::sql_types::{Bool, Nullable};
    use diesel::sqlite::Sqlite;
    use diesel::sqlite::SqliteConnection;

    #[test]
    fn test_all_comparison_operators() {
        let operators = vec![
            (Operator::Eq, "field = 1"),
            (Operator::Ne, "field <> 1"),
            (Operator::Gt, "field > 1"),
            (Operator::Ge, "field >= 1"),
            (Operator::Lt, "field < 1"),
            (Operator::Le, "field <= 1"),
        ];
        for (op, expected) in operators {
            let f = FilterOption::Condition {
                field: "field".into(),
                operator: op,
                value: FilterValue::Int { value: 1 },
            };
            assert_eq!(FilterQueryBuilder::build_where_clause(&f), expected);
        }
    }

    #[test]
    fn test_str_list_in() {
        let f = FilterOption::Condition {
            field: "field".into(),
            operator: Operator::In,
            value: FilterValue::StrList {
                values: vec!["a".into(), "b'c".into()],
            },
        };
        assert_eq!(
            FilterQueryBuilder::build_where_clause(&f),
            "field IN ('a', 'b\\'c')"
        );
    }

    #[test]
    fn test_simple_eq_int() {
        let f = FilterOption::Condition {
            field: "points_to_succeed".into(),
            operator: Operator::Eq,
            value: FilterValue::Int { value: 5 },
        };
        let sql = FilterQueryBuilder::build_where_clause(&f);
        assert_eq!(sql, "points_to_succeed = 5");
    }

    #[test]
    fn test_like_startswith_endswith() {
        let like = FilterOption::Condition {
            field: "LOWER(name)".into(),
            operator: Operator::Like,
            value: FilterValue::Str {
                value: "foo".into(),
            },
        };
        let sw = FilterOption::Condition {
            field: "LOWER(name)".into(),
            operator: Operator::StartsWith,
            value: FilterValue::Str {
                value: "foo".into(),
            },
        };
        let ew = FilterOption::Condition {
            field: "LOWER(name)".into(),
            operator: Operator::EndsWith,
            value: FilterValue::Str {
                value: "foo".into(),
            },
        };
        assert_eq!(
            FilterQueryBuilder::build_where_clause(&like),
            "LOWER(LOWER(name)) LIKE '%foo%'"
        );
        assert_eq!(
            FilterQueryBuilder::build_where_clause(&sw),
            "LOWER(LOWER(name)) LIKE 'foo%'"
        );
        assert_eq!(
            FilterQueryBuilder::build_where_clause(&ew),
            "LOWER(LOWER(name)) LIKE '%foo'"
        );
    }

    #[test]
    fn test_in_list() {
        let f = FilterOption::Condition {
            field: "id".into(),
            operator: Operator::In,
            value: FilterValue::IntList {
                values: vec![1, 2, 3],
            },
        };
        let sql = FilterQueryBuilder::build_where_clause(&f);
        assert_eq!(sql, "id IN (1, 2, 3)");
    }

    #[test]
    fn test_group_and_or() {
        let left = FilterOption::Condition {
            field: "points_to_succeed".into(),
            operator: Operator::Ge,
            value: FilterValue::Int { value: 10 },
        };
        let right = FilterOption::Condition {
            field: "LOWER(name)".into(),
            operator: Operator::Like,
            value: FilterValue::Str {
                value: "exam".into(),
            },
        };
        let group_and = FilterOption::Group {
            conjunction: ConjunctionType::And,
            filters: vec![left.clone(), right.clone()],
        };
        let sql_and = FilterQueryBuilder::build_where_clause(&group_and);
        assert_eq!(
            sql_and,
            "(points_to_succeed >= 10) AND (LOWER(LOWER(name)) LIKE '%exam%')"
        );

        let group_or = FilterOption::Group {
            conjunction: ConjunctionType::Or,
            filters: vec![left, right],
        };
        let sql_or = FilterQueryBuilder::build_where_clause(&group_or);
        assert_eq!(
            sql_or,
            "(points_to_succeed >= 10) OR (LOWER(LOWER(name)) LIKE '%exam%')"
        );
    }

    #[test]
    fn test_diesel_builder_or() {
        use crate::schema::exam::dsl::*;
        let mut conn = setup_conn();

        let filter = FilterOption::Group {
            conjunction: ConjunctionType::Or,
            filters: vec![
                FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Str { value: "Alpha".into() },
                },
                FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Str { value: "Beta".into() },
                },
            ],
        };

        let expr = DieselFilterExprBuilder::build_boxed::<crate::schema::exam::table, ExamResolver>(
            &ExamResolver,
            &filter,
        );
        let rows: Vec<(i32, String)> = exam
            .select((id, name))
            .filter(expr.as_ref())
            .order(id.asc())
            .load(&mut conn)
            .unwrap();

        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].1, "Alpha");
        assert_eq!(rows[1].1, "Beta");
    }

    struct ExamResolver;

    impl FilterColumnResolver<exam::table> for ExamResolver {
        fn build_condition<'a>(
            &self,
            field: &str,
            operator: &Operator,
            value: &FilterValue,
        ) -> Box<dyn BoxableExpression<exam::table, Sqlite, SqlType = Nullable<Bool>> + 'a> {
            use crate::schema::exam::dsl::*;
            match (field, operator, value) {
                ("id", Operator::Eq, FilterValue::Int { value: v }) => {
                    Box::new(id.eq(*v as i32).nullable())
                }
                ("id", Operator::In, FilterValue::IntList { values }) => Box::new(
                    id.eq_any(values.iter().map(|x| *x as i32).collect::<Vec<_>>())
                        .nullable(),
                ),
                ("name", Operator::Like, FilterValue::Str { value: s }) => {
                    Box::new(name.like(format!("%{s}%")).nullable())
                }
                ("name", Operator::StartsWith, FilterValue::Str { value: s }) => {
                    Box::new(name.like(format!("{s}%")).nullable())
                }
                ("name", Operator::EndsWith, FilterValue::Str { value: s }) => {
                    Box::new(name.like(format!("%{s}")).nullable())
                }
                ("description", Operator::Like, FilterValue::Str { value: s }) => {
                    Box::new(description.like(format!("%{s}%")).nullable())
                }
                // Fallback simple equality for strings
                ("name", Operator::Eq, FilterValue::Str { value: s }) => {
                    Box::new(name.eq(s.clone()).nullable())
                }
                _ => Box::new(dsl::sql::<Bool>("1=1").nullable()),
            }
        }
    }

    fn setup_conn() -> SqliteConnection {
        let mut conn = SqliteConnection::establish(":memory:").unwrap();
        conn.batch_execute(
            r#"
            CREATE TABLE exam (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                points_to_succeed INTEGER,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                fk_category_id INTEGER NULL,
                duration INTEGER NULL,
                status_type TEXT NULL
            );
            INSERT INTO exam (name, description, points_to_succeed) VALUES
                ('Alpha', 'First exam', 10),
                ('Beta', 'Second exam', 20),
                ('Gamma', 'Third exam', 5);
            "#,
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_diesel_builder_and_like() {
        use crate::schema::exam::dsl::*;
        let mut conn = setup_conn();

        let filter = FilterOption::Group {
            conjunction: ConjunctionType::And,
            filters: vec![
                FilterOption::Condition {
                    field: "id".into(),
                    operator: Operator::Ge,
                    value: FilterValue::Int { value: 1 },
                },
                FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Like,
                    value: FilterValue::Str { value: "a".into() },
                },
            ],
        };

        let expr = DieselFilterExprBuilder::build_boxed::<crate::schema::exam::table, ExamResolver>(
            &ExamResolver,
            &filter,
        );
        let rows: Vec<(i32, String)> = exam
            .select((id, name))
            .filter(expr.as_ref())
            .order(id.asc())
            .load(&mut conn)
            .unwrap();

        // Expect Alpha (10) and Beta (20) match Like 'a' (case-sensitive contains)
        assert_eq!(rows.len(), 3);
        assert_eq!(rows[0].1, "Alpha");
        assert_eq!(rows[1].1, "Beta");
    }

    #[test]
    fn test_builder_with_tree() {
        use crate::schema::exam::dsl::*;
        let mut conn = setup_conn();

        // First filter matches id >= 1 AND name LIKE '%a%' -> Alpha, Beta
        let filter_1 = FilterOption::Group {
            conjunction: ConjunctionType::And,
            filters: vec![
                FilterOption::Condition {
                    field: "id".into(),
                    operator: Operator::Ge,
                    value: FilterValue::Int { value: 1 },
                },
                FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Like,
                    value: FilterValue::Str { value: "a".into() },
                },
            ],
        };

        // Second filter narrows down to id = 1 AND name LIKE '%a%' -> Alpha
        let filter_2 = FilterOption::Group {
            conjunction: ConjunctionType::And,
            filters: vec![
                FilterOption::Condition {
                    field: "id".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Int { value: 1 },
                },
                FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Like,
                    value: FilterValue::Str { value: "a".into() },
                },
            ],
        };

        let tree_1 = FilterTree {
            root: filter_1,
            conjunction: Some(ConjunctionType::And),
        };
        let tree_2 = FilterTree {
            root: filter_2,
            conjunction: None,
        };
        let tree: Vec<FilterTree> = vec![tree_1, tree_2];
        // Build combined expression using build_tree
        let expr = DieselFilterExprBuilder::build_tree::<crate::schema::exam::table, ExamResolver>(
            &ExamResolver,
            &tree,
        );

        // Execute against in-memory DB
        let rows: Vec<(i32, String)> = exam
            .select((id, name))
            .filter(expr.as_ref())
            .order(id.asc())
            .load(&mut conn)
            .unwrap();

        // Expect only Alpha to remain after combining with AND
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].1, "Alpha");
    }

    #[test]
    fn test_builder_with_tree_or() {
        use crate::schema::exam::dsl::*;
        let mut conn = setup_conn();

        let tree = vec![
            FilterTree {
                root: FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Str { value: "Alpha".into() },
                },
                conjunction: Some(ConjunctionType::Or),
            },
            FilterTree {
                root: FilterOption::Condition {
                    field: "name".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Str { value: "Beta".into() },
                },
                conjunction: None,
            },
        ];
        let expr = DieselFilterExprBuilder::build_tree::<crate::schema::exam::table, ExamResolver>(
            &ExamResolver,
            &tree,
        );

        let rows: Vec<(i32, String)> = exam
            .select((id, name))
            .filter(expr.as_ref())
            .order(id.asc())
            .load(&mut conn)
            .unwrap();

        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].1, "Alpha");
        assert_eq!(rows[1].1, "Beta");
    }

    #[test]
    fn test_filter_query_builder_value_to_sql() {
        assert_eq!(FilterQueryBuilder::value_to_sql_exposed(&FilterValue::Str { value: "test".into() }), "'test'");
        assert_eq!(FilterQueryBuilder::value_to_sql_exposed(&FilterValue::Int { value: 123 }), "123");
        assert_eq!(FilterQueryBuilder::value_to_sql_exposed(&FilterValue::Bool { value: true }), "1");
        assert_eq!(FilterQueryBuilder::value_to_sql_exposed(&FilterValue::Bool { value: false }), "0");
    }

    #[test]
    #[should_panic(expected = "Use IN operator for list values")]
    fn test_filter_query_builder_value_to_sql_panic_str_list() {
        FilterQueryBuilder::value_to_sql_exposed(&FilterValue::StrList { values: vec![] });
    }

    #[test]
    #[should_panic(expected = "Use IN operator for list values")]
    fn test_filter_query_builder_value_to_sql_panic_int_list() {
        FilterQueryBuilder::value_to_sql_exposed(&FilterValue::IntList { values: vec![] });
    }

    #[test]
    fn test_filter_query_builder_escape_str() {
        assert_eq!(FilterQueryBuilder::escape_str_exposed("o'clock"), "o\\'clock");
        assert_eq!(FilterQueryBuilder::escape_str_exposed("path\\to"), "path\\\\to");
    }

    #[test]
    #[should_panic(expected = "IN operator requires a list value")]
    fn test_condition_to_sql_panic_in_not_list() {
        FilterQueryBuilder::condition_to_sql_exposed("field", &Operator::In, &FilterValue::Int { value: 1 });
    }

    #[test]
    #[should_panic(expected = "LIKE operator requires a string value")]
    fn test_condition_to_sql_panic_like_not_str() {
        FilterQueryBuilder::condition_to_sql_exposed("field", &Operator::Like, &FilterValue::Int { value: 1 });
    }

    #[test]
    #[should_panic(expected = "STARTS_WITH operator requires a string value")]
    fn test_condition_to_sql_panic_starts_with_not_str() {
        FilterQueryBuilder::condition_to_sql_exposed("field", &Operator::StartsWith, &FilterValue::Int { value: 1 });
    }

    #[test]
    #[should_panic(expected = "ENDS_WITH operator requires a string value")]
    fn test_condition_to_sql_panic_ends_with_not_str() {
        FilterQueryBuilder::condition_to_sql_exposed("field", &Operator::EndsWith, &FilterValue::Int { value: 1 });
    }

    #[test]
    #[should_panic(expected = "Empty filter group is not allowed")]
    fn test_diesel_filter_expr_builder_empty_group_panic() {
        let resolver = ExamResolver;
        let filter = FilterOption::Group {
            conjunction: ConjunctionType::And,
            filters: vec![],
        };
        let _ = DieselFilterExprBuilder::build_boxed::<crate::schema::exam::table, ExamResolver>(&resolver, &filter);
    }

    #[test]
    #[should_panic(expected = "Filter tree must not be empty")]
    fn test_diesel_filter_expr_builder_empty_tree_panic() {
        let resolver = ExamResolver;
        let tree: Vec<FilterTree> = vec![];
        let _ = DieselFilterExprBuilder::build_tree::<crate::schema::exam::table, ExamResolver>(&resolver, &tree);
    }

    #[test]
    #[should_panic(expected = "Only the last element may have an empty conjunction (failed at index 0)")]
    fn test_diesel_filter_expr_builder_missing_conjunction_panic() {
        let resolver = ExamResolver;
        let tree = vec![
            FilterTree {
                root: FilterOption::Condition {
                    field: "id".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Int { value: 1 },
                },
                conjunction: None, // Should be Some for non-last element
            },
            FilterTree {
                root: FilterOption::Condition {
                    field: "id".into(),
                    operator: Operator::Eq,
                    value: FilterValue::Int { value: 2 },
                },
                conjunction: None,
            },
        ];
        let _ = DieselFilterExprBuilder::build_tree::<crate::schema::exam::table, ExamResolver>(&resolver, &tree);
    }
}
