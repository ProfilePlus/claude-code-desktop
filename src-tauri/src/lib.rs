mod process;
mod session;
mod utils;

use process::bridge;
use session::{Session, SessionManager, export};
use tauri::{AppHandle, Manager, State};
use std::sync::Mutex;
use serde_json::Value;

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
            create_session,
            list_sessions,
            update_session_title,
            delete_session,
            read_image_base64,
            export_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
