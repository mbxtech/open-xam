#[cfg(test)]
mod tests {
    use crate::domain::entities::exam_entity::ExamEntity;
    use crate::domain::entities::exam_entity::{NewExam, UpdateExam};
    use crate::domain::model::category::Category;
    use crate::domain::model::exam::Exam;
    use crate::domain::model::status_type::StatusType;
    use chrono::DateTime;

    #[test]
    fn new_exam_from_model_sets_fields() {
        let model = Exam {
            id: Some(0),
            duration: Some(10),
            name: "Network Exam".to_string(),
            description: Some("Covers networking".to_string()),
            points_to_succeeded: Some(60),
            status_type: Some(StatusType::Active),
            created_at: None,
            updated_at: None,
            category: Some(Category {
                id: Some(5),
                name: "Networking".into(),
                created_at: None,
                updated_at: None,
            }),
            max_questions_real_exam: None,
            questions: vec![],
        };

        let new_row = NewExam::from(&model);
        assert_eq!(new_row.name, "Network Exam");
        assert_eq!(new_row.description, "Covers networking");
        assert_eq!(new_row.points_to_succeed, Some(60));
        assert_eq!(new_row.fk_category_id, Some(5));
        assert_eq!(new_row.status_type.unwrap(), "Active");
        assert!(new_row.created_at.is_some());
    }

    #[test]
    #[should_panic(expected = "Category ID is not set")]
    fn new_exam_from_model_panics_on_missing_category_id() {
        let model = Exam {
            id: None,
            name: "Name".into(),
            description: None,
            points_to_succeeded: None,
            duration: None,
            status_type: None,
            created_at: None,
            updated_at: None,
            category: Some(Category { id: None, name: "C".into(), created_at: None, updated_at: None }),
            max_questions_real_exam: None,
            questions: vec![],
        };
        let _ = NewExam::from(&model);
    }

    #[test]
    fn update_exam_from_model_sets_optional_fields() {
        // with description
        let with_desc = Exam {
            id: Some(2),
            duration: Some(10),
            name: "Updated Exam".to_string(),
            description: Some("Updated desc".to_string()),
            points_to_succeeded: Some(70),
            status_type: None,
            created_at: None,
            updated_at: None,
            category: None,
            max_questions_real_exam: None,
            questions: vec![],
        };
        let upd = UpdateExam::from(&with_desc);
        assert_eq!(upd.name, Some("Updated Exam"));
        assert_eq!(upd.description, Some("Updated desc"));
        assert_eq!(upd.points_to_succeed, Some(70));
        assert_eq!(upd.fk_category_id, None);
        assert!(upd.updated_at.is_some());

        // without description -> should map to empty string in Some("")
        let without_desc = Exam {
            duration: Some(10),
            id: Some(3),
            name: "No Desc".to_string(),
            status_type: Some(StatusType::Inactive),
            description: None,
            points_to_succeeded: None,
            created_at: None,
            updated_at: None,
            category: Some(Category {
                id: Some(9),
                name: "Sec".into(),
                created_at: None,
                updated_at: None,
            }),
            max_questions_real_exam: None,
            questions: vec![],
        };
        let upd2 = UpdateExam::from(&without_desc);
        assert_eq!(upd2.description, Some(""));
        assert_eq!(upd2.fk_category_id, Some(9));
        assert_eq!(upd2.status_type.unwrap(), "Inactive");
    }

    #[test]
    #[should_panic(expected = "Category ID is not set")]
    fn update_exam_from_model_panics_on_missing_category_id() {
        let model = Exam {
            id: Some(1),
            name: "Name".into(),
            description: None,
            points_to_succeeded: None,
            duration: None,
            status_type: None,
            created_at: None,
            updated_at: None,
            category: Some(Category { id: None, name: "C".into(), created_at: None, updated_at: None }),
            max_questions_real_exam: None,
            questions: vec![],
        };
        let _ = UpdateExam::from(&model);
    }

    #[test]
    fn model_from_entity_maps_all_fields() {
        let created = DateTime::from_timestamp(1_700_000_000, 0).unwrap();
        let updated = DateTime::from_timestamp(1_800_000_000, 0).unwrap();
        let entity = ExamEntity {
            duration: Some(100),
            id: 10,
            name: "Entity Exam".to_string(),
            description: "Entity Desc".to_string(),
            status_type: None,
            points_to_succeed: Some(55),
            created_at: Some(created.naive_utc()),
            updated_at: Some(updated.naive_utc()),
            fk_category_id: None,
            max_questions_real_exam: None,
        };

        let model = Exam::from(&entity);
        assert_eq!(model.id.unwrap(), 10);
        assert_eq!(model.name, "Entity Exam");
        assert_eq!(model.description, Some("Entity Desc".to_string()));
        assert_eq!(model.points_to_succeeded, Some(55));
        assert_eq!(model.created_at.unwrap(), created.to_utc());
        assert_eq!(model.updated_at.unwrap(), updated.to_utc());
        assert!(model.category.is_none());
        assert!(model.questions.is_empty());
        assert!(model.status_type.is_none());
    }
}
