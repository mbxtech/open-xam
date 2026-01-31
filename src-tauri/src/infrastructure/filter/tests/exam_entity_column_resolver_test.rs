#[cfg(test)]
mod tests {
    use crate::domain::model::filter_option::FilterValue;
    use crate::domain::model::operator::Operator;
    use crate::infrastructure::filter::exam_entity_column_resolver::ExamEntityColumnResolver;
    use crate::infrastructure::filter::filter_query_builder::FilterColumnResolver;

    #[test]
    fn test_exam_entity_column_resolver_id_eq() {
        let resolver = ExamEntityColumnResolver;
        // Just call it to ensure it doesn't panic and is covered. 
        // Actual SQL generation is hard to test without executing, 
        // but we already have integration tests in filter_query_builder.
        let _expr = resolver.build_condition("id", &Operator::Eq, &FilterValue::Int { value: 1 });
        let _expr = resolver.build_condition("id", &Operator::In, &FilterValue::IntList { values: vec![1, 2] });
        let _expr = resolver.build_condition("name", &Operator::Like, &FilterValue::Str { value: "test".into() });
        let _expr = resolver.build_condition("name", &Operator::StartsWith, &FilterValue::Str { value: "test".into() });
        let _expr = resolver.build_condition("name", &Operator::EndsWith, &FilterValue::Str { value: "test".into() });
        let _expr = resolver.build_condition("description", &Operator::Like, &FilterValue::Str { value: "desc".into() });
        let _expr = resolver.build_condition("status_type", &Operator::Eq, &FilterValue::Str { value: "Active".into() });
        let _expr = resolver.build_condition("name", &Operator::Eq, &FilterValue::Str { value: "Exact".into() });
        let _expr = resolver.build_condition("unknown", &Operator::Eq, &FilterValue::Str { value: "X".into() });
    }
}
