#[cfg(test)]
mod tests {
    use crate::domain::entities::assignment_option_entity::{
        AssignmentOptionEntity, NewAssignmentOption, UpdateAssignmentOption,
    };
    use crate::domain::model::assignment_option::AssignmentOption;

    #[test]
    fn new_assignment_option_from_model_sets_fields() {
        let model = AssignmentOption {
            row_id: Some(0),
            id: 11,
            text: "Option Text".to_string(),
            question_id: Some(5),
        };
        let new_row = NewAssignmentOption::from(&model);
        assert_eq!(new_row.id, 11);
        assert_eq!(new_row.text, "Option Text");
        assert_eq!(new_row.fk_question_id, 5);
    }

    #[test]
    #[should_panic(expected = "question_id is required for NewAssignmentOption")]
    fn new_assignment_option_from_model_panics_on_missing_question_id() {
        let model = AssignmentOption {
            row_id: None,
            id: 1,
            text: "Text".to_string(),
            question_id: None,
        };
        let _ = NewAssignmentOption::from(&model);
    }

    #[test]
    fn update_assignment_option_from_model_sets_optional_fields() {
        let model = AssignmentOption {
            row_id: Some(2),
            id: 12,
            text: "Updated Text".to_string(),
            question_id: Some(6),
        };
        let upd = UpdateAssignmentOption::from(&model);
        assert_eq!(upd.id, 12);
        assert_eq!(upd.text, Some("Updated Text"));
        assert_eq!(upd.fk_question_id, 6);
    }

    #[test]
    #[should_panic(expected = "question_id is required for UpdateAssignmentOption")]
    fn update_assignment_option_from_model_panics_on_missing_question_id() {
        let model = AssignmentOption {
            row_id: Some(1),
            id: 1,
            text: "Text".to_string(),
            question_id: None,
        };
        let _ = UpdateAssignmentOption::from(&model);
    }

    #[test]
    fn model_from_entity_maps_all_fields() {
        let entity = AssignmentOptionEntity {
            row_id: 3,
            id: 13,
            text: "Entity Text".to_string(),
            fk_question_id: 9,
        };
        let model = AssignmentOption::from(&entity);
        assert_eq!(model.row_id, Some(3));
        assert_eq!(model.id, 13);
        assert_eq!(model.text, "Entity Text");
        assert_eq!(model.question_id, Some(9));
    }
}
