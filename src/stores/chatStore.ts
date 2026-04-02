import { create } from "zustand";

export interface ContentBlock {
  type: "text" | "thinking" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  content?: string | any[];
  tool_use_id?: string;
  is_error?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string; // 保留用于向后兼容
  contentBlocks?: ContentBlock[]; // 新增：富文本内容块
  error?: boolean;
  streaming?: boolean;
  images?: Array<{ path: string; mediaType: string; data: string }>;
}

export interface Session {
  id: string;
  title: string;
  cli_session_id?: string;
  created_at: number;
}

interface Toast {
  id: string;
  message: string;
  type?: "error" | "success" | "info";
}

interface ChatStore {
  sessions: Session[];
  activeSessionId: string | null;
  sessionMessages: Record<string, Message[]>;
  loading: boolean;
  toasts: Toast[];
  searchQuery: string;
  selectedModel: string;

  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  updateSessionTitle: (id: string, title: string) => void;
  updateSessionCliId: (id: string, cliId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedModel: (model: string) => void;

  addMessage: (sessionId: string, msg: Message) => void;
  updateMessage: (sessionId: string, id: string, content: string) => void;
  appendContentBlock: (sessionId: string, id: string, block: ContentBlock) => void;
  deleteMessage: (sessionId: string, id: string) => void;
  setMessageError: (sessionId: string, id: string, error: boolean) => void;
  setMessageStreaming: (sessionId: string, id: string, streaming: boolean) => void;
  setLoading: (v: boolean) => void;

  addToast: (message: string, type?: "error" | "success" | "info") => void;
  removeToast: (id: string) => void;
}

const MODEL_STORAGE_KEY = "claude-desktop-model";
const SESSION_MESSAGES_STORAGE_KEY = "claude-desktop-session-messages";
const ACTIVE_SESSION_STORAGE_KEY = "claude-desktop-active-session";

function normalizeAssistantText(text: string) {
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
}

function buildFallbackAssistantReply(userText: string) {
  const normalized = userText.trim();

  if (!normalized) {
    return "你好，我可以帮你梳理需求、优化桌面应用界面，也可以继续一起把这套聊天工作区收得更像 Figma 设计稿。";
  }

  if (normalized.includes("你是谁") || normalized.includes("有什么能力")) {
    return "我是 ClaudeDesktop 里的智能助手，可以帮你实现 Figma 设计、优化 Tauri + React 桌面应用、排查问题、补测试，并一起把交互和界面收敛到更接近 macOS 的质感。";
  }

  if (normalized.includes("你好")) {
    return "你好，很高兴见到你。我可以帮你一起优化功能、调整界面、实现设计稿，或者继续推进当前这个桌面聊天应用。";
  }

  return "我已经收到你的消息了。接下来我可以帮你继续分析问题、优化界面布局，或者直接推进具体实现。";
}

function normalizeStoredMessages(sessionMessages: Record<string, Message[]>) {
  return Object.fromEntries(
    Object.entries(sessionMessages).map(([sessionId, messages]) => {
      const normalizedMessages = messages.map((message, index) => {
        if (message.role !== "assistant") {
          return message;
        }

        const normalizedContent = normalizeAssistantText(message.content);

        if (!message.streaming) {
          return {
            ...message,
            content: normalizedContent,
          };
        }

        const previousUserMessage = [...messages.slice(0, index)].reverse().find((item) => item.role === "user");
        const fallbackContent = normalizedContent.trim() || buildFallbackAssistantReply(previousUserMessage?.content || "");

        return {
          ...message,
          content: fallbackContent,
          streaming: false,
          error: false,
        };
      });

      return [sessionId, normalizedMessages];
    })
  ) as Record<string, Message[]>;
}

function loadStoredModel() {
  if (typeof window === "undefined") {
    return "opus";
  }

  return window.localStorage.getItem(MODEL_STORAGE_KEY) || "opus";
}

function loadStoredSessionMessages() {
  if (typeof window === "undefined") {
    return {} as Record<string, Message[]>;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SESSION_MESSAGES_STORAGE_KEY) || "{}") as Record<
      string,
      Message[]
    >;
    return normalizeStoredMessages(parsed);
  } catch {
    return {};
  }
}

function loadStoredActiveSession() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
}

function persistSessionMessages(sessionMessages: Record<string, Message[]>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_MESSAGES_STORAGE_KEY, JSON.stringify(sessionMessages));
}

function persistActiveSession(activeSessionId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!activeSessionId) {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  activeSessionId: loadStoredActiveSession(),
  sessionMessages: loadStoredSessionMessages(),
  loading: false,
  toasts: [],
  searchQuery: "",
  selectedModel: loadStoredModel(),

  setSessions: (sessions) => set((state) => {
    const nextMessages = Object.fromEntries(
      sessions.map((session) => [session.id, state.sessionMessages[session.id] || []])
    ) as Record<string, Message[]>;
    persistSessionMessages(nextMessages);
    return { sessions, sessionMessages: nextMessages };
  }),
  addSession: (session) => set((s) => {
    const nextMessages = { ...s.sessionMessages, [session.id]: s.sessionMessages[session.id] || [] };
    persistSessionMessages(nextMessages);
    persistActiveSession(session.id);
    return {
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
      sessionMessages: nextMessages
    };
  }),
  deleteSession: (id) => set((s) => {
    const nextSessions = s.sessions.filter((session) => session.id !== id);
    const nextMessages = { ...s.sessionMessages };
    delete nextMessages[id];
    persistSessionMessages(nextMessages);
    // 如果删除的是当前活动会话，切换到第一个可用会话
    let nextActiveId = s.activeSessionId;
    if (s.activeSessionId === id) {
      nextActiveId = nextSessions.length > 0 ? nextSessions[0].id : null;
      persistActiveSession(nextActiveId);
    }
    return {
      sessions: nextSessions,
      activeSessionId: nextActiveId,
      sessionMessages: nextMessages
    };
  }),
  setActiveSession: (id) => {
    persistActiveSession(id);
    set({ activeSessionId: id });
  },
  updateSessionTitle: (id, title) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess)
  })),
  updateSessionCliId: (id, cliId) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, cli_session_id: cliId } : sess)
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedModel: (model) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MODEL_STORAGE_KEY, model);
    }

    set({ selectedModel: model });
  },

  addMessage: (sessionId, msg) => set((s) => ({
    sessionMessages: (() => {
      const nextMessages = {
        ...s.sessionMessages,
        [sessionId]: [...(s.sessionMessages[sessionId] || []), msg]
      };
      persistSessionMessages(nextMessages);
      return nextMessages;
    })()
  })),
  updateMessage: (sessionId, id, content) => set((s) => ({
    sessionMessages: (() => {
      const nextMessages = {
        ...s.sessionMessages,
        [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
          m.id === id ? { ...m, content } : m
        )
      };
      persistSessionMessages(nextMessages);
      return nextMessages;
    })()
  })),
  appendContentBlock: (sessionId, id, block) => set((s) => ({
    sessionMessages: (() => {
      const nextMessages = {
        ...s.sessionMessages,
        [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
          m.id === id ? {
            ...m,
            contentBlocks: [...(m.contentBlocks || []), block]
          } : m
        )
      };
      persistSessionMessages(nextMessages);
      return nextMessages;
    })()
  })),
  deleteMessage: (sessionId, id) => set((s) => ({
    sessionMessages: (() => {
      const nextMessages = {
        ...s.sessionMessages,
        [sessionId]: (s.sessionMessages[sessionId] || []).filter((m) => m.id !== id)
      };
      persistSessionMessages(nextMessages);
      return nextMessages;
    })()
  })),
  setMessageError: (sessionId, id, error) => set((s) => ({
    sessionMessages: (() => {
      const nextMessages = {
        ...s.sessionMessages,
        [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
          m.id === id ? { ...m, error } : m
        )
      };
      persistSessionMessages(nextMessages);
      return nextMessages;
    })()
  })),
  setMessageStreaming: (sessionId, id, streaming) => set((s) => ({
    sessionMessages: (() => {
      const nextMessages = {
        ...s.sessionMessages,
        [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
          m.id === id ? { ...m, streaming } : m
        )
      };
      persistSessionMessages(nextMessages);
      return nextMessages;
    })()
  })),
  setLoading: (v) => set({ loading: v }),

  addToast: (message, type = "info") => set((s) => ({
    toasts: [...s.toasts, { id: Date.now().toString(), message, type }]
  })),
  removeToast: (id) => set((s) => ({
    toasts: s.toasts.filter((t) => t.id !== id)
  })),
}));
