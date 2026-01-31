use crate::domain::model::conjunction_type::ConjunctionType;

#[test]
fn test_conjunction_type_serialization() {
    assert_eq!(serde_json::to_string(&ConjunctionType::And).unwrap(), "\"AND\"");
    assert_eq!(serde_json::to_string(&ConjunctionType::Or).unwrap(), "\"OR\"");
}

#[test]
fn test_conjunction_type_equality() {
    assert_eq!(ConjunctionType::And, ConjunctionType::And);
    assert_ne!(ConjunctionType::And, ConjunctionType::Or);
}

#[test]
fn test_conjunction_type_clone_and_debug() {
    let c = ConjunctionType::And;
    let c2 = c.clone();
    assert_eq!(c, c2);
    assert!(format!("{:?}", c).contains("And"));
}
