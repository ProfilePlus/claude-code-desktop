import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../../stores/chatStore";

const PLACEHOLDER_MODULES = [
  { id: "skills", label: "Skills（预留）" },
  { id: "mcp", label: "MCP（预留）" },
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
    sessionMessages,
    searchQuery,
    setSearchQuery,
  } = useChatStore();
  const [activeModule, setActiveModule] = useState(PLACEHOLDER_MODULES[0].id);

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
    <aside className={`desktop-sidebar glasschat-sidebar ${collapsed ? "desktop-sidebar-collapsed" : ""}`}>
      <div className="glasschat-sidebar-top">
        <button onClick={handleNewSession} className="glasschat-new-chat">
          <span>＋</span>
          {!collapsed && <span>新对话 (New Chat)</span>}
        </button>

        {!collapsed && (
          <>
            <div className="glasschat-sidebar-group">
              <div className="glasschat-sidebar-label">能力入口 (MODULES)</div>
              <div className="glasschat-variant-list">
                {PLACEHOLDER_MODULES.map((module) => (
                  <button
                    key={module.id}
                    className={`glasschat-variant-item ${
                      activeModule === module.id ? "glasschat-variant-item-active" : ""
                    }`}
                    onClick={() => setActiveModule(module.id)}
                  >
                    <span className="glasschat-variant-dot">▢</span>
                    <span>{module.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="sidebar-search glasschat-sidebar-search">
              <span>⌕</span>
              <input
                data-sidebar-search
                type="text"
                placeholder="搜索对话"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <div className="glasschat-sidebar-group">
              <div className="glasschat-sidebar-label">最近对话 (RECENT)</div>
              <div className="sidebar-session-list glasschat-session-list">
                {filteredSessions.map((sess) => {
                  const msgCount = sessionMessages[sess.id]?.length || 0;
                  const latestPreview =
                    [...(sessionMessages[sess.id] || [])].reverse().find((msg) => msg.content.trim())?.content ||
                    "开始新的对话";

                  return (
                    <button
                      key={sess.id}
                      onClick={() => setActiveSession(sess.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`session-card ${activeSessionId === sess.id ? "session-card-active" : ""}`}
                      type="button"
                    >
                      <div className="session-card-head">
                        <div className="session-card-title">{sess.title}</div>
                      </div>
                      <div className="session-card-meta">
                        <span>{new Date(sess.created_at * 1000).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{msgCount} 条消息</span>
                      </div>
                      <div className="session-card-preview">{latestPreview}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="glasschat-sidebar-bottom">
        <div className="glasschat-made-with">Made with Visily</div>
        <div className="glasschat-sidebar-actions">
          <button onClick={onOpenSettings} className="sidebar-settings-button glasschat-sidebar-action">
            <span>⚙</span>
            {!collapsed && <span>设置</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
