use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub data: Vec<T>,
    pub total_elements: i64,
    pub current_page: i64,
    pub total_pages: i64,
}

impl<T> PagedResult<T> {
    pub fn new(data: Vec<T>, total_elements: i64, current_page: i64, total_pages: i64) -> Self {
        Self {
            data,
            total_elements,
            current_page,
            total_pages,
        }
    }
}

