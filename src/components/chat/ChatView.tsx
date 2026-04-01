import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useChatStore, Message } from "../../stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { EmptyChat } from "../common/EmptyState";
import { DotsLoader } from "../common/LoadingSpinner";
import { ModelSelector } from "./ModelSelector";
import { CommandSuggestions } from "./CommandSuggestions";

export function ChatView() {
  const {
    activeSessionId,
    sessionMessages,
    sessions,
    loading,
    selectedModel,
    addMessage,
    updateMessage,
    deleteMessage,
    setMessageError,
    setMessageStreaming,
    setLoading,
    updateSessionCliId,
    updateSessionTitle,
    addToast,
    addSession,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentMsgIdRef = useRef<string | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const updateBufferRef = useRef<string>("");
  const updateTimerRef = useRef<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleStopGeneration = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // 重置重试计数器
    retryCountRef.current = 0;

    if (currentMsgIdRef.current && activeSessionId) {
      setMessageStreaming(activeSessionId, currentMsgIdRef.current, false);
      const currentMsg = messages.find((m) => m.id === currentMsgIdRef.current);
      if (currentMsg && !currentMsg.content) {
        updateMessage(activeSessionId, currentMsgIdRef.current, "已停止生成");
      }
    }

    setLoading(false);
    currentMsgIdRef.current = null;
    addToast("已停止生成", "info");
  };

  const messages = activeSessionId ? sessionMessages[activeSessionId] || [] : [];
  const currentSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    // 只在非流式状态时滚动，避免频繁滚动导致闪烁
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  useEffect(() => {
    const unlistenChunk = listen<{ delta: string; session_id: string }>("stream-chunk", (event) => {
      console.log("[ChatView] stream-chunk received:", event.payload);
      if (currentMsgIdRef.current && event.payload.session_id === activeSessionId) {
        // 收到数据，重置超时计时器
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        timeoutIdRef.current = setTimeout(() => {
          console.log("[ChatView] Idle timeout - no response for 20s");
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }

          if (retryCountRef.current < 5 && currentMsgIdRef.current && activeSessionId) {
            retryCountRef.current += 1;
            addToast(`无响应超时，正在重试 (${retryCountRef.current}/5)`, "info");
            console.log(`[ChatView] Retrying... attempt ${retryCountRef.current}`);
          } else if (currentMsgIdRef.current && activeSessionId) {
            setMessageError(activeSessionId, currentMsgIdRef.current, true);
            updateMessage(activeSessionId, currentMsgIdRef.current, "无响应超时，已重试5次");
            setMessageStreaming(activeSessionId, currentMsgIdRef.current, false);
            setLoading(false);
            addToast("无响应超时，已达到最大重试次数", "error");
            currentMsgIdRef.current = null;
            retryCountRef.current = 0;
          }
        }, 20 * 1000);

        // 将增量添加到缓冲区
        updateBufferRef.current += event.payload.delta;

        // 清除之前的定时器
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }

        // 设置新的定时器，100ms 后批量更新
        updateTimerRef.current = setTimeout(() => {
          const currentMsg = messages.find((m) => m.id === currentMsgIdRef.current);
          if (currentMsg && updateBufferRef.current && currentMsgIdRef.current && activeSessionId) {
            updateMessage(activeSessionId, currentMsgIdRef.current, currentMsg.content + updateBufferRef.current);
            updateBufferRef.current = "";
          }
          updateTimerRef.current = null;
        }, 100);
      }
    });

    const unlistenDone = listen<{ full_text: string; session_id: string; cli_session_id: string }>(
      "stream-done",
      (event) => {
        console.log("[ChatView] stream-done received:", event.payload);
        if (currentMsgIdRef.current && event.payload.session_id === activeSessionId) {
          // 清除超时
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }

          // 清除更新定时器和缓冲区
          if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
          }
          updateBufferRef.current = "";

          // 重置重试计数器
          retryCountRef.current = 0;

          // 始终使用 full_text 更新消息内容，因为它是完整的
          const currentMsg = messages.find((m) => m.id === currentMsgIdRef.current);
          console.log("[ChatView] stream-done currentMsg:", currentMsg);
          if (currentMsg && event.payload.full_text) {
            console.log("[ChatView] Updating message with full_text:", event.payload.full_text);
            updateMessage(activeSessionId!, currentMsgIdRef.current, event.payload.full_text);
          }

          setMessageStreaming(activeSessionId!, currentMsgIdRef.current, false);
          setLoading(false);
          updateSessionCliId(activeSessionId!, event.payload.cli_session_id);

          const firstUserMsg = messages.find((m) => m.role === "user");
          if (firstUserMsg && currentSession?.title === "新对话") {
            const title = firstUserMsg.content.slice(0, 20);
            updateSessionTitle(activeSessionId!, title);
            invoke("update_session_title", { id: activeSessionId, title });
          }

          currentMsgIdRef.current = null;
        }
      }
    );

    const unlistenError = listen<{ error: string; session_id: string }>("stream-error", (event) => {
      if (currentMsgIdRef.current && event.payload.session_id === activeSessionId) {
        // 清除超时
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        setMessageError(activeSessionId!, currentMsgIdRef.current, true);
        updateMessage(activeSessionId!, currentMsgIdRef.current, event.payload.error);
        setMessageStreaming(activeSessionId!, currentMsgIdRef.current, false);
        setLoading(false);
        addToast(event.payload.error, "error");
        currentMsgIdRef.current = null;
      }
    });

    return () => {
      unlistenChunk.then((fn) => fn());
      unlistenDone.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, [
    messages,
    activeSessionId,
    currentSession,
    updateMessage,
    setMessageError,
    setMessageStreaming,
    setLoading,
    updateSessionCliId,
    updateSessionTitle,
    addToast,
  ]);

  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    const id = Date.now().toString();
    const session = await invoke<any>("create_session", { id });
    addSession(session);
    return session.id as string;
  };

  const handleNewSession = async () => {
    await ensureSession();
  };

  const handleEdit = (id: string) => {
    const msg = messages.find((m) => m.id === id);
    if (msg) {
      setEditingId(id);
      setEditText(msg.content);
    }
  };

  const handleDelete = (id: string) => {
    if (activeSessionId && confirm("确定删除这条消息吗？")) {
      deleteMessage(activeSessionId, id);
    }
  };

  const handleRegenerate = async () => {
    if (!activeSessionId || loading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    const assistantMsgId = crypto.randomUUID();
    addMessage(activeSessionId, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      streaming: true,
    });
    currentMsgIdRef.current = assistantMsgId;
    setLoading(true);

    try {
      const imagePayload = lastUserMsg.images?.length
        ? lastUserMsg.images.map((img) => ({
            media_type: img.mediaType,
            data: img.data,
          }))
        : null;

      await invoke("send_message_stream", {
        prompt: lastUserMsg.content,
        sessionId: activeSessionId,
        cliSessionId: currentSession?.cli_session_id || null,
        images: imagePayload,
        model: selectedModel,
      });
      console.log("[ChatView] send_message_stream invoked successfully");
    } catch (e) {
      console.error("[ChatView] send_message_stream error:", e);
      const errorMsg = String(e);
      setMessageError(activeSessionId, assistantMsgId, true);
      updateMessage(activeSessionId, assistantMsgId, errorMsg);
      setMessageStreaming(activeSessionId, assistantMsgId, false);
      setLoading(false);
      addToast(errorMsg, "error");
      currentMsgIdRef.current = null;
    }
  };

  const handleSend = async (
    text: string,
    images?: Array<{ path: string; mediaType: string; data: string }>
  ) => {
    if ((!text.trim() && !images?.length) || loading) return;

    const sessionId = await ensureSession();
    const session = sessions.find((item) => item.id === sessionId);
    const existingMessages = sessionMessages[sessionId] || [];

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      images,
    };
    addMessage(sessionId, userMsg);

    const assistantMsgId = crypto.randomUUID();
    addMessage(sessionId, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      streaming: true,
    });
    currentMsgIdRef.current = assistantMsgId;
    setLoading(true);

    try {
      const imagePayload = images?.length
        ? images.map((img) => ({
            media_type: img.mediaType,
            data: img.data,
          }))
        : null;

      // 只有当会话中已经有消息时才使用 resume
      const shouldResume = existingMessages.length > 0 && session?.cli_session_id;

      await invoke("send_message_stream", {
        prompt: text,
        sessionId,
        cliSessionId: shouldResume ? session.cli_session_id : null,
        images: imagePayload,
        model: selectedModel,
      });
    } catch (e) {
      const errorMsg = String(e);
      setMessageError(sessionId, assistantMsgId, true);
      updateMessage(sessionId, assistantMsgId, errorMsg);
      setMessageStreaming(sessionId, assistantMsgId, false);
      setLoading(false);
      addToast(errorMsg, "error");
      currentMsgIdRef.current = null;
    }
  };

  return (
    <main className="desktop-main">
      <header className="chat-header">
        <div className="chat-title-block">
          <div className="chat-title">{currentSession?.title || "Claude Desktop"}</div>
          <div className="chat-subtitle">{currentSession ? "ClaudeDesktop" : "ClaudeDesktop"}</div>
        </div>
        <div className="chat-header-actions">
          <button className="header-icon-button" title="运行">
            ▷
          </button>
          <div className="header-pill">Claude</div>
          <div className="header-pill">本地</div>
          <button className="header-icon-button" title="更多">
            ⋯
          </button>
        </div>
      </header>

      <div className="chat-scroll">
        <div className="chat-scroll-inner">
          {!activeSessionId || messages.length === 0 ? (
            <div className="empty-board">
              <EmptyChat onNewSession={handleNewSession} />
            </div>
          ) : (
            <div className="message-list">
              {messages.map((msg) =>
                editingId === msg.id ? (
                  <div key={msg.id} className="message-editor animate-scale-in">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div className="message-editor-actions">
                      <button
                        onClick={() => {
                          handleSend(editText, msg.images);
                          setEditingId(null);
                        }}
                        className="primary-action"
                      >
                        重新发送
                      </button>
                      <button onClick={() => setEditingId(null)} className="secondary-action">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRegenerate={handleRegenerate}
                  />
                )
              )}

              {loading && (
                <div className="message-row animate-fade-in">
                  <div className="message-bubble message-bubble-assistant">
                    <div className="message-meta">
                      <span>Claude</span>
                      <span className="message-dot"></span>
                      <span>正在响应</span>
                    </div>
                    <DotsLoader />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="chat-compose-wrap">
        <InputArea onSend={handleSend} disabled={loading} onStop={handleStopGeneration} />
      </div>
    </main>
  );
}

function InputArea({
  onSend,
  disabled,
  onStop,
}: {
  onSend: (text: string, images?: Array<{ path: string; mediaType: string; data: string }>) => void;
  disabled: boolean;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<Array<{ path: string; mediaType: string; data: string }>>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStop = () => {
    onStop();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: Array<{ path: string; mediaType: string; data: string }> = [];
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/json', 'text/html', 'text/css', 'text/javascript'
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 检查文件类型
      if (!supportedTypes.includes(file.type) && !file.type.startsWith('text/')) {
        alert(`不支持的文件类型: ${file.type}\n支持的类型: 图片、PDF、文本文件`);
        continue;
      }

      // 检查文件大小 (限制为 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件太大: ${file.name}\n最大支持 10MB`);
        continue;
      }

      const reader = new FileReader();

      await new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          newImages.push({
            path: file.name,
            mediaType: file.type || 'application/octet-stream',
            data: base64,
          });
          resolve();
        };
        reader.onerror = () => {
          alert(`读取文件失败: ${file.name}`);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (newImages.length > 0) {
      setImages((current) => [...current, ...newImages]);
    }

    // 重置 input 以允许选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    // 简化逻辑：只要包含 / 就显示命令提示
    if (value.includes("/")) {
      const lastSlashIndex = value.lastIndexOf("/");
      const query = value.slice(lastSlashIndex);
      setShowCommands(true);
      setCommandQuery(query);
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
      const newText = text.slice(0, lastSlashIndex) + command + " " + text.slice(cursorPos);
      setText(newText);
      setShowCommands(false);

      // 将光标移到命令后面
      setTimeout(() => {
        const newCursorPos = lastSlashIndex + command.length + 1;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果命令提示框打开，让它处理方向键和回车
    if (showCommands && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }

    // ESC 关闭命令提示
    if (e.key === "Escape" && showCommands) {
      setShowCommands(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            const mediaType = blob.type;
            setImages((current) => [
              ...current,
              { path: blob.name || "pasted-image", mediaType, data: base64 },
            ]);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSendClick = () => {
    if (!text.trim() && images.length === 0) return;
    onSend(text, images.length > 0 ? images : undefined);
    setText("");
    setImages([]);
    textareaRef.current?.focus();
  };

  return (
    <div className="chat-compose-panel">
      {images.length > 0 && (
        <div className="attachment-strip animate-slide-in-bottom">
          {images.map((img, idx) => (
            <div key={`${img.path}-${idx}`} className="attachment-preview-card">
              {img.mediaType.startsWith('image/') ? (
                <img
                  src={`data:${img.mediaType};base64,${img.data}`}
                  alt="preview"
                  className="attachment-thumbnail"
                />
              ) : (
                <div className="attachment-file-preview">
                  <div className="attachment-file-name">{img.path}</div>
                  <div className="attachment-file-type">{img.mediaType.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                </div>
              )}
              <button
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="attachment-remove-btn"
                title="删除文件"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="composer-shell">
        <label
          className="icon-button"
          title="添加文件"
          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          +
          <input
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </label>

        <div className="compose-input-shell">
          {showCommands && (
            <CommandSuggestions
              query={commandQuery}
              onSelect={handleCommandSelect}
              position={{ top: 60, left: 0 }}
            />
          )}
          <textarea
            ref={textareaRef}
            className="compose-textarea"
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行，也可以直接粘贴图片)"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            rows={3}
          />
        </div>
        <button
          className="compose-send-circle"
          onClick={disabled ? handleStop : handleSendClick}
          disabled={!disabled && (!text.trim() && images.length === 0)}
          title={disabled ? "停止生成" : "发送消息"}
        >
          {disabled ? "■" : "↑"}
        </button>
      </div>
      <div className="compose-footer">
        <ModelSelector />
        <div className="compose-hint">本地 · main</div>
      </div>
    </div>
  );
}
