import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../../stores/chatStore";
import { SessionExport } from "./SessionExport";
import { EmptySessionList, EmptySearchResult } from "../common/EmptyState";

export function SessionList({ onOpenSettings }: { onOpenSettings: () => void }) {
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    addSession,
    setSessions,
    sessionMessages,
    searchQuery,
    setSearchQuery,
    updateSessionTitle,
  } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    invoke<any[]>("list_sessions").then(setSessions);
  }, [setSessions]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSession(sessions[0].id);
    }
  }, [activeSessionId, sessions, setActiveSession]);

  const handleNewSession = async () => {
    const id = Date.now().toString();
    const session = await invoke<any>("create_session", { id });
    addSession(session);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这个会话吗？")) {
      const success = await invoke<boolean>("delete_session", { id });
      if (success) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSessions(remaining);
        if (activeSessionId === id) {
          setActiveSession(remaining[0]?.id || null);
        }
      }
    }
  };

  const handleRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveRename = async (id: string) => {
    if (editTitle.trim()) {
      updateSessionTitle(id, editTitle.trim());
      await invoke("update_session_title", { id, title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-nav-list">
        <button onClick={handleNewSession} className="sidebar-nav-item sidebar-nav-item-active">
          <span className="sidebar-nav-icon">✎</span>
          <span>新线程</span>
        </button>
        <div className="sidebar-nav-item sidebar-nav-item-muted">
          <span className="sidebar-nav-icon">◔</span>
          <span>会话</span>
        </div>
        <div className="sidebar-nav-item sidebar-nav-item-muted">
          <span className="sidebar-nav-icon">◫</span>
          <span>技能</span>
        </div>
      </div>

      <div className="sidebar-section-head">
        <div className="sidebar-section-label">
          <span>线程</span>
          <span>{filteredSessions.length}</span>
        </div>
        <label className="sidebar-search sidebar-search-compact">
          <span>⌕</span>
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="sidebar-workspace-label">ClaudeDesktop</div>

      <div className="sidebar-session-list">
        {sessions.length === 0 ? (
          <EmptySessionList onNewSession={handleNewSession} />
        ) : filteredSessions.length === 0 ? (
          <EmptySearchResult />
        ) : (
          filteredSessions.map((sess) => {
            const msgCount = sessionMessages[sess.id]?.length || 0;
            const date = new Date(sess.created_at * 1000).toLocaleDateString();
            const isActive = activeSessionId === sess.id;

            return (
              <div
                key={sess.id}
                onClick={() => !editingId && setActiveSession(sess.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !editingId) {
                    e.preventDefault();
                    setActiveSession(sess.id);
                  }
                }}
                className={`session-card ${isActive ? "session-card-active" : ""}`}
                role="button"
                tabIndex={0}
              >
                {editingId === sess.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveRename(sess.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename(sess.id)}
                    className="w-full rounded-xl border border-[var(--accent-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="session-card-head">
                      <div className="session-card-title truncate" onDoubleClick={() => handleRename(sess.id, sess.title)}>
                        {sess.title}
                      </div>
                      <div className="session-card-actions">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExportingId(sess.id);
                          }}
                          className="session-icon-button"
                          title="导出会话"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="session-icon-button"
                          title="删除会话"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="session-card-meta">
                      <span>{msgCount} 条消息</span>
                      <span>·</span>
                      <span>{date}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <button onClick={onOpenSettings} className="sidebar-nav-item">
          <span className="sidebar-nav-icon">⚙</span>
          <span>设置</span>
        </button>
      </div>

      {exportingId && <SessionExport sessionId={exportingId} onClose={() => setExportingId(null)} />}
    </aside>
  );
}
