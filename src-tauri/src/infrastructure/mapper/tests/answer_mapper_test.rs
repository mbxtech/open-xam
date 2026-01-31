#[cfg(test)]
mod tests {
    use crate::domain::entities::answer_entity::{AnswerEntity, NewAnswer, UpdateAnswer};
    use crate::domain::model::answer::Answer;
    use chrono::DateTime;

    #[test]
    fn new_answer_from_model_sets_fields() {
        let model = Answer {
            id: None,
            answer_text: "Correct answer".to_string(),
            description: Some("Correct answer".to_string()),
            is_correct: Some(true),
            assigned_option_id: Some(10),
            created_at: None,
            updated_at: None,
            question_id: Some(5),
        };

        let new_answer = NewAnswer::from(&model);
        assert_eq!(new_answer.answer_text, "Correct answer");
        assert_eq!(new_answer.description, Some("Correct answer"));
        assert_eq!(new_answer.is_correct, Some(true));
        assert_eq!(new_answer.assigned_option_id, Some(10));
        assert_eq!(new_answer.fk_question_id, 5);
        assert!(new_answer.created_at.is_some());
    }

    #[test]
    #[should_panic(expected = "question_id is required for NewAnswer")]
    fn new_answer_from_model_panics_on_missing_question_id() {
        let model = Answer {
            id: None,
            answer_text: "Text".to_string(),
            description: None,
            is_correct: None,
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: None,
        };
        let _ = NewAnswer::from(&model);
    }

    #[test]
    fn update_answer_from_model_sets_optional_fields() {
        let model = Answer {
            id: Some(1),
            answer_text: "Updated answer".to_string(),
            description: Some("Updated answer".to_string()),
            is_correct: Some(false),
            assigned_option_id: None,
            created_at: None,
            updated_at: None,
            question_id: Some(8),
        };

        let update_answer = UpdateAnswer::from(&model);
        assert_eq!(update_answer.answer_text, Some("Updated answer"));
        assert_eq!(update_answer.description, Some("Updated answer"));
        assert_eq!(update_answer.is_correct, Some(false));
        assert_eq!(update_answer.assigned_option_id, None);
        assert_eq!(update_answer.fk_question_id, Some(8));
        assert!(update_answer.updated_at.is_some());
    }

    #[test]
    fn model_from_entity_maps_all_fields() {
        let created = DateTime::from_timestamp(1_700_000_000, 0).unwrap();
        let updated = DateTime::from_timestamp(1_800_000_000, 0).unwrap();
        let entity = AnswerEntity {
            id: 7,
            answer_text: "Entity Answer".to_string(),
            description: Some("Entity Answer".to_string()),
            is_correct: Some(true),
            created_at: Some(created.naive_utc()),
            updated_at: Some(updated.naive_utc()),
            assigned_option_id: Some(12),
            fk_question_id: 3,
        };

        let model = Answer::from(&entity);
        assert_eq!(model.id, Some(7));
        assert_eq!(model.answer_text, "Entity Answer");
        assert_eq!(model.description, Some("Entity Answer".to_string()));
        assert_eq!(model.is_correct, Some(true));
        assert_eq!(model.assigned_option_id, Some(12));
        assert_eq!(model.created_at.unwrap(), created.to_utc());
        assert_eq!(model.updated_at.unwrap(), updated.to_utc());
        assert_eq!(model.question_id, Some(3));
    }
}
