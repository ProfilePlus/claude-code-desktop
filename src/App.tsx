import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChatView } from "./components/chat/ChatView";
import { SessionList } from "./components/sidebar/SessionList";
import { ToastContainer } from "./components/common/Toast";
import { SettingsModal } from "./components/settings/SettingsModal";
import { useChatStore } from "./stores/chatStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useKeyboard } from "./hooks/useKeyboard";

function App() {
  const { toasts, removeToast, addSession } = useChatStore();
  const { settings } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(false);

  useKeyboard({
    "Ctrl+n": async () => {
      const id = Date.now().toString();
      const session = await invoke<any>("create_session", { id });
      addSession(session);
    },
    "Ctrl+k": () => {
      const input = document.querySelector('input[placeholder="搜索会话..."]') as HTMLInputElement | null;
      input?.focus();
    },
    "Ctrl+,": () => setShowSettings(true),
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.fontSize, settings.theme]);

  return (
    <div className="app-frame">
      <div className="app-surface">
        <SessionList onOpenSettings={() => setShowSettings(true)} />
        <ChatView />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
