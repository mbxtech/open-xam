#[cfg(test)]
mod tests {
    use field_names::FieldNames;

    #[derive(FieldNames)]
    struct Order {
        id: i32,
        status: String,
        amount: f32,
    }
    #[derive(FieldNames)]
    struct User {
        username: String,
        email: String,
    }

    #[test]
    fn test_user_field_names() {
        let fields = User::field_names();
        assert_eq!(fields.len(), 2);
        assert!(fields.contains(&"username"));
        assert!(fields.contains(&"email"));
    }

    #[test]
    fn test_order_extended() {
        assert_eq!(Order::field_count(), 3);
        assert!(Order::has_field("status"));
        assert!(!Order::has_field("nonexistent"));

        let fields_with_types = Order::fields_with_types();
        assert_eq!(fields_with_types.len(), 3);
        assert!(fields_with_types.contains(&("id", "i32")));
        assert!(fields_with_types.contains(&("amount", "f32")));
    }
}
