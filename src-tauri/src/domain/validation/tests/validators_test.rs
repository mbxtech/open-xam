use crate::domain::validation::validators::*;
use regex::Regex;

#[test]
fn test_optional_with_some_value() {
    let rule = |x: &i32| {
        if *x < 0 {
            Some("negative".into())
        } else {
            None
        }
    };
    let validator = optional(rule);
    assert_eq!(validator(&Some(-1)), Some("negative".into()));
    assert_eq!(validator(&Some(1)), None);
}

#[test]
fn test_optional_with_none() {
    let rule = |x: &i32| {
        if *x < 0 {
            Some("negative".into())
        } else {
            None
        }
    };
    let validator = optional(rule);
    assert_eq!(validator(&None), None);
}

#[test]
fn test_str_required() {
    let validator = str_rules::required();
    assert_eq!(validator(&"".to_string()), Some("must be provided".into()));
    assert_eq!(validator(&" ".to_string()), Some("must be provided".into()));
    assert_eq!(validator(&"value".to_string()), None);
}

#[test]
fn test_str_min_len() {
    let validator = str_rules::min_len(3);
    assert_eq!(
        validator(&"ab".to_string()),
        Some("length must be at least 3".into())
    );
    assert_eq!(validator(&"abc".to_string()), None);
}

#[test]
fn test_str_max_len() {
    let validator = str_rules::max_len(3);
    assert_eq!(
        validator(&"abcd".to_string()),
        Some("length must be at most 3".into())
    );
    assert_eq!(validator(&"abc".to_string()), None);
}

#[test]
fn test_str_pattern() {
    let regex = Regex::new(r"^\d{3}$").unwrap();
    let validator = str_rules::pattern(regex);
    assert_eq!(
        validator(&"abc".to_string()),
        Some("must match pattern ^\\d{3}$".into())
    );
    assert_eq!(validator(&"123".to_string()), None);
}

#[test]
fn test_num_min() {
    let validator = num_rules::min(0);
    assert_eq!(validator(&-1), Some("must be >= 0".into()));
    assert_eq!(validator(&0), None);
    assert_eq!(validator(&1), None);
}

#[test]
fn test_num_max() {
    let validator = num_rules::max(100);
    assert_eq!(validator(&101), Some("must be <= 100".into()));
    assert_eq!(validator(&100), None);
    assert_eq!(validator(&99), None);
}

#[test]
fn test_bool_must_be_true() {
    let validator = bool_rules::must_be_true();
    assert_eq!(validator(&false), Some("must be true".into()));
    assert_eq!(validator(&true), None);
}
