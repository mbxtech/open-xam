pub fn optional<T>(
    rule: impl Fn(&T) -> Option<String> + Send + Sync + 'static,
) -> impl Fn(&Option<T>) -> Option<String> + Send + Sync + 'static {
    move |opt| match opt {
        Some(v) => rule(v),
        None => None,
    }
}

pub mod str_rules {
    use regex::Regex;
    pub fn required() -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
        |s: &String| {
            if s.trim().is_empty() {
                Some("must be provided".into())
            } else {
                None
            }
        }
    }

    pub fn min_len(min: usize) -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
        move |s: &String| {
            if s.len() < min {
                Some(format!("length must be at least {min}"))
            } else {
                None
            }
        }
    }

    pub fn max_len(max: usize) -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
        move |s: &String| {
            if s.len() > max {
                Some(format!("length must be at most {max}"))
            } else {
                None
            }
        }
    }

    #[allow(dead_code)]
    pub fn pattern(regex: Regex) -> impl Fn(&String) -> Option<String> + Send + Sync + 'static {
        move |s: &String| {
            if !regex.is_match(s) {
                Some(format!("must match pattern {}", regex.as_str()))
            } else {
                None
            }
        }
    }
}

pub mod num_rules {
    pub fn min<T>(min: T) -> impl Fn(&T) -> Option<String> + Send + Sync + 'static
    where
        T: PartialOrd + std::fmt::Display + Send + Sync + 'static,
    {
        move |v: &T| {
            if *v < min {
                Some(format!("must be >= {min}"))
            } else {
                None
            }
        }
    }

    pub fn max<T>(max: T) -> impl Fn(&T) -> Option<String> + Send + Sync + 'static
    where
        T: PartialOrd + std::fmt::Display + Send + Sync + 'static,
    {
        move |v: &T| {
            if *v > max {
                Some(format!("must be <= {max}"))
            } else {
                None
            }
        }
    }
}

pub mod bool_rules {
    #[allow(dead_code)]
    pub fn must_be_true() -> impl Fn(&bool) -> Option<String> + Send + Sync + 'static {
        |b: &bool| {
            if !*b {
                Some("must be true".into())
            } else {
                None
            }
        }
    }
}

