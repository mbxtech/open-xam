pub trait EnumConverterTrait {
    fn convert_to_string(&self) -> &str;
    fn convert_from_string(value: &str) -> Self;
}
