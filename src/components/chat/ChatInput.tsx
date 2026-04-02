import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../../stores/chatStore";
import { CommandSuggestions } from "./CommandSuggestions";

type UploadAsset = { path: string; mediaType: string; data: string };

interface ChatInputProps {
  onSend: (text: string, images?: UploadAsset[]) => void;
  onFileUpload?: (files: UploadAsset[]) => void;
  onShortcutCall?: (query: string) => void;
  disabled: boolean;
  onStop: () => void;
}

type ModelOption = {
  id: string;
  name: string;
  context: string;
};

const MODEL_OPTIONS: ModelOption[] = [
  { id: "minimax-m2.7", name: "Glass-4 Turbo", context: "128K" },
  { id: "opus", name: "Opus 4.6", context: "200K" },
  { id: "opus-1m", name: "Opus 4.6 (1M)", context: "1M" },
  { id: "sonnet", name: "Sonnet 4.6", context: "200K" },
  { id: "sonnet-1m", name: "Sonnet 4.6 (1M)", context: "1M" },
  { id: "sonnet-3.7", name: "Sonnet 3.7", context: "200K" },
  { id: "sonnet-3.5", name: "Sonnet 3.5", context: "200K" },
  { id: "haiku", name: "Haiku 4.5", context: "200K" },
  { id: "haiku-3.5", name: "Haiku 3.5", context: "200K" },
];

function getDynamicModel(selectedModel: string): ModelOption {
  const existing = MODEL_OPTIONS.find((model) => model.id === selectedModel);
  if (existing) return existing;

  return {
    id: selectedModel,
    name: selectedModel === "minimax-m2.7"
      ? "Glass-4 Turbo"
      : selectedModel
          .split(/[-_]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
    context: "当前",
  };
}

export function ChatInput({
  onSend,
  onFileUpload,
  onShortcutCall,
  disabled,
  onStop: _onStop,
}: ChatInputProps) {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [text, setText] = useState("");
  const [images, setImages] = useState<UploadAsset[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(MODEL_OPTIONS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelPanelRef = useRef<HTMLDivElement>(null);
  const currentModel = useMemo(() => getDynamicModel(selectedModel), [selectedModel]);
  const models = useMemo(() => {
    const existing = availableModels.find((model) => model.id === selectedModel);
    return existing ? availableModels : [getDynamicModel(selectedModel), ...availableModels];
  }, [availableModels, selectedModel]);

  useEffect(() => {
    let cancelled = false;

    const loadConfiguredModels = async () => {
      try {
        const configured = await invoke<ModelOption[]>("list_configured_models");
        if (cancelled) return;

        const normalized = configured
          .map((model) => ({
            id: model.id?.trim() || "",
            name: model.name?.trim() || model.id?.trim() || "",
            context: model.context?.trim() || "配置",
          }))
          .filter((model) => model.id.length > 0);

        if (normalized.length > 0) {
          setAvailableModels(normalized);
          return;
        }
      } catch {
        // Fallback below.
      }

      if (!cancelled) {
        setAvailableModels(MODEL_OPTIONS);
      }
    };

    loadConfiguredModels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (availableModels.length === 0) return;
    if (availableModels.some((model) => model.id === selectedModel)) return;
    setSelectedModel(availableModels[0].id);
  }, [availableModels, selectedModel, setSelectedModel]);

  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "40px";
    const nextHeight = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(nextHeight, 40)}px`;
    el.style.overflowY = el.scrollHeight > 200 ? "auto" : "hidden";
  }, [text]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelPanelRef.current && !modelPanelRef.current.contains(event.target as Node)) {
        setModelOpen(false);
      }
    };

    if (modelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modelOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const nextFiles: UploadAsset[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          nextFiles.push({
            path: file.name,
            mediaType: file.type || "application/octet-stream",
            data: base64,
          });
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
    }

    if (nextFiles.length > 0) {
      setImages((current) => [...current, ...nextFiles]);
      onFileUpload?.(nextFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    const lastSlashIndex = value.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const query = value.slice(lastSlashIndex);
      setShowCommands(true);
      setCommandQuery(query);
      onShortcutCall?.(query);
      return;
    }

    setShowCommands(false);
  };

  const handleCommandSelect = (command: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
      const newText = text.slice(0, lastSlashIndex) + command + " " + text.slice(cursorPos);
      setText(newText);
      setShowCommands(false);
      setTimeout(() => {
        const newCursorPos = lastSlashIndex + command.length + 1;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && images.length === 0) return;
    onSend(text, images.length > 0 ? images : undefined);
    setText("");
    setImages([]);
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = !disabled && (text.trim().length > 0 || images.length > 0);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (!item.type.startsWith("image/")) continue;
      e.preventDefault();
      const blob = item.getAsFile();
      if (!blob) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImages((current) => [
          ...current,
          {
            path: blob.name || "pasted-image",
            mediaType: blob.type,
            data: base64,
          },
        ]);
      };
      reader.readAsDataURL(blob);
    }
  };

  return (
    <div
      className="pointer-events-auto relative h-auto min-h-[88px] w-[85vw] min-w-[600px] max-w-[900px] max-[800px]:w-[calc(100vw-40px)] max-[800px]:min-w-[600px] max-[640px]:w-[calc(100vw-16px)] max-[640px]:min-w-0"
      style={{ maxHeight: "min(320px, 40vh)" }}
    >
      <div className="chat-input-card glass-card relative flex h-full min-h-[88px] flex-col rounded-2xl border border-white/[0.08] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.28)] transition-all duration-150 ease-out focus-within:border-white/[0.15] max-[640px]:px-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="上传附件"
        />

        {/* UI重构部分: 顶部模型选择栏 */}
        <div className="relative h-8 px-1" ref={modelPanelRef}>
          <button
            type="button"
            className="chat-input-model-trigger flex h-8 w-full items-center rounded-md px-1 text-left transition-all duration-150 ease-out hover:bg-white/[0.06]"
            onClick={() => setModelOpen((current) => !current)}
            aria-label="选择模型"
          >
            <svg className="mr-1.5 h-[14px] w-[14px] text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 8.7a3.3 3.3 0 100 6.6 3.3 3.3 0 000-6.6zm8.2 3.3a6.7 6.7 0 00-.1-.9l2-1.6-2-3.5-2.5 1a8.6 8.6 0 00-1.5-.9l-.4-2.6h-4l-.4 2.6c-.5.2-1 .5-1.5.9l-2.5-1-2 3.5 2 1.6a6.7 6.7 0 000 1.8l-2 1.6 2 3.5 2.5-1c.5.4 1 .7 1.5.9l.4 2.6h4l.4-2.6c.5-.2 1-.5 1.5-.9l2.5 1 2-3.5-2-1.6c.1-.3.1-.6.1-.9z" />
            </svg>
            <span className="chat-input-model-name text-[12px] font-medium text-slate-300">{currentModel.name}</span>
            <span className="chat-input-model-arrow ml-1.5 text-[10px] text-slate-500">▼</span>
          </button>

          {modelOpen && (
            <div className="chat-input-model-menu glass-card absolute bottom-full left-0 z-[1200] mb-2 w-full rounded-xl border border-white/[0.08] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  className={`chat-input-model-option flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-150 ease-out hover:bg-white/[0.06] ${
                    selectedModel === model.id ? "bg-white/[0.06]" : ""
                  }`}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setModelOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="chat-input-model-option-name text-sm font-medium text-slate-200">{model.name}</span>
                    <span className="chat-input-model-option-context text-xs text-slate-500">{model.context}</span>
                  </div>
                  {selectedModel === model.id && <span className="chat-input-model-option-check text-sm text-slate-300">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-2" aria-hidden="true" />

        {showCommands && (
          <div className="relative z-20 -mt-1">
            <CommandSuggestions query={commandQuery} onSelect={handleCommandSelect} position={{ top: 0, left: 0 }} />
          </div>
        )}

        {/* UI重构部分: 核心输入区域，保留原有发送/上传/快捷键逻辑 */}
        <div className="flex w-full items-center gap-3 px-1">
          <button
            type="button"
            className="chat-input-attach flex h-8 w-8 flex-none items-center justify-center rounded-lg text-slate-400 transition-all duration-150 ease-out hover:bg-white/[0.06]"
            onClick={() => fileInputRef.current?.click()}
            aria-label="上传文件"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.2 7.4l-6.8 6.8a3 3 0 004.2 4.2l7.5-7.5a5 5 0 10-7.1-7.1L5.4 11.5" />
            </svg>
          </button>

          <div className="relative flex min-h-10 flex-1 items-center px-4 py-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={disabled}
              placeholder="输入消息，或输入 / 唤起快捷指令..."
              className="chat-input-textarea max-h-[200px] min-h-10 flex-1 resize-none overflow-y-auto bg-transparent text-[14px] leading-[1.5] text-slate-100 outline-none placeholder:text-slate-500"
              aria-label="消息输入框"
            />

            <button
              type="button"
              className={`ml-3 flex h-9 w-9 flex-none items-center justify-center rounded-full transition-all duration-150 ease-out ${
                canSend
                  ? "bg-[#818cf8] text-white hover:bg-[#6366f1]"
                  : "cursor-not-allowed bg-[rgba(129,140,248,0.3)] text-white/80"
              }`}
              disabled={!canSend}
              onClick={handleSubmit}
              aria-label="发送消息"
            >
              {disabled ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.5 11.5l13.2-6.4c.8-.4 1.7.4 1.4 1.3l-2.5 12c-.2.9-1.4 1.2-2 .4l-2.8-3.5-3.4 2a.8.8 0 01-1.2-.7v-4l-2.8-1.3c-.9-.4-.8-1.6.1-1.8z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 px-1">
            {images.map((image, index) => (
              <div
                key={`${image.path}-${index}`}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
              >
                {image.path}
              </div>
            ))}
          </div>
        )}

        {/* UI重构部分: 底部辅助栏 */}
        <div className="chat-input-helper mt-1 flex h-4 items-center justify-between px-1 max-[640px]:hidden">
          <div className="text-[11px] font-normal text-slate-500">自动检测 (ZH)  使用 ⇧+Enter 发送</div>
          <div className="text-right text-[11px] font-normal text-slate-500">系统就绪</div>
        </div>
      </div>
    </div>
  );
}
