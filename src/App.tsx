import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChatView } from "./components/chat/ChatView";
import { SessionList } from "./components/sidebar/SessionList";
import { ToastContainer } from "./components/common/Toast";
import { SettingsModal } from "./components/settings/SettingsModal";
import { useChatStore } from "./stores/chatStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useKeyboard } from "./hooks/useKeyboard";

function App() {
  const appWindow = useMemo(() => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  }, []);
  const { toasts, removeToast, addToast, addSession } = useChatStore();
  const { settings } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [windowMaximized, setWindowMaximized] = useState(false);
  const windowActionSeqRef = useRef(0);
  const windowActionInFlightRef = useRef<{ id: number; action: string } | null>(null);

  const emitWindowLog = useCallback((phase: string, details: Record<string, unknown> = {}) => {
    const stamp = new Date().toISOString();
    const perfNow = performance.now().toFixed(2);
    const line = `[window-debug] ${stamp} perf=${perfNow} phase=${phase} ${JSON.stringify(details)}`;

    console.log(line);
    void invoke("debug_window_action_log", { line }).catch((error) => {
      console.error("[window-debug] failed to forward log:", error);
    });
  }, []);

  const syncWindowState = useCallback(
    async (reason: string) => {
      if (!appWindow) {
        emitWindowLog("sync:skipped", { reason, cause: "no-app-window" });
        return null;
      }

      const startedAt = performance.now();
      emitWindowLog("sync:start", { reason });

      try {
        const maximized = await appWindow.isMaximized();
        const durationMs = Number((performance.now() - startedAt).toFixed(2));

        setWindowMaximized(maximized);
        emitWindowLog("sync:done", { reason, maximized, durationMs });
        return maximized;
      } catch (error) {
        emitWindowLog("sync:error", {
          reason,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          error: String(error),
        });
        return null;
      }
    },
    [appWindow, emitWindowLog]
  );

  useKeyboard({
    "Ctrl+n": async () => {
      const id = Date.now().toString();
      const session = await invoke<any>("create_session", { id });
      addSession(session);
    },
    "Ctrl+k": () => {
      const input = document.querySelector("[data-sidebar-search]") as HTMLInputElement | null;
      input?.focus();
    },
    "Ctrl+,": () => setShowSettings(true),
    "Ctrl+b": () => setSidebarCollapsed((current) => !current),
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.fontSize, settings.theme]);

  useEffect(() => {
    if (!appWindow) return;

    let unlisten: (() => void) | undefined;

    void syncWindowState("mount");
    appWindow
      .onResized(() => {
        emitWindowLog("event:resized");
        void syncWindowState("resized");
      })
      .then((cleanup) => {
        unlisten = cleanup;
      });

    return () => {
      unlisten?.();
    };
  }, [appWindow, emitWindowLog, syncWindowState]);

  const handleWindowAction = async (
    e: React.MouseEvent<HTMLButtonElement>,
    action: "close" | "minimize" | "toggleMaximize"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const actionId = ++windowActionSeqRef.current;
    const clickTimestamp = Date.now();
    const rect = (e.target as HTMLElement).getBoundingClientRect();

    console.log(`[window:click] ⏱️ 点击时间: ${new Date().toISOString()} | action=${action} | coords=(${e.clientX}, ${e.clientY}) | targetRect=(${rect.x.toFixed(0)}, ${rect.y.toFixed(0)})`);

    emitWindowLog("action:pointerdown", {
      actionId,
      action,
      clickTimestamp,
      clientX: e.clientX,
      clientY: e.clientY,
      targetRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      isTrusted: e.isTrusted,
    });

    if (!appWindow) {
      emitWindowLog("action:skipped", { actionId, action, cause: "no-app-window" });
      addToast(`[${action}] 失败: appWindow 为空`, "error");
      return;
    }

    const inFlight = windowActionInFlightRef.current;
    if (inFlight) {
      emitWindowLog("action:ignored", {
        actionId,
        action,
        inFlightId: inFlight.id,
        inFlightAction: inFlight.action,
      });
      addToast(`[${action}] 被忽略: 已有操作进行中 (${inFlight.action})`, "error");
      return;
    }

    windowActionInFlightRef.current = { id: actionId, action };
    const actionStartedAt = performance.now();

    try {
      if (action === "close") {
        emitWindowLog("action:api:start", { actionId, action });
        try {
          await appWindow.close();
          const totalMs = Number((performance.now() - actionStartedAt).toFixed(2));
          console.log(`[window:done] ✅ 完成时间: ${new Date().toISOString()} | action=close | 总耗时=${totalMs}ms`);
          emitWindowLog("action:api:done", {
            actionId,
            action,
            durationMs: totalMs,
          });
        } catch {
          // Some environments are stricter on close; fallback to destroy.
          emitWindowLog("action:api:fallback", { actionId, action, fallback: "destroy" });
          await appWindow.destroy();
          const totalMs = Number((performance.now() - actionStartedAt).toFixed(2));
          console.log(`[window:done] ✅ 完成时间: ${new Date().toISOString()} | action=destroy(fallback) | 总耗时=${totalMs}ms`);
          emitWindowLog("action:api:done", {
            actionId,
            action: "destroy",
            durationMs: totalMs,
          });
        }
        return;
      }

      if (action === "minimize") {
        emitWindowLog("action:api:start", { actionId, action });
        await appWindow.minimize();
        const totalMs = Number((performance.now() - actionStartedAt).toFixed(2));
        console.log(`[window:done] ✅ 完成时间: ${new Date().toISOString()} | action=minimize | 总耗时=${totalMs}ms`);
        emitWindowLog("action:api:done", {
          actionId,
          action,
          durationMs: totalMs,
        });
        return;
      }

      const beforeQueryStartedAt = performance.now();
      const wasMaximized = await appWindow.isMaximized();
      emitWindowLog("action:maximize:before", {
        actionId,
        wasMaximized,
        durationMs: Number((performance.now() - beforeQueryStartedAt).toFixed(2)),
      });

      const nativeAction = wasMaximized ? "unmaximize" : "maximize";
      const nativeActionStartedAt = performance.now();
      emitWindowLog("action:api:start", { actionId, action: nativeAction });

      if (wasMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }

      emitWindowLog("action:api:done", {
        actionId,
        action: nativeAction,
        durationMs: Number((performance.now() - nativeActionStartedAt).toFixed(2)),
      });

      const maximized = await syncWindowState(`post-${nativeAction}`);
      const totalMs = Number((performance.now() - actionStartedAt).toFixed(2));
      const doneTimestamp = Date.now();
      console.log(`[window:done] ✅ 完成时间: ${new Date().toISOString()} | action=${action} | 总耗时=${totalMs}ms | 完成时状态: maximized=${maximized}`);

      emitWindowLog("action:done", {
        actionId,
        action,
        nativeAction,
        maximized,
        totalDurationMs: totalMs,
        doneTimestamp,
      });
    } catch (error) {
      emitWindowLog("action:error", {
        actionId,
        action,
        durationMs: Number((performance.now() - actionStartedAt).toFixed(2)),
        error: String(error),
      });
      console.error("[window] action failed:", action, error);
    } finally {
      if (windowActionInFlightRef.current?.id === actionId) {
        windowActionInFlightRef.current = null;
      }
    }
  };

  return (
    <div className={`app-frame ${windowMaximized ? "app-frame-maximized" : ""}`}>
      <div className="chat-window">
        <div className="chat-container">
          {/* 左侧边栏 */}
          <aside className={`sidebar ${sidebarCollapsed ? "hidden" : ""}`}>
            <SessionList
              collapsed={sidebarCollapsed}
              onOpenSettings={() => setShowSettings(true)}
            />
          </aside>

          {/* 右侧容器 */}
          <div className="right-container">
            {/* 顶部标题栏 */}
            <header className="window-header" data-tauri-drag-region>
              <div className="traffic-lights">
                <button
                  type="button"
                  className="traffic-light traffic-light-close"
                  aria-label="关闭窗口"
                  onMouseDown={(e) => handleWindowAction(e, "close")}
                />
                <button
                  type="button"
                  className="traffic-light traffic-light-minimize"
                  aria-label="最小化窗口"
                  onMouseDown={(e) => handleWindowAction(e, "minimize")}
                />
                <button
                  type="button"
                  className="traffic-light traffic-light-maximize"
                  aria-label={windowMaximized ? "还原窗口" : "最大化窗口"}
                  onMouseDown={(e) => handleWindowAction(e, "toggleMaximize")}
                />
              </div>

              <button
                className="column-view-btn"
                onClick={() => setSidebarCollapsed((current) => !current)}
                title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                aria-label="切换侧边栏"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>

              <div className="window-title">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                </svg>
                ClaudeDesktop
              </div>

              <div className="header-actions">
                <button
                  className="header-btn"
                  onClick={() => {
                    const input = document.querySelector("[data-sidebar-search]") as HTMLInputElement | null;
                    input?.focus();
                  }}
                  title="搜索对话"
                  aria-label="搜索对话"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
                <button
                  className="avatar"
                  title="打开设置"
                  aria-label="打开设置"
                  onClick={() => setShowSettings(true)}
                >
                  AL
                </button>
              </div>
            </header>

            {/* 聊天主区域 */}
            <div className="chat-main">
              <ChatView
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
              />
            </div>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
