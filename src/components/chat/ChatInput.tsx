import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../../stores/chatStore";
import { CommandSuggestions } from "./CommandSuggestions";

type UploadAsset = { path: string; mediaType: string; data: string };

interface ChatInputProps {
  onSend: (text: string, images?: UploadAsset[]) => void;
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
  disabled,
  onStop: _onStop,
}: ChatInputProps) {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [text, setText] = useState("");
  const [images, setImages] = useState<UploadAsset[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(MODEL_OPTIONS);
  const [commandQuery, setCommandQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelPanelRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textareaWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelPanelRef.current && !modelPanelRef.current.contains(event.target as Node)) {
        setModelOpen(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    if (modelOpen || emojiOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modelOpen, emojiOpen]);

  const EMOJI_LIST = ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "🤔", "👍", "👎"];

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setEmojiOpen(false);
    textareaRef.current?.focus();
  };
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

  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "40px";
    const nextHeight = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(nextHeight, 40)}px`;
    el.style.overflowY = el.scrollHeight > 200 ? "auto" : "hidden";
  }, [text]);

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
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    // 检测 / 开头来显示命令提示
    if (value.startsWith("/")) {
      setCommandQuery(value);
    } else {
      setCommandQuery("");
    }
  };

  const handleCommandSelect = (command: string) => {
    // 找到第一个空格或行的位置
    const spaceIndex = text.indexOf(" ");
    if (spaceIndex === -1) {
      setText(command + " ");
    } else {
      setText(command + " ");
    }
    setCommandQuery("");
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!text.trim() && images.length === 0) return;
    onSend(text, images.length > 0 ? images : undefined);
    setText("");
    setImages([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="input-area">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-label="上传附件"
      />

      <div className="input-header">
        <button
          type="button"
          className="model-selector"
          onClick={() => setModelOpen((current) => !current)}
          aria-label="选择模型"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M12 9L2 14l10 5 10-5-10-5z"></path>
            <path d="M12 16L2 21l10 5 10-5-10-5z"></path>
          </svg>
          <span>{currentModel.name}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
      </div>

      {modelOpen && (
        <div className="model-selector-dropdown">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`model-selector-option ${selectedModel === model.id ? "model-selector-option-active" : ""}`}
              onClick={() => {
                console.log("[ChatInput] Selecting model:", model.id);
                setSelectedModel(model.id);
                setModelOpen(false);
              }}
            >
              <div className="model-selector-option-content">
                <span className="model-selector-option-name">{model.name}</span>
                <span className="model-selector-option-context">{model.context}</span>
              </div>
              {selectedModel === model.id && <span className="model-selector-option-check">✓</span>}
            </button>
          ))}
        </div>
      )}

      <div className="input-wrap">
        <div className="input-row">
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="上传文件"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>

          <div ref={textareaWrapRef} style={{ position: "relative", flex: 1 }}>
            <textarea
              ref={textareaRef}
              id="message-input"
              rows={1}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={disabled}
              placeholder="输入消息，或输入 / 唤起快捷指令..."
              aria-label="消息输入框"
            />
            {commandQuery && (
              <CommandSuggestions
                query={commandQuery}
                onSelect={handleCommandSelect}
                position={{ top: 0, left: 0 }}
              />
            )}
          </div>

          <div className="input-actions">
            <div ref={emojiRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="input-btn"
                aria-label="表情"
                onClick={() => setEmojiOpen((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <path d="M9 9h.01"></path>
                  <path d="M15 9h.01"></path>
                </svg>
              </button>
              {emojiOpen && (
                <div className="emoji-popover">
                  <div className="emoji-grid">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="emoji-btn"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="send-btn"
              disabled={!canSend}
              onClick={handleSubmit}
              aria-label="发送消息"
            >
              {disabled ? (
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="input-footer">
          <span className="input-hint">自动检测 (ZH) 使用 ⇧+Enter 发送</span>
          <span className="input-hint">系统就绪</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="attachment-strip">
          {images.map((image, index) => (
            <div key={`${image.path}-${index}`} className="attachment-chip">
              {image.path}
            </div>
          ))}
        </div>
      )}

      <div className="disclaimer">ClaudeDesktop 可能会产生错误的信息，请核实重要信息。</div>
    </div>
  );
}
