use crate::domain::model::operator::Operator;

#[test]
fn test_operator_serialization() {
    assert_eq!(serde_json::to_string(&Operator::Eq).unwrap(), "\"EQ\"");
    assert_eq!(serde_json::to_string(&Operator::Ne).unwrap(), "\"NE\"");
    assert_eq!(serde_json::to_string(&Operator::In).unwrap(), "\"IN\"");
}

#[test]
fn test_operator_equality() {
    assert_eq!(Operator::Eq, Operator::Eq);
    assert_ne!(Operator::Eq, Operator::Ne);
}

#[test]
fn test_operator_clone_and_debug() {
    let op = Operator::Like;
    let op2 = op.clone();
    assert_eq!(op, op2);
    assert!(format!("{:?}", op).contains("Like"));
}
