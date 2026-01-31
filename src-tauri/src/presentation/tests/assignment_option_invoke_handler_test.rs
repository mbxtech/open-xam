use crate::domain::model::assignment_option::AssignmentOption;
use crate::presentation::assignment_option_invoke_handler::*;
use crate::presentation::tests::test_utils::{setup, teardown};
use serial_test::serial;

#[test]
#[serial]
fn test_assignment_option_invoke_handlers() {
    let db_path = setup("test_assignment_invoke");

    let option = AssignmentOption {
        row_id: Some(1),
        id: 1,
        text: "Test Option".into(),
        question_id: Some(1),
    };

    let update_res = update_assignment_option(option);
    assert!(update_res.is_err());

    let delete_res = delete_assignment_option(1);
    assert!(delete_res.is_ok());
    
    teardown(db_path);
}
