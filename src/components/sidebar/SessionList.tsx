import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../../stores/chatStore";

const SIDEBAR_ITEMS = [
  { id: "skills", label: "技能" },
  { id: "apps", label: "应用" },
  { id: "automation", label: "自动化" },
];

const RECENT_ITEMS = [
  { id: "1", title: "React 状态管理讨论" },
  { id: "2", title: "Tauri 应用性能优化" },
];

export function SessionList({
  collapsed,
  onOpenSettings,
}: {
  collapsed: boolean;
  onOpenSettings: () => void;
}) {
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    addSession,
    setSessions,
    searchQuery,
    setSearchQuery,
  } = useChatStore();
  const [activeModule, setActiveModule] = useState(SIDEBAR_ITEMS[0].id);

  useEffect(() => {
    invoke<any[]>("list_sessions").then(setSessions);
  }, [setSessions]);

  useEffect(() => {
    if (sessions.length === 0 || activeSessionId) return;
    setActiveSession(sessions[0].id);
  }, [activeSessionId, sessions, setActiveSession]);

  const handleNewSession = async () => {
    const id = Date.now().toString();
    const session = await invoke<any>("create_session", { id });
    addSession(session);
  };

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery, sessions]
  );

  return (
    <div className="sidebar-content">
      {/* 顶部新对话按钮 */}
      <button onClick={handleNewSession} className="new-chat-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
        新对话 (New Chat)
      </button>

      {/* 技能/应用/自动化 */}
      <div className="sidebar-section">
        {SIDEBAR_ITEMS.map((module) => (
          <button
            key={module.id}
            className={`sidebar-item ${activeModule === module.id ? "active" : ""}`}
            onClick={() => setActiveModule(module.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {module.label}
          </button>
        ))}
      </div>

      {/* 最近对话 */}
      <div className="sidebar-section">
        <div className="section-title">最近对话 (RECENT)</div>
        {filteredSessions.map((sess) => (
            <button
              key={sess.id}
              onClick={() => setActiveSession(sess.id)}
              onMouseDown={(e) => e.stopPropagation()}
              className={`sidebar-item ${activeSessionId === sess.id ? "active" : ""}`}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {sess.title}
            </button>
        ))}
        {RECENT_ITEMS.map((item) => (
          <button
            key={item.id}
            className="sidebar-item"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {item.title}
          </button>
        ))}
      </div>

      {/* 搜索框 */}
      {!collapsed && (
        <label className="sidebar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            data-sidebar-search
            type="text"
            placeholder="搜索对话"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      )}

      {/* 底部 */}
      <div className="sidebar-footer">
        <button className="footer-btn" onClick={onOpenSettings} title="设置">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <button className="footer-btn" title="更多">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <circle cx="6" cy="12" r="2"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="18" cy="12" r="2"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}
