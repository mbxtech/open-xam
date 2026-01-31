DROP INDEX IF EXISTS idx_exam_fk_category_id;
DROP INDEX IF EXISTS idx_question_fk_category_id;
DROP INDEX IF EXISTS idx_question_fk_exam;
DROP INDEX IF EXISTS idx_assignment_option_fk_question;
DROP INDEX IF EXISTS idx_answer_fk_question_id;

DROP TABLE IF EXISTS answer;
DROP TABLE IF EXISTS assignment_option;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS exam;
DROP TABLE IF EXISTS category;

PRAGMA foreign_keys = OFF;