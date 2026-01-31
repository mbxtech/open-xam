use crate::domain::model::paged_result::PagedResult;

#[test]
fn test_new_paged_result() {
    let data = vec![1, 2, 3];
    let result = PagedResult::new(data.clone(), 10, 1, 2);

    assert_eq!(result.data, data);
    assert_eq!(result.total_elements, 10);
    assert_eq!(result.current_page, 1);
    assert_eq!(result.total_pages, 2);
}

#[test]
fn test_paged_result_fields() {
    let data = vec!["item1".to_string(), "item2".to_string()];
    let result = PagedResult {
        data: data.clone(),
        total_elements: 50,
        current_page: 3,
        total_pages: 5,
    };

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.data[0], "item1");
    assert_eq!(result.total_elements, 50);
    assert_eq!(result.current_page, 3);
    assert_eq!(result.total_pages, 5);
}

#[test]
fn test_serialize_paged_result() {
    use serde_json;
    let data = vec![100, 200];
    let result = PagedResult::new(data, 2, 1, 1);

    let json = serde_json::to_string(&result).unwrap();

    assert!(json.contains("\"data\":[100,200]"));
    assert!(json.contains("\"totalElements\":2"));
    assert!(json.contains("\"currentPage\":1"));
    assert!(json.contains("\"totalPages\":1"));
}

#[test]
fn test_deserialize_paged_result() {
    let json = r#"{"data":[1,2,3],"totalElements":10,"currentPage":2,"totalPages":4}"#;

    let result: PagedResult<i32> = serde_json::from_str(json).unwrap();

    assert_eq!(result.data, vec![1, 2, 3]);
    assert_eq!(result.total_elements, 10);
    assert_eq!(result.current_page, 2);
    assert_eq!(result.total_pages, 4);
}

#[test]
fn test_empty_paged_result() {
    let result: PagedResult<String> = PagedResult::new(vec![], 0, 0, 0);

    assert_eq!(result.data.len(), 0);
    assert_eq!(result.total_elements, 0);
    assert_eq!(result.current_page, 0);
    assert_eq!(result.total_pages, 0);
}

#[test]
fn test_paged_result_debug() {
    let result = PagedResult::new(vec![1], 1, 1, 1);
    assert!(format!("{:?}", result).contains("PagedResult"));
}
