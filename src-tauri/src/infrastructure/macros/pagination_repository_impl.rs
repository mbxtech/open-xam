#[macro_export]
macro_rules! pagination_repository_impl {

    // Internal implementation for base functionality (shared by all variants)
    (@impl_base
        table = $table:ident,
        model = $model:ty,
        path  = $path:path,

        join_clause   = [$($join:tt)*],
        select_expr   = [$($select:tt)*],
        result_ty     = $result_ty:ty
    ) => {
        use super::*;
        use diesel::sqlite::SqliteConnection as SQLiteConnection;
        use $crate::application::crud::crud_repository_trait::CRUDResult;
        use $crate::domain::model::page_options::PageOptions;
        use $crate::domain::model::paged_result::PagedResult;

        struct PaginationCalculationResult {
            offset: i64,
            total_pages: i64,
        }

        fn get_total_elements(conn: &mut SQLiteConnection) -> CRUDResult<i64> {
            use $crate::schema::$table::dsl::*;
            $table
                .select(diesel::dsl::count(id))
                .get_result::<i64>(conn)
                .map_err(|e| CRUDError::new(e.to_string(), None))
        }

        fn calculate_pagination(
            total_elements: i64,
            page_options: &PageOptions,
        ) -> PaginationCalculationResult {
            let total_pages =
                (total_elements as f64 / page_options.elements_per_page as f64).ceil() as i64;

            PaginationCalculationResult {
                offset: (page_options.page - 1) * page_options.elements_per_page,
                total_pages,
            }
        }

        pub fn find_all(
            conn: &mut SQLiteConnection,
            page_options: Option<PageOptions>,
        ) -> CRUDResult<PagedResult<$model>> {
            use $crate::schema::$table::dsl::*;

            let total_elements = get_total_elements(conn)?;

            if let Some(options) = page_options {
                let p = calculate_pagination(total_elements, &options);

                let result = $table
                    .order(id.desc())
                    .limit(options.elements_per_page)
                    .offset(p.offset)
                    .select(<$model>::as_select())
                    .load::<$model>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                return Ok(PagedResult::new(
                    result,
                    total_elements,
                    options.page,
                    p.total_pages,
                ));
            }

            let result = $table
                .select(<$model>::as_select())
                .load::<$model>(conn)
                .map_err(|e| CRUDError::new(e.to_string(), None))?;

            Ok(PagedResult::new(result, total_elements, 1, 1))
        }

        pub fn find_filtered(
            conn: &mut SQLiteConnection,
            filter: Box<
                dyn diesel::expression::BoxableExpression<
                    $path,
                    diesel::sqlite::Sqlite,
                    SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
                >,
            >,
            page_options: Option<PageOptions>,
        ) -> CRUDResult<PagedResult<$model>> {

            use $crate::schema::$table::dsl::*;
            let total_elements = get_total_elements(conn)?;

            if let Some(options) = page_options {
                let p = calculate_pagination(total_elements, &options);

                let result = $table
                    .filter(filter.as_ref())
                    .order(id.desc())
                    .limit(options.elements_per_page)
                    .offset(p.offset)
                    .select(<$model>::as_select())
                    .load::<$model>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                return Ok(PagedResult::new(
                    result,
                    total_elements,
                    options.page,
                    p.total_pages,
                ));
            }

            let result = $table
                .filter(filter.as_ref())
                .select(<$model>::as_select())
                .load::<$model>(conn)
                .map_err(|e| CRUDError::new(e.to_string(), None))?;

            Ok(PagedResult::new(result, total_elements, 1, 1))
        }


        pub fn find_all_with_join(
            conn: &mut SQLiteConnection,
            page_options: Option<PageOptions>,
        ) -> CRUDResult<PagedResult<$result_ty>> {

            use $crate::schema::$table::dsl::*;

            let total_elements = get_total_elements(conn)?;

            if let Some(options) = page_options {
                let p = calculate_pagination(total_elements, &options);

                let result = $table
                $($join)*
                    .order(id.desc())
                    .limit(options.elements_per_page)
                    .offset(p.offset)
                    .select($($select)*)
                    .load::<$result_ty>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                return Ok(PagedResult::new(
                    result,
                    total_elements,
                    options.page,
                    p.total_pages,
                ));
            }

            let result = $table
            $($join)*
                .select($($select)*)
                .load::<$result_ty>(conn)
                .map_err(|e| CRUDError::new(e.to_string(), None))?;

            Ok(PagedResult::new(result, total_elements, 1, 1))
        }
    };


    // Macro without a join clause
    ($table:ident, $model:ty, $path:path) => {
        pub mod $table {
            $crate::pagination_repository_impl! {
                @impl_base
                table = $table,
                model = $model,
                path  = $path,

                join_clause = [],
                select_expr = [<$model>::as_select()],
                result_ty   = $model
            }
        }
    };


    // Macro with a left join clause
    ($table:ident, $model:ty, $path:path, left_join: $join_table:ident, $join_model:ty) => {
        pub mod $table {
            $crate::pagination_repository_impl! {
                @impl_base
                table = $table,
                model = $model,
                path  = $path,

                join_clause = [
                    .left_join($crate::schema::$join_table::dsl::$join_table)
                ],

                select_expr = [
                    (<$model>::as_select(), Option::<$join_model>::as_select())
                ],

                result_ty = ($model, Option<$join_model>)
            }

            pub fn find_filtered_with_join(
                conn: &mut diesel::sqlite::SqliteConnection,
                filter: Box<
                    dyn diesel::expression::BoxableExpression<
                        diesel::helper_types::LeftJoinQuerySource<
                            $crate::schema::$table::table,
                            $crate::schema::$join_table::table
                        >,
                        diesel::sqlite::Sqlite,
                        SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
                    >,
                >,
                page_options: Option<$crate::domain::model::page_options::PageOptions>,
            ) -> $crate::application::crud::crud_repository_trait::CRUDResult<
                $crate::domain::model::paged_result::PagedResult<($model, Option<$join_model>)>
            > {
                use $crate::schema::$table::dsl::*;
                use $crate::application::crud::crud_repository_trait::CRUDError;
                use diesel::prelude::*;

                let total_elements = $table
                    .select(diesel::dsl::count(id))
                    .get_result::<i64>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                if let Some(options) = page_options {
                    let total_pages =
                        (total_elements as f64 / options.elements_per_page as f64).ceil() as i64;
                    let offset = (options.page - 1) * options.elements_per_page;

                    let result = $table
                        .left_join($crate::schema::$join_table::dsl::$join_table)
                        .filter(filter.as_ref())
                        .order(id.desc())
                        .limit(options.elements_per_page)
                        .offset(offset)
                        .select((<$model>::as_select(), Option::<$join_model>::as_select()))
                        .load::<($model, Option<$join_model>)>(conn)
                        .map_err(|e| CRUDError::new(e.to_string(), None))?;

                    return Ok($crate::domain::model::paged_result::PagedResult::new(
                        result,
                        total_elements,
                        options.page,
                        total_pages,
                    ));
                }

                let result = $table
                    .left_join($crate::schema::$join_table::dsl::$join_table)
                    .filter(filter.as_ref())
                    .select((<$model>::as_select(), Option::<$join_model>::as_select()))
                    .load::<($model, Option<$join_model>)>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                Ok($crate::domain::model::paged_result::PagedResult::new(result, total_elements, 1, 1))
            }
        }
    };

    //Macro with an inner join clause
    ($table:ident, $model:ty, $path:path, inner_join: $join_table:ident, $join_model:ty) => {
        pub mod $table {
            $crate::pagination_repository_impl! {
                @impl_base
                table = $table,
                model = $model,
                path  = $path,

                join_clause = [
                    .inner_join($crate::schema::$join_table::dsl::$join_table)
                ],

                select_expr = [
                    (<$model>::as_select(), <$join_model>::as_select())
                ],

                result_ty = ($model, $join_model)
            }

            pub fn find_filtered_with_join(
                conn: &mut diesel::sqlite::SqliteConnection,
                filter: Box<
                    dyn diesel::expression::BoxableExpression<
                        diesel::helper_types::InnerJoinQuerySource<
                            $crate::schema::$table::table,
                            $crate::schema::$join_table::table
                        >,
                        diesel::sqlite::Sqlite,
                        SqlType = diesel::sql_types::Nullable<diesel::sql_types::Bool>,
                    >,
                >,
                page_options: Option<$crate::domain::model::page_options::PageOptions>,
            ) -> $crate::application::crud::crud_repository_trait::CRUDResult<
                $crate::domain::model::paged_result::PagedResult<($model, $join_model)>
            > {
                use $crate::schema::$table::dsl::*;
                use $crate::application::crud::crud_repository_trait::CRUDError;
                use diesel::prelude::*;

                let total_elements = $table
                    .select(diesel::dsl::count(id))
                    .get_result::<i64>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                if let Some(options) = page_options {
                    let total_pages =
                        (total_elements as f64 / options.elements_per_page as f64).ceil() as i64;
                    let offset = (options.page - 1) * options.elements_per_page;

                    let result = $table
                        .inner_join($crate::schema::$join_table::dsl::$join_table)
                        .filter(filter.as_ref())
                        .order(id.desc())
                        .limit(options.elements_per_page)
                        .offset(offset)
                        .select((<$model>::as_select(), <$join_model>::as_select()))
                        .load::<($model, $join_model)>(conn)
                        .map_err(|e| CRUDError::new(e.to_string(), None))?;

                    return Ok($crate::domain::model::paged_result::PagedResult::new(
                        result,
                        total_elements,
                        options.page,
                        total_pages,
                    ));
                }

                let result = $table
                    .inner_join($crate::schema::$join_table::dsl::$join_table)
                    .filter(filter.as_ref())
                    .select((<$model>::as_select(), <$join_model>::as_select()))
                    .load::<($model, $join_model)>(conn)
                    .map_err(|e| CRUDError::new(e.to_string(), None))?;

                Ok($crate::domain::model::paged_result::PagedResult::new(result, total_elements, 1, 1))
            }
        }
    };
}
