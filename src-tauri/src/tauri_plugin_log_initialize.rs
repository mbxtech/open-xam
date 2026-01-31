use chrono::{Datelike, Local, Timelike};
use dirs::home_dir;
use std::path::{Path, PathBuf};
use tauri_plugin_log::{Builder, RotationStrategy, Target, TargetKind};

fn get_formatted_date_str() -> String {
    let now = Local::now();
    let formatted = format!(
        "{}-{:02}-{:02} {:02}:{:02}:{:02}",
        now.year(),
        now.month(),
        now.day(),
        now.hour(),
        now.minute(),
        now.second()
    );
    formatted
}

fn is_prod_build() -> bool {
    !cfg!(debug_assertions) && !cfg!(dev)
}

fn get_log_file_path() -> Result<String, String> {
    let home = home_dir().expect("Failed to resolve home directory for logs");
    let sub_path = ".open-xam-logs";
    let completed_path = Path::new(&home).join(sub_path);

    if !completed_path.exists() {
        std::fs::create_dir_all(&completed_path).expect("Failed to create log directory: {}");
    }
    
    let Some(completed_path) = completed_path.to_str() else { return Err("Failed to convert path to string".to_string()) };

    Ok(completed_path.to_string())
}

fn get_log_file_name() -> String {
    let which = if is_prod_build() { "app" } else { "dev" };
    let date = Local::now().format("%Y-%m-%d");
    format!("open-xam_{which}_{date}")
}

pub fn initialize_log_builder() -> Builder {
    
    let log_file_path = get_log_file_path().expect("Failed to get log file path");
    let log_file_name = Some(get_log_file_name());
    let log_path = PathBuf::from(&log_file_path);
    
    Builder::new()
        .targets(if is_prod_build() {
            vec![Target::new(TargetKind::Folder {
                path: log_path,
                file_name: log_file_name,
            })]
        } else {
            vec![
                Target::new(TargetKind::Webview),
                Target::new(TargetKind::Stdout),
                Target::new(TargetKind::Folder {
                    path: log_path,
                    file_name: log_file_name,
                }),
            ]
        })
        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
        .rotation_strategy(RotationStrategy::KeepOne)
        .max_file_size(20_000_000)
        .level(log::LevelFilter::max())
        .format(|out, message, record| {
            out.finish(format_args!(
                "[{}][{: <5}] {}",
                get_formatted_date_str(),
                record.level(),
                message
            ))
        })
}