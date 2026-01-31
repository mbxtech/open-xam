use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamOverallStatistics {
    pub average_question_count: i64,
    pub exam_count: i32,
    pub average_succeeding_score: i32,
    pub archive_count: i32,
    pub active_count: i32,
    pub draft_count: i32,
    pub inactive_count: i32,
}
