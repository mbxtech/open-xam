PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS category
(
    id   INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);


CREATE TABLE IF NOT EXISTS exam
(
    id                INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name              VARCHAR NOT NULL,
    description       VARCHAR NOT NULL,
    points_to_succeed INTEGER,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP,
    fk_category_id    INTEGER,
    CONSTRAINT fk_exam_category
        FOREIGN KEY (fk_category_id)
            REFERENCES category (id)
            ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS question
(
    id                        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    question_text             TEXT    NOT NULL,
    points_total              INTEGER NOT NULL,
    points_per_correct_answer INTEGER,
    question_typ              VARCHAR NOT NULL,
    created_at                TIMESTAMP,
    updated_at                TIMESTAMP,
    fk_exam_id                INTEGER NOT NULL,
    fk_category_id            INTEGER,
    CONSTRAINT fk_question_category
        FOREIGN KEY (fk_category_id)
            REFERENCES category (id)
            ON UPDATE CASCADE,
    CONSTRAINT fk_question_exam
        FOREIGN KEY (fk_exam_id)
            REFERENCES exam (id)
            ON UPDATE CASCADE
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment_option
(
    row_id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    id             INTEGER NOT NULL,
    text           VARCHAR NOT NULL,
    fk_question_id INTEGER NOT NULL,
    CONSTRAINT fk_assignment_option_question
        FOREIGN KEY (fk_question_id)
            REFERENCES question (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS answer
(
    id                 INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    answer_text        TEXT    NOT NULL,
    description        VARCHAR(255),
    is_correct         BOOLEAN,
    created_at         TIMESTAMP,
    updated_at         TIMESTAMP,
    assigned_option_id INTEGER,
    fk_question_id     INTEGER NOT NULL,
    CONSTRAINT fk_answer_question
        FOREIGN KEY (fk_question_id)
            REFERENCES question (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);


-- INDEX
CREATE INDEX idx_exam_fk_category_id ON exam (fk_category_id);
CREATE INDEX idx_question_fk_category_id ON question (fk_category_id);
CREATE INDEX idx_question_fk_exam ON question (fk_exam_id);
CREATE INDEX idx_assignment_option_fk_question ON assignment_option (fk_question_id);
CREATE INDEX idx_answer_fk_question_id ON answer (fk_question_id);

