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

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  sessionMessages: {},
  loading: false,
  toasts: [],
  searchQuery: "",
  selectedModel: "opus",

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({
    sessions: [session, ...s.sessions],
    activeSessionId: session.id,
    sessionMessages: { ...s.sessionMessages, [session.id]: [] }
  })),
  setActiveSession: (id) => set({ activeSessionId: id }),
  updateSessionTitle: (id, title) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess)
  })),
  updateSessionCliId: (id, cliId) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, cli_session_id: cliId } : sess)
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  addMessage: (sessionId, msg) => set((s) => ({
    sessionMessages: {
      ...s.sessionMessages,
      [sessionId]: [...(s.sessionMessages[sessionId] || []), msg]
    }
  })),
  updateMessage: (sessionId, id, content) => set((s) => ({
    sessionMessages: {
      ...s.sessionMessages,
      [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
        m.id === id ? { ...m, content } : m
      )
    }
  })),
  appendContentBlock: (sessionId, id, block) => set((s) => ({
    sessionMessages: {
      ...s.sessionMessages,
      [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
        m.id === id ? {
          ...m,
          contentBlocks: [...(m.contentBlocks || []), block]
        } : m
      )
    }
  })),
  deleteMessage: (sessionId, id) => set((s) => ({
    sessionMessages: {
      ...s.sessionMessages,
      [sessionId]: (s.sessionMessages[sessionId] || []).filter((m) => m.id !== id)
    }
  })),
  setMessageError: (sessionId, id, error) => set((s) => ({
    sessionMessages: {
      ...s.sessionMessages,
      [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
        m.id === id ? { ...m, error } : m
      )
    }
  })),
  setMessageStreaming: (sessionId, id, streaming) => set((s) => ({
    sessionMessages: {
      ...s.sessionMessages,
      [sessionId]: (s.sessionMessages[sessionId] || []).map((m) =>
        m.id === id ? { ...m, streaming } : m
      )
    }
  })),
  setLoading: (v) => set({ loading: v }),

  addToast: (message, type = "info") => set((s) => ({
    toasts: [...s.toasts, { id: Date.now().toString(), message, type }]
  })),
  removeToast: (id) => set((s) => ({
    toasts: s.toasts.filter((t) => t.id !== id)
  })),
}));
