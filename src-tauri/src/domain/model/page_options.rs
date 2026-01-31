use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageOptions {
    pub page: i64,
    pub elements_per_page: i64,
}
