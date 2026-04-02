# 会话跟随项目（目录）绑定功能设计方案

## 一、需求背景

用户希望实现类似 Codex 的功能：每次新对话都可以选择绑定到某个项目目录，后续对话可以基于该项目上下文。

## 二、数据模型设计

### 2.1 Rust 端（后端）

**新增 Project 结构体** (`src-tauri/src/project/mod.rs`):

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,        // 工作目录绝对路径
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectManager {
    pub projects: HashMap<String, Project>,
    #[serde(skip)]
    pub storage_path: Option<PathBuf>,
}

impl ProjectManager {
    pub fn new() -> Self {
        Self {
            projects: HashMap::new(),
            storage_path: None,
        }
    }

    pub fn with_storage(storage_path: PathBuf) -> Self {
        let mut manager = Self {
            projects: HashMap::new(),
            storage_path: Some(storage_path.clone()),
        };
        manager.load_from_disk();
        manager
    }

    pub fn create_project(&mut self, id: String, name: String, path: String) -> Project {
        let project = Project {
            id: id.clone(),
            name,
            path,
            created_at: chrono::Utc::now().timestamp(),
        };
        self.projects.insert(id.clone(), project.clone());
        self.save_to_disk();
        project
    }

    pub fn list_projects(&self) -> Vec<Project> {
        let mut projects: Vec<_> = self.projects.values().cloned().collect();
        projects.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        projects
    }

    pub fn delete_project(&mut self, id: &str) -> bool {
        if self.projects.remove(id).is_some() {
            self.save_to_disk();
            true
        } else {
            false
        }
    }

    pub fn get_project(&self, id: &str) -> Option<&Project> {
        self.projects.get(id)
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
                if let Ok(loaded) = serde_json::from_str::<ProjectManager>(&content) {
                    self.projects = loaded.projects;
                }
            }
        }
    }
}
```

**修改 Session 结构体**（在 `session/manager.rs` 中添加 `project_id` 字段）:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub title: String,
    pub cli_session_id: Option<String>,
    pub project_id: Option<String>,  // 新增：关联的项目ID
    pub created_at: i64,
}

impl SessionManager {
    // 在 create_session 时可选接受 project_id
    pub fn create_session(&mut self, id: String, project_id: Option<String>) -> Session {
        let session = Session {
            id: id.clone(),
            title: "新对话".to_string(),
            cli_session_id: None,
            project_id,  // 新增
            created_at: chrono::Utc::now().timestamp(),
        };
        // ...
    }

    // 新增：绑定项目到会话
    pub fn bind_project(&mut self, session_id: &str, project_id: Option<String>) {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.project_id = project_id;
            self.save_to_disk();
        }
    }
}
```

### 2.2 TypeScript 端（前端）

**新增 projectStore** (`src/stores/projectStore.ts`):

```typescript
import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: number;
}

interface ProjectStore {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
}

const PROJECT_STORAGE_KEY = "claude-desktop-projects";

function loadStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(PROJECT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function persistProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: loadStoredProjects(),

  setProjects: (projects) => {
    persistProjects(projects);
    set({ projects });
  },

  addProject: (project) => set((s) => {
    const next = [project, ...s.projects];
    persistProjects(next);
    return { projects: next };
  }),

  removeProject: (id) => set((s) => {
    const next = s.projects.filter((p) => p.id !== id);
    persistProjects(next);
    return { projects: next };
  }),
}));
```

**修改 chatStore** (`src/stores/chatStore.ts`):

```typescript
// 在 Session 接口中添加 project_id
export interface Session {
  id: string;
  title: string;
  cli_session_id?: string;
  project_id?: string;  // 新增
  created_at: number;
}

// 新增 action
interface ChatStore {
  // ... 现有字段
  bindProject: (sessionId: string, projectId: string | null) => void;
}

// 实现
bindProject: (sessionId, projectId) => set((s) => ({
  sessions: s.sessions.map((sess) =>
    sess.id === sessionId ? { ...sess, project_id: projectId } : sess
  )
})),
```

## 三、前端 UI 交互流程

### 3.1 新对话创建流程

```
用户点击"新对话"按钮
       │
       ▼
┌─────────────────────────┐
│   项目选择模态框          │
├─────────────────────────┤
│ [最近项目]               │
│  ○ 项目A (/path/to/a)   │
│  ○ 项目B (/path/to/b)   │
├─────────────────────────┤
│ [+ 新建项目]            │
├─────────────────────────┤
│ [ ] 不同步项目          │  ← 默认选项
├─────────────────────────┤
│    [取消]  [确定]       │
└─────────────────────────┘
```

### 3.2 项目选择组件实现

**新增组件** `src/components/project/ProjectSelectorModal.tsx`:

```tsx
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useProjectStore, Project } from "../../stores/projectStore";

interface ProjectSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId: string | null) => void;
}

export function ProjectSelectorModal({ open, onClose, onSelect }: ProjectSelectorModalProps) {
  const { projects, addProject } = useProjectStore();
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateProject = async () => {
    // 打开目录选择对话框
    const selected = await open({
      directory: true,
      multiple: false,
      title: "选择项目目录",
    });

    if (selected && typeof selected === "string") {
      const id = Date.now().toString();
      const name = newProjectName.trim() || selected.split(/[\\/]/).pop() || "新项目";

      const project: Project = {
        id,
        name,
        path: selected,
        createdAt: Date.now(),
      };

      // 调用后端保存
      await invoke("create_project", {
        id,
        name,
        path: selected,
      });

      addProject(project);
      onSelect(id);
    }
    setCreating(false);
    setNewProjectName("");
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>选择关联项目</h3>

        {/* 最近项目列表 */}
        <div className="project-list">
          {projects.map((project) => (
            <button
              key={project.id}
              className="project-item"
              onClick={() => onSelect(project.id)}
            >
              <span className="project-name">{project.name}</span>
              <span className="project-path">{project.path}</span>
            </button>
          ))}
        </div>

        {/* 新建项目 */}
        {creating ? (
          <div className="create-project-form">
            <input
              type="text"
              placeholder="项目名称（可选）"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button onClick={handleCreateProject}>选择目录</button>
            <button onClick={() => setCreating(false)}>取消</button>
          </div>
        ) : (
          <button className="create-project-btn" onClick={() => setCreating(true)}>
            + 新建项目
          </button>
        )}

        {/* 不绑定项目选项 */}
        <button
          className="skip-project-btn"
          onClick={() => onSelect(null)}
        >
          不同步项目（创建空白对话）
        </button>

        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}
```

### 3.3 修改 SessionList 组件

**修改** `src/components/sidebar/SessionList.tsx`:

```tsx
// 在组件中添加
const [showProjectModal, setShowProjectModal] = useState(false);

const handleNewSession = async (projectId: string | null) => {
  try {
    const id = Date.now().toString();
    // 传递 project_id 到后端
    const session = await invoke<any>("create_session", {
      id,
      projectId  // 新增
    });
    addSession(session);
  } catch (err) {
    console.error("Failed to create session:", err);
  }
  setShowProjectModal(false);
};

// 新对话按钮改为打开模态框
<button onClick={() => setShowProjectModal(true)} className="new-chat-btn">
  <svg>...</svg>
  新对话
</button>

// 添加模态框
<ProjectSelectorModal
  open={showProjectModal}
  onClose={() => setShowProjectModal(false)}
  onSelect={handleNewSession}
/>
```

## 四、关键 API 设计（Tauri Commands）

### 4.1 后端新增命令

**修改** `src-tauri/src/lib.rs`:

```rust
mod project;  // 新增

use project::{Project, ProjectManager};
use std::sync::Mutex;

#[tauri::command]
fn create_project(
    project_manager: State<'_, Mutex<ProjectManager>>,
    id: String,
    name: String,
    path: String,
) -> Result<Project, String> {
    let mut manager = project_manager.lock().unwrap();
    Ok(manager.create_project(id, name, path))
}

#[tauri::command]
fn list_projects(project_manager: State<'_, Mutex<ProjectManager>>) -> Result<Vec<Project>, String> {
    let manager = project_manager.lock().unwrap();
    Ok(manager.list_projects())
}

#[tauri::command]
fn delete_project(project_manager: State<'_, Mutex<ProjectManager>>, id: String) -> Result<bool, String> {
    let mut manager = project_manager.lock().unwrap();
    Ok(manager.delete_project(&id))
}

#[tauri::command]
fn create_session(
    session_manager: State<'_, Mutex<SessionManager>>,
    id: String,
    project_id: Option<String>,  // 新增参数
) -> Result<Session, String> {
    let mut manager = session_manager.lock().unwrap();
    Ok(manager.create_session(id, project_id))
}

#[tauri::command]
fn bind_session_project(
    session_manager: State<'_, Mutex<SessionManager>>,
    session_id: String,
    project_id: Option<String>,
) -> Result<(), String> {
    let mut manager = session_manager.lock().unwrap();
    manager.bind_project(&session_id, project_id);
    Ok(())
}
```

### 4.2 Tauri Setup 修改

```rust
.setup(|app| {
    let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");

    // Session 管理
    let sessions_path = app_data_dir.join("sessions.json");
    let session_manager = SessionManager::with_storage(sessions_path);
    app.manage(Mutex::new(session_manager));

    // Project 管理
    let projects_path = app_data_dir.join("projects.json");
    let project_manager = ProjectManager::with_storage(projects_path);
    app.manage(Mutex::new(project_manager));

    Ok(())
})
.invoke_handler(tauri::generate_handler![
    // ... 现有命令
    create_project,
    list_projects,
    delete_project,
    bind_session_project,
]))
```

## 五、持久化存储

### 5.1 存储文件结构

```
# Windows: %APPDATA%/com.claudedesktop/
# macOS: ~/Library/Application Support/com.claudedesktop/

app_data_dir/
├── sessions.json   # 会话数据（含 project_id）
└── projects.json   # 项目数据
```

### 5.2 sessions.json 示例

```json
{
  "sessions": {
    "1712120000000": {
      "id": "1712120000000",
      "title": "优化登录页面",
      "cli_session_id": "sess_abc123",
      "project_id": "1712110000000",
      "created_at": 1712120000
    }
  },
  "active_session_id": "1712120000000"
}
```

### 5.3 projects.json 示例

```json
{
  "projects": {
    "1712110000000": {
      "id": "1712110000000",
      "name": "GlassChat",
      "path": "D:\\AI\\GlassChat",
      "created_at": 1712110000
    }
  }
}
```

## 六、ChatView 中的项目上下文使用

在发送消息时，需要将项目路径传递给后端：

```typescript
// src/components/chat/ChatView.tsx 或相关调用位置

const sendMessage = async (prompt: string) => {
  const session = sessions.find(s => s.id === activeSessionId);
  const projectId = session?.project_id;

  // 获取项目信息
  let projectPath = undefined;
  if (projectId) {
    const projects = await invoke<Project[]>("list_projects");
    const project = projects.find(p => p.id === projectId);
    projectPath = project?.path;
  }

  await invoke("send_message_stream", {
    prompt,
    sessionId: activeSessionId,
    projectPath,  // 传递给后端
    // ... 其他参数
  });
};
```

后端 `send_message_stream` 在调用 Claude CLI 时可以使用该项目路径作为工作目录。

## 七、实现步骤建议

### Phase 1: 基础设施（1-2天）
1. 创建 `src-tauri/src/project/mod.rs` 和 `manager.rs`
2. 在 `lib.rs` 中注册 ProjectManager 和相关 commands
3. 创建 `src/stores/projectStore.ts`

### Phase 2: 核心功能（2-3天）
1. 修改 `Session` 结构体添加 `project_id` 字段
2. 修改 `create_session` command 支持 project_id
3. 创建 `ProjectSelectorModal.tsx` 组件
4. 修改 `SessionList.tsx` 集成项目选择

### Phase 3: 体验优化（1-2天）
1. 在侧边栏显示当前会话关联的项目信息
2. 支持在会话详情中切换/解绑项目
3. 项目列表按最近使用排序

### Phase 4: 与 Claude CLI 集成（1-2天）
1. 修改 `send_message_stream` 支持 projectPath 参数
2. 在调用 Claude CLI 时设置正确的工作目录

## 八、关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/src/project/mod.rs` | 新增 | Project 模块入口 |
| `src-tauri/src/project/manager.rs` | 新增 | ProjectManager 实现 |
| `src-tauri/src/session/manager.rs` | 修改 | Session 添加 project_id |
| `src-tauri/src/lib.rs` | 修改 | 注册新 commands |
| `src/stores/projectStore.ts` | 新增 | 前端项目状态管理 |
| `src/stores/chatStore.ts` | 修改 | Session 接口添加 project_id |
| `src/components/project/ProjectSelectorModal.tsx` | 新增 | 项目选择弹窗 |
| `src/components/sidebar/SessionList.tsx` | 修改 | 集成项目选择 |
