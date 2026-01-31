use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields, LitStr};
use syn::spanned::Spanned;

#[proc_macro_derive(FieldNames)]
pub fn field_names_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    // Collect field names and types as string literals
    let (field_names, field_types) = match &input.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    let names: Vec<LitStr> = fields
                        .named
                        .iter()
                        .filter_map(|f| f.ident.as_ref())
                        .map(|ident| LitStr::new(&ident.to_string(), ident.span()))
                        .collect();

                    let types: Vec<LitStr> = fields
                        .named
                        .iter()
                        .map(|f| {
                            let ty = &f.ty;
                            // Render the type into a string the same way Rust would pretty-print it
                            let ty_str = quote! { #ty }.to_string();
                            LitStr::new(&ty_str, ty.span())
                        })
                        .collect();

                    (
                        quote! { &[#(#names),*] },
                        quote! { &[#(#types),*] },
                    )
                }
                Fields::Unnamed(_) => {
                    (quote! { &[] }, quote! { &[] })
                }
                Fields::Unit => {
                    (quote! { &[] }, quote! { &[] })
                }
            }
        }
        _ => {
            (quote! { &[] }, quote! { &[] })
        }
    };

    let expanded = quote! {
        impl #name {
            pub const fn field_names() -> &'static [&'static str] {
                #field_names
            }

            pub fn field_count() -> usize {
                Self::field_names().len()
            }

            pub fn has_field(name: &str) -> bool {
                Self::field_names().contains(&name)
            }

            pub const fn field_types() -> &'static [&'static str] {
                #field_types
            }

            pub fn fields_with_types() -> ::std::vec::Vec<(&'static str, &'static str)> {
                let names = Self::field_names();
                let types = Self::field_types();
                names.iter().copied().zip(types.iter().copied()).collect()
            }
        }
    };

    TokenStream::from(expanded)
}