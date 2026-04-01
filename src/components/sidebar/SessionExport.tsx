import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useChatStore } from "../../stores/chatStore";

interface SessionExportProps {
  sessionId: string;
  onClose: () => void;
}

export function SessionExport({ sessionId, onClose }: SessionExportProps) {
  const { sessionMessages, sessions } = useChatStore();
  const messages = sessionMessages[sessionId] || [];
  const session = sessions.find((s) => s.id === sessionId);

  const handleExport = async (format: "markdown" | "json") => {
    try {
      const content = await invoke<string>("export_session", {
        sessionId,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        format,
      });

      const ext = format === "markdown" ? "md" : "json";
      const defaultName = `${session?.title || "会话"}.${ext}`;

      const path = await save({
        defaultPath: defaultName,
        filters: [{ name: format.toUpperCase(), extensions: [ext] }],
      });

      if (path) {
        await writeTextFile(path, content);
        onClose();
      }
    } catch (e) {
      alert("导出失败: " + e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-80">
        <h3 className="text-lg font-medium text-text-primary mb-4">导出会话</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleExport("markdown")}
            className="w-full px-4 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-primary rounded-md text-sm transition-colors"
          >
            导出为 Markdown
          </button>
          <button
            onClick={() => handleExport("json")}
            className="w-full px-4 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-primary rounded-md text-sm transition-colors"
          >
            导出为 JSON
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-bg-primary hover:bg-bg-secondary text-text-secondary rounded-md text-sm border border-border transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
