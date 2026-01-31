// @generated automatically by Diesel CLI.

diesel::table! {
    answer (id) {
        id -> Integer,
        answer_text -> Text,
        description -> Nullable<Text>,
        is_correct -> Nullable<Bool>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
        assigned_option_id -> Nullable<Integer>,
        fk_question_id -> Integer,
    }
}

diesel::table! {
    assignment_option (row_id) {
        row_id -> Integer,
        id -> Integer,
        text -> Text,
        fk_question_id -> Integer,
    }
}

diesel::table! {
    category (id) {
        id -> Integer,
        name -> Text,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    exam (id) {
        id -> Integer,
        name -> Text,
        description -> Text,
        points_to_succeed -> Nullable<Integer>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
        fk_category_id -> Nullable<Integer>,
        status_type -> Nullable<Text>,
        duration -> Nullable<Integer>,
        max_questions_real_exam -> Nullable<Integer>,
    }
}

diesel::table! {
    question (id) {
        id -> Integer,
        question_text -> Text,
        points_total -> Integer,
        points_per_correct_answer -> Nullable<Integer>,
        question_typ -> Text,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
        fk_exam_id -> Integer,
        fk_category_id -> Nullable<Integer>,
    }
}

diesel::joinable!(answer -> question (fk_question_id));
diesel::joinable!(assignment_option -> question (fk_question_id));
diesel::joinable!(exam -> category (fk_category_id));
diesel::joinable!(question -> category (fk_category_id));
diesel::joinable!(question -> exam (fk_exam_id));

diesel::allow_tables_to_appear_in_same_query!(
    answer,
    assignment_option,
    category,
    exam,
    question,
);
