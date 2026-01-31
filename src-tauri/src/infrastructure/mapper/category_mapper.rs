use crate::domain::entities::category_entity::{CategoryEntity, NewCategory, UpdateCategory};
use crate::domain::model::category::Category;
use chrono::Utc;

impl<'a> From<&'a Category> for NewCategory<'a> {
    fn from(value: &'a Category) -> Self {
        NewCategory {
            name: &value.name,
            created_at: Some(Utc::now().naive_utc()),
        }
    }
}

impl<'a> From<&'a Category> for UpdateCategory<'a> {
    fn from(value: &'a Category) -> Self {
        UpdateCategory {
            name: Some(&value.name),
            updated_at: Some(Utc::now().naive_utc()),
        }
    }
}

impl<'a> From<&'a CategoryEntity> for Category {
    fn from(value: &'a CategoryEntity) -> Self {
        Category {
            id: Some(value.id),
            name: value.name.to_string(),
            created_at: value.created_at.map(|created| created.and_utc()),
            updated_at: value.updated_at.map(|updated_at| updated_at.and_utc()),
        }
    }
}
impl From<CategoryEntity> for Category {
    fn from(value: CategoryEntity) -> Self {
        Category {
            id: Some(value.id),
            name: value.name.to_string(),
            created_at: value.created_at.map(|created| created.and_utc()),
            updated_at: value.updated_at.map(|updated_at| updated_at.and_utc()),
        }
    }
}

