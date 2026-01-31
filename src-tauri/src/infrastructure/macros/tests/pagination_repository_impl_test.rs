use crate::application::crud::crud_repository_trait::{CRUDError, CRUDRepository};
use crate::domain::entities::category_entity::CategoryEntity;
use crate::domain::entities::exam_entity::ExamEntity;
use crate::domain::model::category::Category;
use crate::domain::model::exam;
use crate::domain::model::exam::Exam;
use crate::domain::model::page_options::PageOptions;
use crate::infrastructure::repositories::sqlite_category_crud_repository::SQLiteCategoryCrudRepository;
use crate::infrastructure::repositories::sqlite_exam_crud_repository::SQLiteExamCrudRepository;
use crate::pagination_repository_impl;
use diesel::prelude::*;
use diesel_migrations::*;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

fn get_connection() -> SqliteConnection {
    let mut connection = SqliteConnection::establish(":memory:").unwrap();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
    connection
}

fn create_test_category(conn: &mut SqliteConnection, name: &str) -> Category {
    let mut repo = SQLiteCategoryCrudRepository::new(conn);
    repo.create(&Category {
        id: None,
        name: name.to_string(),
        created_at: None,
        updated_at: None,
    })
    .unwrap()
}

fn create_test_exam(conn: &mut SqliteConnection, name: &str, category: Option<Category>) -> Exam {
    let mut repo = SQLiteExamCrudRepository::new(conn);
    repo.create(&Exam {
        id: None,
        name: name.to_string(),
        description: Some(format!("{} description", name)),
        duration: None,
        points_to_succeeded: Some(100),
        status_type: None,
        created_at: None,
        updated_at: None,
        category,
        max_questions_real_exam: None,
        questions: vec![],
    })
    .unwrap()
}

// ============================================
// Tests for basic macro (backward compatible)
// ============================================

#[test]
fn test_basic_macro_find_all_without_pagination() {
    let mut conn = get_connection();

    create_test_exam(&mut conn, "Exam One", None);
    create_test_exam(&mut conn, "Exam Two", None);

    pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

    let result = exam::find_all(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.total_elements, 2);
    assert_eq!(result.current_page, 1);
    assert_eq!(result.total_pages, 1);
}

#[test]
fn test_basic_macro_find_all_with_pagination() {
    let mut conn = get_connection();

    create_test_exam(&mut conn, "Exam One", None);
    create_test_exam(&mut conn, "Exam Two", None);
    create_test_exam(&mut conn, "Exam Three", None);

    pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

    let page_options = PageOptions {
        page: 1,
        elements_per_page: 2,
    };
    let result = exam::find_all(&mut conn, Some(page_options)).unwrap();

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.total_elements, 3);
    assert_eq!(result.current_page, 1);
    assert_eq!(result.total_pages, 2);
}

#[test]
fn test_basic_macro_find_all_second_page() {
    let mut conn = get_connection();

    create_test_exam(&mut conn, "Exam One", None);
    create_test_exam(&mut conn, "Exam Two", None);
    create_test_exam(&mut conn, "Exam Three", None);

    pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

    let page_options = PageOptions {
        page: 2,
        elements_per_page: 2,
    };
    let result = exam::find_all(&mut conn, Some(page_options)).unwrap();

    assert_eq!(result.data.len(), 1);
    assert_eq!(result.total_elements, 3);
    assert_eq!(result.current_page, 2);
    assert_eq!(result.total_pages, 2);
}

#[test]
fn test_basic_macro_find_filtered() {
    let mut conn = get_connection();

    create_test_exam(&mut conn, "Exam One", None);
    create_test_exam(&mut conn, "Exam Two", None);

    pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

    use crate::schema::exam::dsl::name;
    let filter = Box::new(name.eq("Exam One").nullable());

    let result = exam::find_filtered(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 1);
    assert_eq!(result.data[0].name, "Exam One");
}

// ============================================
// Tests for left_join macro variant
// ============================================

#[test]
fn test_left_join_macro_find_all_with_join_no_relation() {
    let mut conn = get_connection();

    // Create exam without category
    create_test_exam(&mut conn, "Exam No Category", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    let result = exam::find_all_with_join(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 1);
    let (exam_entity, category_entity) = &result.data[0];
    assert_eq!(exam_entity.name, "Exam No Category");
    assert!(category_entity.is_none());
}

#[test]
fn test_left_join_macro_find_all_with_join_with_relation() {
    let mut conn = get_connection();

    // Create category first
    let category = create_test_category(&mut conn, "Test Category");

    // Create exam with category
    create_test_exam(&mut conn, "Exam With Category", Some(category.clone()));

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    let result = exam::find_all_with_join(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 1);
    let (exam_entity, category_entity) = &result.data[0];
    assert_eq!(exam_entity.name, "Exam With Category");
    assert!(category_entity.is_some());
    assert_eq!(category_entity.as_ref().unwrap().name, "Test Category");
}

#[test]
fn test_left_join_macro_find_all_with_join_mixed() {
    let mut conn = get_connection();

    // Create category
    let category = create_test_category(&mut conn, "Mixed Category");

    // Create exams - one with category, one without
    create_test_exam(&mut conn, "Exam With Cat", Some(category.clone()));
    create_test_exam(&mut conn, "Exam Without Cat", None);

    pagination_repository_impl!(
    exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    let result = exam::find_all_with_join(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 2);

    // Results are ordered by id desc, so the second created exam comes first
    let has_with_category = result
        .data
        .iter()
        .any(|(e, c)| e.name == "Exam With Cat" && c.is_some());
    let has_without_category = result
        .data
        .iter()
        .any(|(e, c)| e.name == "Exam Without Cat" && c.is_none());

    assert!(has_with_category);
    assert!(has_without_category);
}

#[test]
fn test_left_join_macro_find_all_with_join_pagination() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Paginated Category");

    create_test_exam(&mut conn, "Exam Page 1", Some(category.clone()));
    create_test_exam(&mut conn, "Exam Page 2", Some(category.clone()));
    create_test_exam(&mut conn, "Exam Page 3", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    let page_options = PageOptions {
        page: 1,
        elements_per_page: 2,
    };
    let result = exam::find_all_with_join(&mut conn, Some(page_options)).unwrap();

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.total_elements, 3);
    assert_eq!(result.total_pages, 2);
}

// ============================================
// Tests for inner_join macro variant
// ============================================

#[test]
fn test_inner_join_macro_find_all_with_join() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Inner Join Category");

    // Create exams - one with category (will be returned), one without (won't be returned)
    create_test_exam(&mut conn, "Exam With Inner Cat", Some(category.clone()));
    create_test_exam(&mut conn, "Exam Without Cat", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    let result = exam::find_all_with_join(&mut conn, None).unwrap();

    // Only the exam with category should be returned (inner join)
    assert_eq!(result.data.len(), 1);
    let (exam_entity, category_entity) = &result.data[0];
    assert_eq!(exam_entity.name, "Exam With Inner Cat");
    assert_eq!(category_entity.name, "Inner Join Category");
}

#[test]
fn test_inner_join_macro_find_all_with_join_pagination() {
    let mut conn = get_connection();

    let category1 = create_test_category(&mut conn, "Category 1");
    let category2 = create_test_category(&mut conn, "Category 2");

    create_test_exam(&mut conn, "Exam Cat 1", Some(category1.clone()));
    create_test_exam(&mut conn, "Exam Cat 2", Some(category2.clone()));
    create_test_exam(&mut conn, "Exam No Cat", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    let page_options = PageOptions {
        page: 1,
        elements_per_page: 1,
    };
    let result = exam::find_all_with_join(&mut conn, Some(page_options)).unwrap();

    // Only 2 exams have categories, pagination should work
    assert_eq!(result.data.len(), 1);
    // Note: total_elements counts from main table, not joined result
    assert_eq!(result.total_elements, 3);
}

// ============================================
// Tests for empty results
// ============================================

#[test]
fn test_basic_macro_empty_table() {
    let mut conn = get_connection();

    pagination_repository_impl!(exam, ExamEntity, crate::schema::exam::table);

    let result = exam::find_all(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 0);
    assert_eq!(result.total_elements, 0);
    assert_eq!(result.current_page, 1);
    assert_eq!(result.total_pages, 1);
}

#[test]
fn test_left_join_macro_empty_table() {
    let mut conn = get_connection();

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    let result = exam::find_all_with_join(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 0);
    assert_eq!(result.total_elements, 0);
}

#[test]
fn test_inner_join_macro_no_matching_joins() {
    let mut conn = get_connection();

    // Create exams without categories
    create_test_exam(&mut conn, "Exam No Cat 1", None);
    create_test_exam(&mut conn, "Exam No Cat 2", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    let result = exam::find_all_with_join(&mut conn, None).unwrap();

    // Inner join with no matching categories should return empty
    assert_eq!(result.data.len(), 0);
    // But total_elements comes from main table
    assert_eq!(result.total_elements, 2);
}

// ============================================
// Tests for backward compatibility
// ============================================

#[test]
fn test_basic_macro_still_provides_find_all_without_join() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Compat Category");
    create_test_exam(&mut conn, "Compat Exam", Some(category));

    // Use the left_join variant but call find_all (not find_all_with_join)
    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    // find_all should still work and return just ExamEntity (no join)
    let result = exam::find_all(&mut conn, None).unwrap();

    assert_eq!(result.data.len(), 1);
    assert_eq!(result.data[0].name, "Compat Exam");
}

#[test]
fn test_basic_macro_still_provides_find_filtered_without_join() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Filter Compat Category");
    create_test_exam(&mut conn, "Filter Compat Exam", Some(category));

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    use crate::schema::exam::dsl::name;
    let filter = Box::new(name.eq("Filter Compat Exam").nullable());

    // find_filtered should still work without join
    let result = exam::find_filtered(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 1);
    assert_eq!(result.data[0].name, "Filter Compat Exam");
}

// ============================================
// Tests for find_filtered_with_join (left_join)
// ============================================

#[test]
fn test_left_join_find_filtered_with_join_by_main_table_column() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Filter Category");
    create_test_exam(&mut conn, "Target Exam", Some(category.clone()));
    create_test_exam(&mut conn, "Other Exam", Some(category.clone()));
    create_test_exam(&mut conn, "No Category Exam", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    // Filter by exam name (main table column)
    use crate::schema::exam::dsl::name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::LeftJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(name.eq("Target Exam").nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 1);
    let (exam_entity, category_entity) = &result.data[0];
    assert_eq!(exam_entity.name, "Target Exam");
    assert!(category_entity.is_some());
    assert_eq!(category_entity.as_ref().unwrap().name, "Filter Category");
}

#[test]
fn test_left_join_find_filtered_with_join_by_joined_table_column() {
    let mut conn = get_connection();

    let category1 = create_test_category(&mut conn, "Category Alpha");
    let category2 = create_test_category(&mut conn, "Category Beta");
    create_test_exam(&mut conn, "Exam Alpha 1", Some(category1.clone()));
    create_test_exam(&mut conn, "Exam Alpha 2", Some(category1.clone()));
    create_test_exam(&mut conn, "Exam Beta", Some(category2.clone()));
    create_test_exam(&mut conn, "Exam No Cat", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    // Filter by category name (joined table column)
    use crate::schema::category::dsl::name as category_name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::LeftJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(category_name.eq("Category Alpha").nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 2);
    for (exam_entity, category_entity) in &result.data {
        assert!(exam_entity.name.starts_with("Exam Alpha"));
        assert!(category_entity.is_some());
        assert_eq!(category_entity.as_ref().unwrap().name, "Category Alpha");
    }
}

#[test]
fn test_left_join_find_filtered_with_join_with_pagination() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Paginated Filter Category");
    create_test_exam(&mut conn, "Page Exam 1", Some(category.clone()));
    create_test_exam(&mut conn, "Page Exam 2", Some(category.clone()));
    create_test_exam(&mut conn, "Page Exam 3", Some(category.clone()));
    create_test_exam(&mut conn, "Other Exam", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    use crate::schema::category::dsl::name as category_name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::LeftJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(category_name.eq("Paginated Filter Category").nullable());

    let page_options = PageOptions {
        page: 1,
        elements_per_page: 2,
    };
    let result = exam::find_filtered_with_join(&mut conn, filter, Some(page_options)).unwrap();

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.total_elements, 4); // Total from main table
    assert_eq!(result.current_page, 1);
}

#[test]
fn test_left_join_find_filtered_with_join_no_results() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Existing Category");
    create_test_exam(&mut conn, "Exam 1", Some(category.clone()));

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    use crate::schema::exam::dsl::name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::LeftJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(name.eq("Non Existent Exam").nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 0);
}

#[test]
fn test_left_join_find_filtered_with_join_null_category() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Some Category");
    create_test_exam(&mut conn, "Exam With Cat", Some(category.clone()));
    create_test_exam(&mut conn, "Exam Without Cat 1", None);
    create_test_exam(&mut conn, "Exam Without Cat 2", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        left_join: category,
        CategoryEntity
    );

    // Filter for exams where fk_category_id is null
    use crate::schema::exam::dsl::fk_category_id;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::LeftJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(fk_category_id.is_null().nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 2);
    for (exam_entity, category_entity) in &result.data {
        assert!(exam_entity.name.starts_with("Exam Without Cat"));
        assert!(category_entity.is_none());
    }
}

// ============================================
// Tests for find_filtered_with_join (inner_join)
// ============================================

#[test]
fn test_inner_join_find_filtered_with_join_by_main_table_column() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Inner Filter Category");
    create_test_exam(&mut conn, "Inner Target Exam", Some(category.clone()));
    create_test_exam(&mut conn, "Inner Other Exam", Some(category.clone()));
    create_test_exam(&mut conn, "No Cat Exam", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    use crate::schema::exam::dsl::name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::InnerJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(name.eq("Inner Target Exam").nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 1);
    let (exam_entity, category_entity) = &result.data[0];
    assert_eq!(exam_entity.name, "Inner Target Exam");
    assert_eq!(category_entity.name, "Inner Filter Category");
}

#[test]
fn test_inner_join_find_filtered_with_join_by_joined_table_column() {
    let mut conn = get_connection();

    let category1 = create_test_category(&mut conn, "Inner Cat A");
    let category2 = create_test_category(&mut conn, "Inner Cat B");
    create_test_exam(&mut conn, "Exam A1", Some(category1.clone()));
    create_test_exam(&mut conn, "Exam A2", Some(category1.clone()));
    create_test_exam(&mut conn, "Exam B", Some(category2.clone()));
    create_test_exam(&mut conn, "Exam None", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    use crate::schema::category::dsl::name as category_name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::InnerJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(category_name.eq("Inner Cat A").nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    assert_eq!(result.data.len(), 2);
    for (exam_entity, category_entity) in &result.data {
        assert!(exam_entity.name.starts_with("Exam A"));
        assert_eq!(category_entity.name, "Inner Cat A");
    }
}

#[test]
fn test_inner_join_find_filtered_with_join_with_pagination() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Inner Page Category");
    create_test_exam(&mut conn, "Inner Page 1", Some(category.clone()));
    create_test_exam(&mut conn, "Inner Page 2", Some(category.clone()));
    create_test_exam(&mut conn, "Inner Page 3", Some(category.clone()));

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    use crate::schema::category::dsl::name as category_name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::InnerJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(category_name.eq("Inner Page Category").nullable());

    let page_options = PageOptions {
        page: 1,
        elements_per_page: 2,
    };
    let result = exam::find_filtered_with_join(&mut conn, filter, Some(page_options)).unwrap();

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.current_page, 1);
}

#[test]
fn test_inner_join_find_filtered_with_join_excludes_null_joins() {
    let mut conn = get_connection();

    let category = create_test_category(&mut conn, "Inner Only Category");
    create_test_exam(&mut conn, "Has Category", Some(category.clone()));
    create_test_exam(&mut conn, "No Category 1", None);
    create_test_exam(&mut conn, "No Category 2", None);

    pagination_repository_impl!(
        exam,
        ExamEntity,
        crate::schema::exam::table,
        inner_join: category,
        CategoryEntity
    );

    // Use a filter that would match all exams by name pattern
    use crate::schema::exam::dsl::name;
    let filter: Box<
        dyn diesel::expression::BoxableExpression<
            diesel::helper_types::InnerJoinQuerySource<
                crate::schema::exam::table,
                crate::schema::category::table,
            >,
            diesel::sqlite::Sqlite,
            SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
        >,
    > = Box::new(name.like("%Category%").nullable());

    let result = exam::find_filtered_with_join(&mut conn, filter, None).unwrap();

    // Inner join should only return the exam with a category
    assert_eq!(result.data.len(), 1);
    let (exam_entity, category_entity) = &result.data[0];
    assert_eq!(exam_entity.name, "Has Category");
    assert_eq!(category_entity.name, "Inner Only Category");
}
