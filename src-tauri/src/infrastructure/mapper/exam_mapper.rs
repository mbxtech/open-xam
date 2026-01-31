use crate::application::crud::enum_converter_trait::EnumConverterTrait;
use crate::domain::entities::exam_entity::{ExamEntity, NewExam, UpdateExam};
use crate::domain::model::exam::Exam;
use crate::domain::model::status_type::StatusType;
use chrono::Utc;

fn resolve_status_type_to_string(status_type: &Option<StatusType>) -> Option<String> {
    status_type
        .as_ref()
        .map(|status| StatusType::convert_to_string(status).to_string())
}

fn resolve_status_type_to_enum(status_type: &Option<String>) -> Option<StatusType> {
    status_type
        .as_ref()
        .map(|status| StatusType::convert_from_string(status))
}

impl<'a> From<&'a Exam> for NewExam<'a> {
    fn from(value: &'a Exam) -> Self {
        NewExam {
            name: &value.name,
            description: if let Some(desc) = &value.description {
                desc.as_str()
            } else {
                ""
            },
            duration: value.duration,
            status_type: resolve_status_type_to_string(&value.status_type),
            points_to_succeed: value.points_to_succeeded,
            fk_category_id: if let Some(cat) = &value.category {
                let id: Option<i32> = cat.id;
                Some(id.expect("Category ID is not set"))
            } else {
                None
            },
            created_at: Some(Utc::now().naive_utc()),
            max_questions_real_exam: value.max_questions_real_exam,
        }
    }
}

impl<'a> From<&'a Exam> for UpdateExam<'a> {
    fn from(value: &'a Exam) -> Self {
        UpdateExam {
            name: Some(&value.name),
            description: if let Some(desc) = &value.description {
                Some(desc.as_str())
            } else {
                Some("")
            },
            status_type: resolve_status_type_to_string(&value.status_type),
            points_to_succeed: value.points_to_succeeded,
            duration: value.duration,
            fk_category_id: if let Some(cat) = &value.category {
                let id: Option<i32> = cat.id;
                Some(id.expect("Category ID is not set"))
            } else {
                None
            },
            updated_at: Some(Utc::now().naive_utc()),
            max_questions_real_exam: value.max_questions_real_exam,
        }
    }
}

impl<'a> From<&'a ExamEntity> for Exam {
    fn from(value: &'a ExamEntity) -> Self {
        Exam {
            id: Some(value.id),
            name: value.name.clone(),
            description: Some(value.description.to_string()),
            points_to_succeeded: value.points_to_succeed,
            duration: value.duration,
            status_type: resolve_status_type_to_enum(&value.status_type),
            created_at: value.created_at.map(|value| value.and_utc()),
            updated_at: value.updated_at.map(|value| value.and_utc()),
            category: None,
            max_questions_real_exam: value.max_questions_real_exam,
            questions: vec![],
        }
    }
}

