use crate::presentation::answer_invoke_handler::{create_answer, delete_answer, update_answer};
use crate::presentation::assignment_option_invoke_handler::{
    delete_assignment_option, update_assignment_option,
};
use crate::presentation::category_invoke_handlers::{
    create_category, delete_category, get_categories, get_category_by_id, search_categories,
    update_category,
};
use crate::presentation::exam_invoke_handler::{create_exam, delete_exam, find_exam_with_relations, get_exam, get_exam_overall_statistics, get_exams, search_exams, update_exam, validate_exam};
use crate::presentation::question_invoke_handler::{
    create_question, delete_question, get_question, get_questions_by_exam_id, update_question,
};
use crate::tauri_plugin_log_initialize::initialize_log_builder;

mod application;
mod domain;
mod infrastructure;
mod presentation;
mod schema;
mod tauri_plugin_log_initialize;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(initialize_log_builder().build())
        .invoke_handler(tauri::generate_handler![
            create_exam,
            get_exam,
            get_exams,
            delete_exam,
            update_exam,
            get_questions_by_exam_id,
            create_question,
            get_question,
            update_question,
            delete_question,
            get_categories,
            create_category,
            update_category,
            delete_category,
            get_category_by_id,
            search_exams,
            update_answer,
            delete_answer,
            update_assignment_option,
            delete_assignment_option,
            find_exam_with_relations,
            create_answer,
            get_exam_overall_statistics,
            delete_assignment_option,
            search_categories,
            validate_exam,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
