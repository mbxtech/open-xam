use crate::domain::model::page_options::PageOptions;

#[test]
fn test_page_options_serialization() {
    let options = PageOptions {
        page: 1,
        elements_per_page: 10,
    };
    let json = serde_json::to_string(&options).unwrap();
    assert!(json.contains("\"page\":1"));
    assert!(json.contains("\"elementsPerPage\":10"));
}

#[test]
fn test_page_options_clone_and_debug() {
    let options = PageOptions {
        page: 2,
        elements_per_page: 20,
    };
    let options2 = options.clone();
    assert_eq!(options.page, options2.page);
    assert!(format!("{:?}", options).contains("PageOptions"));
}
