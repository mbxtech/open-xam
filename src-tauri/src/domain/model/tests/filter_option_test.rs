use crate::domain::model::filter_option::{FilterOption, FilterValue, FilterTree};
use crate::domain::model::conjunction_type::ConjunctionType;
use crate::domain::model::operator::Operator;

#[test]
fn filter_option_contains_field_test() {
    let filter_option = FilterOption::Group {
        conjunction: ConjunctionType::And,
        filters: vec![FilterOption::Condition {
            field: "field1".to_string(),
            operator: Operator::Eq,
            value: FilterValue::Str {
                value: "value1".to_string(),
            },
        }],
    };
    assert!(filter_option.contains_field("field1"));
    assert!(!filter_option.contains_field("field2"));
}

#[test]
fn filter_option_nested_group_contains_field_test() {
    let filter_option = FilterOption::Group {
        conjunction: ConjunctionType::And,
        filters: vec![
            FilterOption::Group {
                conjunction: ConjunctionType::Or,
                filters: vec![
                    FilterOption::Condition {
                        field: "nested".to_string(),
                        operator: Operator::Eq,
                        value: FilterValue::Int { value: 1 },
                    }
                ]
            }
        ],
    };
    assert!(filter_option.contains_field("nested"));
    assert!(!filter_option.contains_field("other"));
}

#[test]
fn test_filter_tree_serialization() {
    let tree = FilterTree {
        root: FilterOption::Condition {
            field: "id".to_string(),
            operator: Operator::Eq,
            value: FilterValue::Int { value: 123 },
        },
        conjunction: Some(ConjunctionType::And),
    };
    let json = serde_json::to_string(&tree).unwrap();
    assert!(json.contains("\"field\":\"id\""));
    assert!(json.contains("\"operator\":\"EQ\""));
    assert!(json.contains("\"value\":{\"kind\":\"INT\",\"value\":123}"));
    assert!(json.contains("\"conjunction\":\"AND\""));
}

#[test]
fn test_filter_value_variants() {
    let v_str = FilterValue::Str { value: "s".into() };
    let v_int = FilterValue::Int { value: 42 };
    let v_bool = FilterValue::Bool { value: true };
    let v_str_list = FilterValue::StrList { values: vec!["a".into()] };
    let v_int_list = FilterValue::IntList { values: vec![1, 2] };

    assert_eq!(v_str, v_str.clone());
    assert_ne!(v_str, v_int);
    assert_eq!(v_int, v_int.clone());
    assert_eq!(v_bool, v_bool.clone());
    assert_eq!(v_str_list, v_str_list.clone());
    assert_eq!(v_int_list, v_int_list.clone());
}
