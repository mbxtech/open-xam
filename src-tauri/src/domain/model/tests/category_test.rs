use crate::domain::model::category::Category;
use crate::domain::traits::validation::Validation;

#[test]
fn test_category_validation_valid() {
    let c = Category {
        id: None,
        name: "Valid Category".into(),
        created_at: None,
        updated_at: None,
    };
    assert!(c.validate().is_ok());
}

#[test]
fn test_category_validation_invalid_name() {
    let mut c = Category {
        id: None,
        name: "abc".into(), // Too short
        created_at: None,
        updated_at: None,
    };
    assert!(c.validate().is_err());
    
    c.name = "a".repeat(256); // Too long
    assert!(c.validate().is_err());
}

#[test]
fn test_category_clone_and_debug() {
    let c = Category {
        id: Some(1),
        name: "Category".into(),
        created_at: None,
        updated_at: None,
    };
    let c2 = c.clone();
    assert_eq!(c.name, c2.name);
    assert!(format!("{:?}", c).contains("Category"));
}
