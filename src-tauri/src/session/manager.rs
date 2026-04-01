use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub title: String,
    pub cli_session_id: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionManager {
    pub sessions: HashMap<String, Session>,
    pub active_session_id: Option<String>,
    #[serde(skip)]
    pub storage_path: Option<PathBuf>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            active_session_id: None,
            storage_path: None,
        }
    }

    pub fn with_storage(storage_path: PathBuf) -> Self {
        let mut manager = Self {
            sessions: HashMap::new(),
            active_session_id: None,
            storage_path: Some(storage_path.clone()),
        };
        manager.load_from_disk();
        manager
    }

    pub fn create_session(&mut self, id: String) -> Session {
        let session = Session {
            id: id.clone(),
            title: "新对话".to_string(),
            cli_session_id: None,
            created_at: chrono::Utc::now().timestamp(),
        };
        self.sessions.insert(id.clone(), session.clone());
        self.active_session_id = Some(id);
        self.save_to_disk();
        session
    }

    pub fn delete_session(&mut self, id: &str) -> bool {
        if self.sessions.remove(id).is_some() {
            if self.active_session_id.as_deref() == Some(id) {
                self.active_session_id = None;
            }
            self.save_to_disk();
            true
        } else {
            false
        }
    }

    pub fn update_session_title(&mut self, id: &str, title: String) {
        if let Some(session) = self.sessions.get_mut(id) {
            session.title = title;
            self.save_to_disk();
        }
    }

    pub fn update_cli_session_id(&mut self, id: &str, cli_session_id: String) {
        if let Some(session) = self.sessions.get_mut(id) {
            session.cli_session_id = Some(cli_session_id);
            self.save_to_disk();
        }
    }

    pub fn get_session(&self, id: &str) -> Option<&Session> {
        self.sessions.get(id)
    }

    pub fn list_sessions(&self) -> Vec<Session> {
        let mut sessions: Vec<_> = self.sessions.values().cloned().collect();
        sessions.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        sessions
    }

    fn save_to_disk(&self) {
        if let Some(path) = &self.storage_path {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            if let Ok(json) = serde_json::to_string_pretty(self) {
                let _ = fs::write(path, json);
            }
        }
    }

    fn load_from_disk(&mut self) {
        if let Some(path) = &self.storage_path {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(loaded) = serde_json::from_str::<SessionManager>(&content) {
                    self.sessions = loaded.sessions;
                    self.active_session_id = loaded.active_session_id;
                }
            }
        }
    }
}
