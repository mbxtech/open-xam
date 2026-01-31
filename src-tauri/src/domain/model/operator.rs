use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Operator {
    Eq,
    Ne,
    Gt,
    Ge,
    Lt,
    Le,
    In,
    Like,
    StartsWith,
    EndsWith,
}
