use crate::domain::model::exam_overall_statistics::ExamOverallStatistics;

#[test]
fn test_exam_overall_statistics_fields() {
    let stats = ExamOverallStatistics {
        average_question_count: 10,
        exam_count: 5,
        average_succeeding_score: 75,
        archive_count: 1,
        active_count: 2,
        draft_count: 1,
        inactive_count: 1,
    };
    assert_eq!(stats.exam_count, 5);
    assert_eq!(stats.average_question_count, 10);
    assert_eq!(stats.average_succeeding_score, 75);
}

#[test]
fn test_exam_overall_statistics_serialization() {
    let stats = ExamOverallStatistics {
        average_question_count: 10,
        exam_count: 5,
        average_succeeding_score: 75,
        archive_count: 1,
        active_count: 2,
        draft_count: 1,
        inactive_count: 1,
    };
    let json = serde_json::to_string(&stats).unwrap();
    assert!(json.contains("\"examCount\":5"));
    assert!(json.contains("\"averageQuestionCount\":10"));
}

#[test]
fn test_exam_overall_statistics_debug_and_clone() {
    let stats = ExamOverallStatistics {
        average_question_count: 10,
        exam_count: 5,
        average_succeeding_score: 75,
        archive_count: 1,
        active_count: 2,
        draft_count: 1,
        inactive_count: 1,
    };
    let stats2 = stats.clone();
    assert_eq!(stats.exam_count, stats2.exam_count);
    assert!(format!("{:?}", stats).contains("ExamOverallStatistics"));
}
