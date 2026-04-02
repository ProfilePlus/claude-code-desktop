mod process;
mod session;
mod utils;

use process::bridge;
use session::{Session, SessionManager, export};
use tauri::{AppHandle, Manager, State};
use std::sync::Mutex;
use serde_json::Value;
use std::collections::HashSet;
use std::path::PathBuf;

#[derive(serde::Serialize)]
struct ModelOption {
    id: String,
    name: String,
    context: String,
}

fn to_display_name(model_id: &str) -> String {
    if model_id.eq_ignore_ascii_case("minimax-m2.7") {
        return "Glass-4 Turbo".to_string();
    }

    model_id
        .split(['-', '_'])
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => format!("{}{}", first.to_uppercase(), chars.as_str()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn push_unique_model(
    models: &mut Vec<ModelOption>,
    seen: &mut HashSet<String>,
    model_id: &str,
    context: &str,
) {
    let trimmed = model_id.trim();
    if trimmed.is_empty() {
        return;
    }

    let key = trimmed.to_lowercase();
    if seen.contains(&key) {
        return;
    }

    seen.insert(key);
    models.push(ModelOption {
        id: trimmed.to_string(),
        name: to_display_name(trimmed),
        context: context.to_string(),
    });
}

fn collect_models_from_settings(path: &PathBuf, models: &mut Vec<ModelOption>, seen: &mut HashSet<String>) {
    let raw = match std::fs::read_to_string(path) {
        Ok(content) => content,
        Err(_) => return,
    };

    let json = match serde_json::from_str::<Value>(&raw) {
        Ok(value) => value,
        Err(_) => return,
    };

    if let Some(model) = json.get("model").and_then(|v| v.as_str()) {
        push_unique_model(models, seen, model, "配置");
    }

    if let Some(env) = json.get("env").and_then(|v| v.as_object()) {
        for (key, value) in env {
            if !key.ends_with("_MODEL") && key != "ANTHROPIC_MODEL" && key != "ANTHROPIC_REASONING_MODEL" {
                continue;
            }

            if let Some(model) = value.as_str() {
                let context = if key == "ANTHROPIC_REASONING_MODEL" { "推理" } else { "配置" };
                push_unique_model(models, seen, model, context);
            }
        }
    }
}

#[tauri::command]
fn list_configured_models() -> Result<Vec<ModelOption>, String> {
    let mut models = Vec::<ModelOption>::new();
    let mut seen = HashSet::<String>::new();

    // User-level Claude settings, e.g. C:\Users\<name>\.claude\settings.json
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        let settings_path = PathBuf::from(user_profile).join(".claude").join("settings.json");
        collect_models_from_settings(&settings_path, &mut models, &mut seen);
    }

    // Project-level Claude settings, e.g. <cwd>\.claude\settings.json
    if let Ok(cwd) = std::env::current_dir() {
        let project_settings = cwd.join(".claude").join("settings.json");
        collect_models_from_settings(&project_settings, &mut models, &mut seen);
    }

    // Fallback aliases if settings has no explicit model config.
    if models.is_empty() {
        for fallback in ["opus", "sonnet", "haiku"] {
            push_unique_model(&mut models, &mut seen, fallback, "默认");
        }
    }

    Ok(models)
}

#[tauri::command]
async fn send_message_stream(
    app: AppHandle,
    prompt: String,
    session_id: String,
    cli_session_id: Option<String>,
    images: Option<Vec<bridge::ImageContent>>,
    model: Option<String>,
    session_manager: State<'_, Mutex<SessionManager>>,
) -> Result<String, String> {
    let new_cli_session_id = bridge::send_message_stream(app, prompt, session_id.clone(), cli_session_id, images, model).await?;

    if !new_cli_session_id.is_empty() {
        let mut manager = session_manager.lock().unwrap();
        manager.update_cli_session_id(&session_id, new_cli_session_id.clone());
    }

    Ok(new_cli_session_id)
}

#[tauri::command]
fn create_session(session_manager: State<'_, Mutex<SessionManager>>, id: String) -> Result<Session, String> {
    let mut manager = session_manager.lock().unwrap();
    Ok(manager.create_session(id))
}

#[tauri::command]
fn list_sessions(session_manager: State<'_, Mutex<SessionManager>>) -> Result<Vec<Session>, String> {
    let manager = session_manager.lock().unwrap();
    Ok(manager.list_sessions())
}

#[tauri::command]
fn update_session_title(session_manager: State<'_, Mutex<SessionManager>>, id: String, title: String) -> Result<(), String> {
    let mut manager = session_manager.lock().unwrap();
    manager.update_session_title(&id, title);
    Ok(())
}

#[tauri::command]
fn delete_session(session_manager: State<'_, Mutex<SessionManager>>, id: String) -> Result<bool, String> {
    let mut manager = session_manager.lock().unwrap();
    Ok(manager.delete_session(&id))
}

#[tauri::command]
fn read_image_base64(path: String) -> Result<(String, String), String> {
    utils::image::read_image_as_base64(&path)
}

#[tauri::command]
fn export_session(session_id: String, messages: Vec<Value>, format: String) -> Result<String, String> {
    match format.as_str() {
        "markdown" => export::export_markdown(&session_id, messages),
        "json" => export::export_json(&session_id, messages),
        _ => Err("Unsupported format".to_string())
    }
}

#[tauri::command]
fn debug_window_action_log(line: String) -> Result<(), String> {
    println!("{line}");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            let sessions_path = app_data_dir.join("sessions.json");
            let session_manager = SessionManager::with_storage(sessions_path);
            app.manage(Mutex::new(session_manager));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_message_stream,
            list_configured_models,
            create_session,
            list_sessions,
            update_session_title,
            delete_session,
            read_image_base64,
            export_session,
            debug_window_action_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
