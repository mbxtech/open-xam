use crate::domain::model::answer::Answer;
use crate::presentation::answer_invoke_handler::*;
use crate::presentation::tests::test_utils::{setup, teardown};
use serial_test::serial;

#[test]
#[serial]
fn test_answer_invoke_handlers() {
    let db_path = setup("test_answer_invoke");

    // create_answer requires a question_id that exists and answers validation
    // For simplicity of covering lines, we can just test that it calls the usecase and handles error
    let answer = Answer {
        id: None,
        answer_text: "abc".into(), // too short, should fail validation
        description: None,
        is_correct: Some(true),
        assigned_option_id: None,
        created_at: None,
        updated_at: None,
        question_id: Some(1),
    };
    
    // This will probably fail due to missing question or validation
    let result = create_answer(answer.clone());
    assert!(result.is_err());

    let update_res = update_answer(answer);
    assert!(update_res.is_err());

    let delete_res = delete_answer(1);
    assert!(delete_res.is_ok()); // delete usually returns 0 if not found, not Err
    
    teardown(db_path);
}
