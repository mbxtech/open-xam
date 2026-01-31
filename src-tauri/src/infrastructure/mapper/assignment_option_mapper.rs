use crate::domain::entities::assignment_option_entity::{
    AssignmentOptionEntity, NewAssignmentOption, UpdateAssignmentOption,
};
use crate::domain::model::assignment_option::AssignmentOption;

impl<'a> From<&'a AssignmentOption> for NewAssignmentOption<'a> {
    fn from(value: &'a AssignmentOption) -> Self {
        NewAssignmentOption {
            id: value.id,
            text: &value.text,
            fk_question_id: value
                .question_id
                .expect("question_id is required for NewAssignmentOption"),
        }
    }
}

impl<'a> From<&'a AssignmentOption> for UpdateAssignmentOption<'a> {
    fn from(value: &'a AssignmentOption) -> Self {
        UpdateAssignmentOption {
            id: value.id,
            text: Some(&value.text),
            fk_question_id: value
                .question_id
                .expect("question_id is required for UpdateAssignmentOption"),
        }
    }
}

impl<'a> From<&'a AssignmentOptionEntity> for AssignmentOption {
    fn from(value: &'a AssignmentOptionEntity) -> Self {
        AssignmentOption {
            id: value.id,
            row_id: Some(value.row_id),
            text: value.text.to_string(),
            question_id: Some(value.fk_question_id),
        }
    }
}

