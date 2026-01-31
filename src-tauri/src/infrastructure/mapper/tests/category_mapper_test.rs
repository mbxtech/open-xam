#[cfg(test)]
mod tests {
    use crate::domain::entities::category_entity::{CategoryEntity, NewCategory, UpdateCategory};
    use crate::domain::model::category::Category;
    use chrono::DateTime;

    #[test]
    fn new_category_from_model_sets_fields() {
        let category = Category {
            id: None,
            name: "Networking".to_string(),
            created_at: None,
            updated_at: None,
        };

        let new_category = NewCategory::from(&category);
        assert_eq!(new_category.name, "Networking");
        assert!(new_category.created_at.is_some());
    }

    #[test]
    fn update_category_from_model_sets_optional_fields() {
        let category = Category {
            id: Some(1),
            name: "Updated".to_string(),
            created_at: None,
            updated_at: None,
        };

        let update_category = UpdateCategory::from(&category);
        assert_eq!(update_category.name, Some("Updated"));
        assert!(update_category.updated_at.is_some());
    }

    #[test]
    fn model_from_entity_maps_all_fields() {
        let created = DateTime::from_timestamp(1_700_000_000, 0).unwrap();
        let updated = DateTime::from_timestamp(1_800_000_000, 0).unwrap();
        let entity = CategoryEntity {
            id: 42,
            name: "Security".to_string(),
            created_at: Some(created.naive_utc()),
            updated_at: Some(updated.naive_utc()),
        };

        let model = Category::from(&entity);
        assert_eq!(model.id, Some(42));
        assert_eq!(model.name, "Security");
        assert_eq!(model.created_at.unwrap(), created.to_utc());
        assert_eq!(model.updated_at.unwrap(), updated.to_utc());
    }
}
