use serde_json::Value;
use std::fs;

pub fn export_markdown(session_id: &str, messages: Vec<Value>) -> Result<String, String> {
    let mut md = format!("# 会话导出\n\n会话 ID: {}\n\n---\n\n", session_id);

    for msg in messages {
        let role = msg["role"].as_str().unwrap_or("unknown");
        let content = msg["content"].as_str().unwrap_or("");

        if role == "user" {
            md.push_str(&format!("## 👤 用户\n\n{}\n\n", content));
        } else {
            md.push_str(&format!("## 🤖 助手\n\n{}\n\n", content));
        }
    }

    Ok(md)
}

pub fn export_json(session_id: &str, messages: Vec<Value>) -> Result<String, String> {
    let data = serde_json::json!({
        "session_id": session_id,
        "messages": messages,
        "exported_at": chrono::Utc::now().to_rfc3339()
    });

    serde_json::to_string_pretty(&data).map_err(|e| e.to_string())
}
