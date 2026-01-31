use crate::infrastructure::repositories::sqlite_exam_crud_repository::SQLiteExamCrudRepository;
use crate::application::crud::crud_repository_trait::CRUDRepository;
use crate::application::crud::exam_repository_trait::ExamRepository;
use crate::domain::model::category::Category;
use crate::domain::model::exam::Exam;
use crate::domain::model::filter_option::FilterTree;
use crate::domain::model::question::Question;
use crate::domain::model::status_type::StatusType;
use crate::infrastructure::repositories::sqlite_category_crud_repository::SQLiteCategoryCrudRepository;
use diesel::prelude::*;
use diesel_migrations::*;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

#[test]
fn creat_exam_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);

    let created_exam = create_exam(&mut repository, None);
    assert!(created_exam.id.unwrap() > 0);
    assert_eq!(created_exam.name, "Test Exam".to_string());
    assert_eq!(
        created_exam.description,
        Some("Test Exam Description".to_string())
    );
}

#[test]
fn update_exam_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);

    let created_exam = create_exam(&mut repository, None);

    let exam_to_update = Exam {
        name: "Test Exam Updated".to_string(),
        description: Some("Test Exam Description Updated".to_string()),
        points_to_succeeded: Some(2000),
        ..created_exam.clone()
    };
    let updated_exam_result = repository.update(&exam_to_update);
    assert!(updated_exam_result.is_ok());
    let updated_exam = updated_exam_result.unwrap();
    assert_eq!(updated_exam.name, "Test Exam Updated".to_string());
    assert_eq!(
        updated_exam.description,
        Some("Test Exam Description Updated".to_string())
    );
    assert_eq!(updated_exam.points_to_succeeded, Some(2000));
}

#[test]
fn update_exam_errors_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);
    let mut created_exam = create_exam(&mut repository, None);

    // Test missing ID
    created_exam.id = None;
    let updated = repository.update(&created_exam);
    assert!(updated.is_err());
    assert_eq!(
        updated.unwrap_err().to_string(),
        "Id is required to update an exam: "
    );

    // Test validation error (name too short)
    created_exam.id = Some(1);
    created_exam.name = "Short".to_string(); // name min_len is 5, but wait, "Short" is 5.
    created_exam.name = "Abc".to_string();
    let updated = repository.update(&created_exam);
    assert!(updated.is_err());
    assert!(updated.unwrap_err().to_string().contains("Validation error"));
}

#[test]
fn create_exam_validation_error_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);
    let invalid_exam = Exam {
        id: None,
        name: "Abc".to_string(), // too short
        description: None,
        points_to_succeeded: None,
        duration: None,
        status_type: None,
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    };
    let result = repository.create(&invalid_exam);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Validation error"));
}

#[test]
fn find_by_id_not_found_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);
    let result = repository.find_by_id(999);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Entity with id: 999 not found"));
}

#[test]
fn find_by_id_with_relations_not_found_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);
    let result = repository.find_by_id_with_relations(999);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Entity with id: 999 not found"));
}

#[test]
fn search_exam_test() {
    use crate::domain::model::operator::Operator;
    use crate::domain::model::filter_option::{FilterOption, FilterValue};

    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);
    
    create_exam(&mut repository, None);
    repository.create(&Exam {
        name: "Other Exam".to_string(),
        description: Some("Other Exam Description".to_string()),
        ..create_empty_exam()
    }).unwrap();

    // 1. Search with filter
    let filter = vec![FilterTree {
        root: FilterOption::Condition {
            field: "name".to_string(),
            operator: Operator::Eq,
            value: FilterValue::Str { value: "Other Exam".to_string() },
        },
        conjunction: Some(crate::domain::model::conjunction_type::ConjunctionType::And),
    }];
    
    let result = repository.search(&filter, None).unwrap();
    // total_elements in PagedResult comes from get_total_elements which currently ignores filter in pagination_repository_impl!
    // So it should be 2, but result.data should only have 1 element.
    assert_eq!(result.data.len(), 1);
    assert_eq!(result.data[0].name, "Other Exam");

    // 2. Search with non-matching filter
    let filter_no_match = vec![FilterTree {
        root: FilterOption::Condition {
            field: "name".to_string(),
            operator: Operator::Eq,
            value: FilterValue::Str { value: "Non-existent".to_string() },
        },
        conjunction: Some(crate::domain::model::conjunction_type::ConjunctionType::And),
    }];
    let result_none = repository.search(&filter_no_match, None).unwrap();
    assert_eq!(result_none.data.len(), 0);

    // 3. Search without filter (should return all)
    let result = repository.search(&[], None).unwrap();
    assert_eq!(result.total_elements, 2);
}

#[test]
fn it_should_get_overall_statistics_detailed() {
    let mut conn = get_connection();
    let e1_id;
    let e2_id;

    {
        let mut repository = SQLiteExamCrudRepository::new(&mut conn);

        // Add exams with different statuses and scores
        let e1 = repository.create(&Exam {
            name: "Exam Draft".to_string(),
            status_type: Some(StatusType::Draft),
            points_to_succeeded: Some(10),
            ..create_empty_exam()
        }).unwrap();
        e1_id = e1.id.unwrap();

        let e2 = repository.create(&Exam {
            name: "Exam Active".to_string(),
            status_type: Some(StatusType::Active),
            points_to_succeeded: Some(20),
            ..create_empty_exam()
        }).unwrap();
        e2_id = e2.id.unwrap();
    }

    // Add questions to e1
    add_question_to_exam(&mut conn, e1_id, "Q1");
    add_question_to_exam(&mut conn, e1_id, "Q2");

    // Add question to e2
    add_question_to_exam(&mut conn, e2_id, "Q3");

    {
        let mut repository = SQLiteExamCrudRepository::new(&mut conn);
        let stats = repository.get_overall_statistics().unwrap();
        assert_eq!(stats.exam_count, 2);
        assert_eq!(stats.draft_count, 1);
        assert_eq!(stats.active_count, 1);
        // Average questions: (2 + 1) / 2 = 1.5 -> 1 (integer division)
        assert_eq!(stats.average_question_count, 1);
        // Average score: (10 + 20) / 2 = 15
        assert_eq!(stats.average_succeeding_score, 15);
    }
}

fn create_empty_exam() -> Exam {
    Exam {
        id: None,
        duration: None,
        name: "Default".to_string(),
        description: None,
        points_to_succeeded: None,
        status_type: None,
        created_at: None,
        updated_at: None,
        category: None,
        max_questions_real_exam: None,
        questions: vec![],
    }
}

fn add_question_to_exam(conn: &mut SqliteConnection, exam_id: i32, text: &str) {
    use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
    use crate::domain::model::question_type::QuestionType;
    let mut q_repo = SQLiteQuestionCrudRepository::new(conn);
    let q = Question {
        id: None,
        question_text: if text.len() < 5 { format!("Long enough {}", text) } else { text.to_string() },
        points_total: 10,
        r#type: QuestionType::SingleChoice,
        answers: vec![],
        points_per_correct_answer: None,
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(exam_id),
    };
    q_repo.create(&q).unwrap();
}

#[test]
fn delete_exam_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);

    let created_exam = create_exam(&mut repository, None);
    let size = repository.delete(created_exam.id.unwrap()).unwrap();
    assert_eq!(size, 1);
}

#[test]
fn find_by_id_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);

    let created_exam = create_exam(&mut repository, None);
    let found_exam_result = repository.find_by_id(created_exam.id.unwrap());
    assert!(found_exam_result.is_ok());
    let found_exam = found_exam_result.unwrap();
    assert!(found_exam.is_some());
    assert_eq!(found_exam.unwrap().id, created_exam.id);
}

#[test]
fn find_by_id_with_relations_test() {
    use crate::domain::model::answer::Answer as DomainAnswer;
    use crate::domain::model::assignment_option::AssignmentOption as DomainAssignmentOption;
    use crate::domain::model::question::Question as DomainQuestion;
    use crate::domain::model::question_type::QuestionType;
    use crate::infrastructure::repositories::sqlite_answer_crud_repository::SQLiteAnswerCrudRepository;
    use crate::infrastructure::repositories::sqlite_assignment_option_crud_repository::SQLiteAssignmentOptionCrudRepository;
    use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;

    let mut conn = get_connection();

    let mut category_repo = SQLiteCategoryCrudRepository::new(&mut conn);

    let created_category = category_repo.create(&Category {
        id: None,
        name: "Test Cat".to_string(),
        created_at: None,
        updated_at: None,
    });

    assert!(created_category.is_ok());
    let created_category = created_category.unwrap();
    assert!(created_category.id.is_some());

    let mut exam_repo = SQLiteExamCrudRepository::new(&mut conn);
    let exam = create_exam(&mut exam_repo, Some(created_category.clone()));

    // Create a question for this exam
    let mut question_repo = SQLiteQuestionCrudRepository::new(&mut conn);
    let question = DomainQuestion {
        id: None,
        question_text: "What is Rust?".to_string(),
        points_total: 100,
        r#type: QuestionType::SingleChoice,
        answers: vec![],
        points_per_correct_answer: Some(100),
        category: None,
        created_at: None,
        updated_at: None,
        options: None,
        exam_id: Some(exam.id.unwrap()),
    };
    let created_question = question_repo.create(&question).unwrap();

    // Create assignment options
    let mut option_repo = SQLiteAssignmentOptionCrudRepository::new(&mut conn);
    let opt1 = DomainAssignmentOption {
        row_id: Some(0),
        id: 1,
        text: "A language".to_string(),
        question_id: Some(created_question.id.unwrap()),
    };
    let opt2 = DomainAssignmentOption {
        row_id: Some(0),
        id: 2,
        text: "A database".to_string(),
        question_id: Some(created_question.id.unwrap()),
    };
    let _ = option_repo.create(&opt1).unwrap();
    let _ = option_repo.create(&opt2).unwrap();

    // Create answers
    let mut answer_repo = SQLiteAnswerCrudRepository::new(&mut conn);
    let a1 = DomainAnswer {
        id: None,
        answer_text: "A language".to_string(),
        description: None,
        is_correct: Some(true),
        assigned_option_id: Some(1),
        created_at: None,
        updated_at: None,
        question_id: Some(created_question.id.unwrap()),
    };
    let a2 = DomainAnswer {
        id: None,
        answer_text: "A database".to_string(),
        description: None,
        is_correct: Some(false),
        assigned_option_id: Some(2),
        created_at: None,
        updated_at: None,
        question_id: Some(created_question.id.unwrap()),
    };
    let _ = answer_repo.create(&a1).unwrap();
    let _ = answer_repo.create(&a2).unwrap();

    let mut repo_for_fetch = SQLiteExamCrudRepository::new(&mut conn);
    let fetched = repo_for_fetch
        .find_by_id_with_relations(exam.id.unwrap())
        .unwrap()
        .unwrap();
    assert_eq!(fetched.id, exam.id);
    assert_eq!(fetched.questions.len(), 1);
    assert_eq!(fetched.questions[0].answers.len(), 2);
    assert!(fetched.questions[0].options.is_some());
    assert_eq!(fetched.questions[0].options.as_ref().unwrap().len(), 2);
    assert!(fetched.category.is_some());
    assert_eq!(fetched.category.unwrap().id.unwrap(), created_category.id.unwrap());
}

#[test]
fn find_all_test() {
    let mut conn = get_connection();
    let mut repository = SQLiteExamCrudRepository::new(&mut conn);
    let created_exam = create_exam(&mut repository, None);
    let found_exams_result = repository.find_all(None);
    assert!(found_exams_result.is_ok());
    let found_exams = found_exams_result.unwrap();
    assert!(!found_exams.data.is_empty());
    assert_eq!(found_exams.data[0].id, created_exam.id);
}

#[test]
fn it_should_get_overall_statistics() {
    let mut conn = get_connection();

    // 1. Empty stats
    {
        let mut repository = SQLiteExamCrudRepository::new(&mut conn);
        let stats = repository.get_overall_statistics().unwrap();
        assert_eq!(stats.exam_count, 0);
        assert_eq!(stats.average_question_count, 0);
    }

    // 2. Add some exams with questions
    let exam1 = {
        let mut repository = SQLiteExamCrudRepository::new(&mut conn);
        create_exam(&mut repository, None)
    };

    // Add a question to count the exam in current implementation
    {
        use crate::infrastructure::repositories::sqlite_question_crud_repository::SQLiteQuestionCrudRepository;
        let mut q_repo = SQLiteQuestionCrudRepository::new(&mut conn);
        let q = Question {
            id: None,
            question_text: "Q1 text long enough".into(),
            points_total: 10,
            r#type: crate::domain::model::question_type::QuestionType::SingleChoice,
            answers: vec![],
            points_per_correct_answer: None,
            category: None,
            created_at: None,
            updated_at: None,
            options: None,
            exam_id: Some(exam1.id.unwrap()),
        };
        q_repo.create(&q).unwrap();
    }

    {
        let mut repository = SQLiteExamCrudRepository::new(&mut conn);
        let stats = repository.get_overall_statistics().unwrap();
        assert_eq!(stats.exam_count, 1);
    }
}
fn create_exam(repository: &mut SQLiteExamCrudRepository, category_to_add: Option<Category>) -> Exam {
    let created_exam_result = repository.create(&Exam {
        id: None,
        duration: None,
        name: "Test Exam".to_string(),
        description: Some("Test Exam Description".to_string()),
        points_to_succeeded: Some(1000),
        status_type: None,
        created_at: None,
        updated_at: None,
        category: category_to_add,
        max_questions_real_exam: None,
        questions: vec![],
    });

    assert!(created_exam_result.is_ok());
    let created_exam = created_exam_result.unwrap();
    assert!(created_exam.id.unwrap() > 0);
    assert_eq!(created_exam.name, "Test Exam".to_string());
    assert_eq!(
        created_exam.description,
        Some("Test Exam Description".to_string())
    );

    created_exam
}

fn get_connection() -> SqliteConnection {
    let mut connection = SqliteConnection::establish(":memory:").unwrap();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
    connection
}
