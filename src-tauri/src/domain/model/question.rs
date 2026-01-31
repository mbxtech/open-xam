use crate::domain::model::answer::Answer;
use crate::domain::model::assignment_option::AssignmentOption;
use crate::domain::model::category::Category;
use crate::domain::model::question_type::QuestionType;
use crate::domain::traits::validation::Validation;
use crate::domain::validation::field_validator::FieldValidator;
use crate::domain::validation::validation_error::ValidationError;
use crate::domain::validation::validation_result::ValidationResult;
use crate::domain::validation::validators::num_rules::{max, min};
use crate::domain::validation::validators::optional;
use crate::domain::validation::validators::str_rules::{max_len, min_len, required};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<i32>,

    pub question_text: String,
    pub points_total: i32,
    pub r#type: QuestionType,
    pub answers: Vec<Answer>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub points_per_correct_answer: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Category>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<AssignmentOption>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exam_id: Option<i32>,
}

impl Question {
    pub fn new(
        question: Question,
        answers: Vec<Answer>,
        assignment_option: Vec<AssignmentOption>,
    ) -> Question {
        let mut question = question;
        question.answers = answers;
        question.options = Some(assignment_option);
        question
    }

    pub fn validate_options(&self, constraint_check: bool) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        if let Some(options) = &self.options {
            for option in options {
                match option.validate() {
                    Ok(_) => {}
                    Err(e) => validation_errors.extend(e),
                }
            }
        }

        if !constraint_check {
            validation_errors = validation_errors
                .iter()
                .filter(|e| e.field != "question_id")
                .cloned()
                .collect();
        }

        if validation_errors.is_empty() {
            return Ok(());
        }

        Err(validation_errors)
    }

    pub fn validate_answers(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];
        if self.answers.len() < 2 {
            validation_errors.push(ValidationError::new(
                "answers",
                "A Question needs always answers, but none was provided!",
            ));
        }

        match &self.r#type {
            QuestionType::Assignment => {
                match &self.options {
                    None => {
                        validation_errors.push(ValidationError::new(
                            "options",
                            "Question with type ASSIGNMENT need options, but none was provided!",
                        ));
                    }
                    Some(options) => {
                        if options.is_empty() {
                            validation_errors.push(ValidationError::new("options", "Question with type ASSIGNMENT need options, but none was provided!"));
                        }

                        let count_of_missing_ids = self
                            .answers
                            .iter()
                            .filter(|a| a.assigned_option_id.is_none())
                            .count();
                        if count_of_missing_ids > 0 {
                            validation_errors.push(ValidationError::new("options", "Answers for Question with type ASSIGNMENT needs the field assigned_option_id to be set!"));
                        }
                    }
                }
            }
            QuestionType::MultipleChoice => {}
            QuestionType::SingleChoice => {
                let correct_answers = self
                    .answers
                    .clone()
                    .iter()
                    .filter(|a| a.is_correct.is_some())
                    .filter(|a| a.is_correct.unwrap())
                    .count();
                if correct_answers != 1 {
                    validation_errors.push(ValidationError::new(
                        "answers",
                        "Question with type SINGLE_CHOICE must contain exactly one correct answer!",
                    ));
                }
            }
        }

        if validation_errors.is_empty() {
            return Ok(());
        }
        Err(validation_errors)
    }
}

impl Validation for Question {
    fn validate(&self) -> ValidationResult {
        let mut validation_errors: Vec<ValidationError> = vec![];

        let question_text_validator = FieldValidator::new("question_text")
            .rule(required())
            .rule(min_len(5))
            .rule(max_len(500));
        validation_errors.extend(question_text_validator.validate(&self.question_text));

        let points_total_validator = FieldValidator::new("points_to_tal")
            .rule(min(1))
            .rule(max(1000));
        validation_errors.extend(points_total_validator.validate(&self.points_total));

        let points_per_correct_answer_validator =
            FieldValidator::new("points_per_correct_answer").rule(optional(max(1000)));
        validation_errors
            .extend(points_per_correct_answer_validator.validate(&self.points_per_correct_answer));

        if validation_errors.is_empty() {
            Ok(())
        } else {
            Err(validation_errors)
        }
    }
}

