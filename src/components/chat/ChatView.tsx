import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useChatStore, Message } from "../../stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { EmptyChat } from "../common/EmptyState";
import { ChatInput } from "./ChatInput";

export function ChatView({
  sidebarCollapsed,
  onToggleSidebar,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const normalizeAssistantText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return text;
    }

    const compact = trimmed.replace(/\s+/g, " ").trim();
    for (let size = 1; size <= Math.floor(compact.length / 2); size += 1) {
      if (compact.length % size !== 0) {
        continue;
      }

      const unit = compact.slice(0, size);
      if (unit.repeat(compact.length / size) === compact) {
        return unit;
      }
    }

    const sentenceParts = compact
      .split(/(?<=[。！？!?])\s*|\s{2,}|\n+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (sentenceParts.length >= 2 && sentenceParts.length % 2 === 0) {
      const midpoint = sentenceParts.length / 2;
      const firstHalf = sentenceParts.slice(0, midpoint);
      const secondHalf = sentenceParts.slice(midpoint);
      if (JSON.stringify(firstHalf) === JSON.stringify(secondHalf)) {
        return firstHalf.join(" ");
      }
    }

    return compact;
  };

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
            const normalizedText = normalizeAssistantText(event.payload.full_text);
            console.log("[ChatView] Updating message with full_text:", normalizedText);
            updateMessage(activeSessionId!, currentMsgIdRef.current, normalizedText);
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
    <main className="desktop-main glasschat-main">
      <div className="glasschat-stage-toolbar">
        <button
          className="header-icon-button header-sidebar-button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "展开侧栏" : "折叠侧栏"}
        >
          {sidebarCollapsed ? "☰" : "≡"}
        </button>
      </div>
      <div className="chat-scroll">
        <div className="chat-scroll-inner">
          {!activeSessionId || messages.length === 0 ? (
            <div className="empty-board glasschat-empty-board">
              <EmptyChat onNewSession={handleNewSession} />
            </div>
          ) : (
            <div className="message-list glasschat-message-list">
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

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[999] flex justify-center px-5">
        <ChatInput onSend={handleSend} disabled={loading} onStop={handleStopGeneration} />
      </div>
    </main>
  );
}
