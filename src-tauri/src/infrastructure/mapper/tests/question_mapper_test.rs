#[cfg(test)]
mod tests {
    use crate::domain::entities::question_entity::{NewQuestion, QuestionEntity, UpdateQuestion};
    use crate::domain::model::category::Category;
    use crate::domain::model::question::Question;
    use crate::domain::model::question_type::QuestionType;
    use crate::infrastructure::mapper::question_mapper::{question_type_to_enum, question_type_to_string};
    use chrono::DateTime;

    #[test]
    fn question_type_string_mapping() {
        assert_eq!(
            question_type_to_string(&QuestionType::Assignment),
            "Assignment"
        );
        assert_eq!(
            question_type_to_string(&QuestionType::MultipleChoice),
            "MultipleChoice"
        );
        assert_eq!(
            question_type_to_string(&QuestionType::SingleChoice),
            "SingleChoice"
        );

        assert!(matches!(
            question_type_to_enum("Assignment"),
            QuestionType::Assignment
        ));
        assert!(matches!(
            question_type_to_enum("MultipleChoice"),
            QuestionType::MultipleChoice
        ));
        assert!(matches!(
            question_type_to_enum("SingleChoice"),
            QuestionType::SingleChoice
        ));
        // fallback defaults to SingleChoice
        assert!(matches!(
            question_type_to_enum("Unknown"),
            QuestionType::SingleChoice
        ));
    }

    #[test]
    fn new_question_from_model_sets_fields() {
        let model = Question {
            id: None,
            question_text: "What is Rust?".to_string(),
            points_total: 10,
            r#type: QuestionType::MultipleChoice,
            answers: vec![],
            points_per_correct_answer: Some(5),
            category: None,
            created_at: None,
            updated_at: None,
            options: None,
            exam_id: Some(2),
        };

        let new_q = NewQuestion::from(&model);
        assert_eq!(new_q.question_text, "What is Rust?");
        assert_eq!(new_q.points_total, 10);
        assert_eq!(new_q.points_per_correct_answer, Some(5));
        assert_eq!(new_q.question_typ, "MultipleChoice");
        assert_eq!(new_q.fk_exam_id, 2);
        assert_eq!(new_q.fk_category_id, None);
        assert!(new_q.created_at.is_some());
    }

    #[test]
    #[should_panic(expected = "Exam ID is not set")]
    fn new_question_from_model_panics_on_missing_exam_id() {
        let model = Question {
            id: None,
            question_text: "Text".into(),
            points_total: 1,
            r#type: QuestionType::SingleChoice,
            answers: vec![],
            points_per_correct_answer: None,
            category: None,
            created_at: None,
            updated_at: None,
            options: None,
            exam_id: None,
        };
        let _ = NewQuestion::from(&model);
    }

    #[test]
    fn update_question_from_model_sets_optional_fields() {
        let model = Question {
            id: Some(10),
            question_text: "Updated?".to_string(),
            points_total: 7,
            r#type: QuestionType::Assignment,
            answers: vec![],
            points_per_correct_answer: None,
            category: Some(Category {
                id: Some(42),
                name: "Net".into(),
                created_at: None,
                updated_at: None,
            }),
            created_at: None,
            updated_at: None,
            options: None,
            exam_id: Some(3),
        };

        let upd = UpdateQuestion::from(&model);
        assert_eq!(upd.question_text, Some("Updated?"));
        assert_eq!(upd.points_total, Some(7));
        assert_eq!(upd.points_per_correct_answer, None);
        assert_eq!(upd.question_typ, Some("Assignment"));
        assert_eq!(upd.fk_category_id, Some(42));
        assert!(upd.updated_at.is_some());
    }

    #[test]
    #[should_panic(expected = "Category ID is not set")]
    fn update_question_from_model_panics_on_missing_category_id() {
        let model = Question {
            id: Some(1),
            question_text: "Text".into(),
            points_total: 1,
            r#type: QuestionType::SingleChoice,
            answers: vec![],
            points_per_correct_answer: None,
            category: Some(Category { id: None, name: "C".into(), created_at: None, updated_at: None }),
            created_at: None,
            updated_at: None,
            options: None,
            exam_id: Some(1),
        };
        let _ = UpdateQuestion::from(&model);
    }

    #[test]
    fn model_from_entity_maps_all_fields() {
        let created = DateTime::from_timestamp(1_700_000_000, 0).unwrap();
        let updated = DateTime::from_timestamp(1_800_000_000, 0).unwrap();
        let entity = QuestionEntity {
            id: 5,
            question_text: "Entity Q".into(),
            points_total: 99,
            points_per_correct_answer: Some(33),
            question_typ: "SingleChoice".into(),
            created_at: Some(created.naive_utc()),
            updated_at: Some(updated.naive_utc()),
            fk_exam_id: 7,
            fk_category_id: Some(2),
        };

        let model = Question::from(&entity);
        assert_eq!(model.id, Some(5));
        assert_eq!(model.question_text, "Entity Q");
        assert_eq!(model.points_total, 99);
        assert_eq!(model.points_per_correct_answer, Some(33));
        assert!(matches!(model.r#type, QuestionType::SingleChoice));
        assert_eq!(model.created_at.unwrap(), created.to_utc());
        assert_eq!(model.updated_at.unwrap(), updated.to_utc());
        assert_eq!(model.exam_id.unwrap(), 7);
        assert!(model.category.is_none());
        assert!(model.options.is_none());
    }
}
