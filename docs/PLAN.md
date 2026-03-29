# Claude Code Desktop v0.0.1 — 实现方案

## Context

Claude Code CLI 功能强大但终端交互体验有限：不支持图片粘贴预览、没有会话可视化管理、配置修改需要手动编辑 JSON。目标是构建一个全中文的 Windows 桌面客户端，通过包装 CLI 子进程来复用其完整的工具系统和认证机制，同时提供现代化的 GUI 体验。

- 项目目录：`D:\AI\ClaudeDesktop`
- 项目名：`claude-code-desktop`
- 版本：`0.0.1`
- 远程仓库：GitHub

## 实现难度评估

**中等偏上**。核心难点不在 UI，而在于：
1. CLI stream-json 协议解析和状态机管理
2. Windows 子进程 stdin/stdout 管道的稳定性
3. 多模态数据（图片）的编码和注入
4. 权限确认交互的双向通信

预计 **10-15 天**可完成核心功能。

---

## 一、技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 桌面框架 | **Tauri v2** | 体积小（~8MB vs Electron 150MB），系统已有 Rust 1.94.0，Win10 自带 WebView2 |
| 前端 | **React 18 + TypeScript** | 生态成熟，组件丰富 |
| 状态管理 | **Zustand** | 轻量，适合中等复杂度 |
| 样式 | **TailwindCSS** | 快速开发，易做暗色主题 |
| Markdown | **react-markdown + rehype-highlight** | 代码高亮、GFM 支持 |
| 核心通信 | **CLI Wrapper（子进程）** | 复用 CLI 全部 40+ 工具、认证、MCP、hooks、plugins |

### 为什么选 CLI Wrapper 而非 Direct API

自己实现 Anthropic Messages API + 工具系统意味着要重写 Bash、FileEdit、Glob、Grep、WebFetch、MCP 等 40+ 工具的完整逻辑，以及权限管理、CLAUDE.md 发现、session 持久化等。CLI 的 `--output-format stream-json` + `--input-format stream-json` 已提供完整的结构化双向通信协议，直接复用是最务实的选择。

---

## 二、核心架构

```
┌──────────────────────────────────────────┐
│              Tauri Window                │
│  ┌────────────────────────────────────┐  │
│  │         React Frontend             │  │
│  │  ChatView │ SessionList │ Settings │  │
│  └──────────────┬─────────────────────┘  │
│                 │ IPC (invoke / listen)   │
│  ┌──────────────┴─────────────────────┐  │
│  │          Rust Backend              │  │
│  │  SessionManager  │ ConfigManager   │  │
│  │  ProcessBridge   │ ImageProcessor  │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ spawn + stdin/stdout pipe
       ┌──────────▼──────────┐
       │   claude CLI 子进程   │
       │   --output-format    │
       │     stream-json      │
       │   --input-format     │
       │     stream-json      │
       │   --verbose          │
       └─────────────────────┘
```

### 通信协议

CLI 的 stream-json 输出包含以下事件类型：

```jsonc
// 1. 系统初始化
{"type": "system", "subtype": "init", "session_id": "uuid", "tools": [...]}

// 2. AI 文本响应（流式）
{"type": "assistant", "subtype": "message", "message": {"content": [{"type": "text", "text": "..."}]}}

// 3. 工具调用
{"type": "assistant", "subtype": "message", "message": {"content": [{"type": "tool_use", "id": "xxx", "name": "Bash", "input": {...}}]}}

// 4. 工具结果
{"type": "user", "subtype": "tool_result", "tool_result": {"tool_use_id": "xxx", "content": "..."}}

// 5. 最终结果
{"type": "result", "subtype": "success", "result": "...", "total_cost_usd": 0.035, "usage": {...}}
```

前端通过 `--input-format stream-json` 向 stdin 发送用户消息：
```jsonc
{"type": "user", "content": [
  {"type": "text", "text": "用户消息"},
  {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "..."}}
]}
```

---

## 三、功能模块

### 3.1 聊天核心
- 流式消息渲染（逐字显示）
- Markdown 渲染：代码高亮、表格、列表、链接
- 工具调用卡片（折叠/展开，显示工具名、输入、输出）
- 多轮对话（`--input-format stream-json` 持续写入 stdin）
- 底部状态栏：模型名、费用、token 用量、耗时

### 3.2 多模态输入
- **Ctrl+V 粘贴图片**：Rust 侧通过 `arboard` crate 读取剪贴板图片 → base64 编码 → 前端预览 → 发送时注入 stream-json
- **拖拽图片文件**：Tauri 原生 file drop 事件 → 读取文件 → base64
- **输入框预览**：消息发送前显示图片缩略图，可删除

### 3.3 会话管理
- 侧边栏会话列表（读取 `~/.claude/sessions/` 目录）
- 新建对话（spawn 新 CLI 进程）
- 恢复对话（`--resume <session-id>` 或 `--continue`）
- 会话重命名、删除
- 每个会话可指定不同工作目录（`--add-dir`）

### 3.4 配置管理
- GUI 设置面板，读写 `~/.claude/settings.json`
- 支持配置：API Key、Base URL、模型选择、权限模式
- MCP 服务器管理（读写 `~/.claude.json` 中的 `mcpServers`）
- 主题切换（亮色/暗色/跟随系统）
- 字体大小调节

### 3.5 权限交互
- CLI 在需要权限确认时会通过 stream-json 发送权限请求事件
- 前端弹出确认对话框（允许/拒绝/始终允许）
- 用户选择后通过 stdin 回传

### 3.6 快捷键
| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新建对话 |
| Ctrl+L | 清屏 |
| Ctrl+, | 打开设置 |
| Ctrl+V | 粘贴（含图片） |
| Enter | 发送消息 |
| Shift+Enter | 换行 |
| Ctrl+C | 中断当前生成 |

---

## 四、关键技术难点与解决方案

### 4.1 stream-json 协议解析
**难点**：CLI 输出是 NDJSON（每行一个 JSON），但可能存在非 JSON 的 stderr 输出混入。
**方案**：Rust 侧分别捕获 stdout 和 stderr，stdout 逐行解析 JSON，stderr 单独转发给前端显示为系统消息。使用 `serde_json` 做健壮的行解析，跳过非法行。

### 4.2 Windows 管道稳定性
**难点**：Windows 上子进程 stdin 管道写入可能阻塞或丢失。
**方案**：Rust 侧使用 `tokio::process::Command` 异步管理子进程，stdin/stdout 分别在独立 tokio task 中处理，避免死锁。

### 4.3 多模态数据注入
**难点**：需要确认 CLI 的 `--input-format stream-json` 是否支持 image content block。
**方案**：第零阶段协议验证中测试。如果不支持，备选方案是将图片保存为临时文件，让 CLI 通过 FileRead 工具读取。

### 4.4 权限确认的双向通信
**难点**：CLI 在等待权限确认时会阻塞，需要 GUI 及时响应。
**方案**：stream-json 输出中会包含权限请求事件，前端收到后弹出对话框，用户选择后通过 stdin 写入响应。需要仔细处理超时和取消场景。

### 4.5 进程生命周期管理
**难点**：用户关闭窗口、切换会话时需要正确清理子进程。
**方案**：Rust 侧维护进程池（HashMap<SessionId, Child>），窗口关闭时 graceful shutdown（先发 SIGTERM，超时后 SIGKILL）。

---

## 五、项目目录结构

```
D:\AI\ClaudeDesktop\
├── docs/
│   └── PLAN.md                    # 本方案文件
├── src-tauri/                     # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs                # 入口
│   │   ├── commands/              # Tauri IPC 命令
│   │   │   ├── mod.rs
│   │   │   ├── session.rs         # 会话管理命令
│   │   │   ├── config.rs          # 配置读写命令
│   │   │   └── clipboard.rs       # 剪贴板图片命令
│   │   ├── process/               # CLI 子进程管理
│   │   │   ├── mod.rs
│   │   │   ├── bridge.rs          # 进程桥接（spawn/stdin/stdout）
│   │   │   └── parser.rs          # stream-json 解析器
│   │   └── config/                # 配置文件管理
│   │       ├── mod.rs
│   │       └── settings.rs        # settings.json 读写
│   └── icons/
├── src/                           # React 前端
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatView.tsx       # 主聊天区域
│   │   │   ├── MessageBubble.tsx  # 消息气泡
│   │   │   ├── ToolCallCard.tsx   # 工具调用卡片
│   │   │   ├── InputArea.tsx      # 输入区域（含图片预览）
│   │   │   └── StatusBar.tsx      # 底部状态栏
│   │   ├── sidebar/
│   │   │   ├── SessionList.tsx    # 会话列表
│   │   │   └── SessionItem.tsx
│   │   └── settings/
│   │       ├── SettingsPanel.tsx
│   │       └── McpConfig.tsx
│   ├── stores/
│   │   ├── chatStore.ts           # 聊天状态
│   │   ├── sessionStore.ts        # 会话状态
│   │   └── settingsStore.ts       # 设置状态
│   ├── hooks/
│   │   ├── useClaudeProcess.ts    # CLI 进程通信 hook
│   │   └── useClipboard.ts        # 剪贴板 hook
│   ├── types/
│   │   └── stream.ts              # stream-json 类型定义
│   └── i18n/
│       └── zh-CN.ts               # 中文文案
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── README.md
└── .gitignore
```

---

## 六、分阶段实施计划

### 第零阶段：协议验证（0.5 天）
1. 用脚本测试 `claude -p --output-format stream-json --verbose --input-format stream-json` 的完整输出格式
2. 验证 stream-json 输入中 image content block 是否被支持
3. 验证权限确认事件的格式和交互方式
4. 记录所有事件类型的完整 JSON 结构到 `docs/protocol.md`
5. 如果发现协议限制，调整后续方案

### 第一阶段：项目骨架（1-2 天）
1. `npm create tauri-app@latest` 初始化 Tauri v2 + React + TypeScript 项目
2. 配置 TailwindCSS、中文字体
3. Rust 侧实现基础 `ProcessBridge`：spawn claude CLI、捕获 stdout/stderr
4. 前端实现最简聊天界面：输入框 + 消息列表
5. 打通 IPC：前端发消息 → Rust spawn CLI → 返回结果 → 前端显示

### 第二阶段：核心聊天（3-4 天）
1. 完善 stream-json 协议解析，处理所有事件类型
2. 实现 `ToolCallCard` 组件，展示工具调用过程（折叠/展开）
3. Markdown 渲染：代码高亮、表格、列表
4. 实现 `--continue` 多轮对话
5. 实现会话历史本地持久化
6. 底部状态栏：模型名、费用、token 用量
7. 输入框多行编辑、Shift+Enter 换行、Enter 发送

### 第三阶段：会话管理（2 天）
1. 侧边栏会话列表，从本地历史加载
2. 新建对话、恢复对话（`--resume`）
3. 会话重命名、删除
4. 工作目录选择器（每个会话可指定不同 cwd）
5. 会话搜索

### 第四阶段：多模态与配置（2-3 天）
1. 剪贴板图片粘贴（Ctrl+V）
2. 文件拖拽上传图片
3. 图片预览和删除
4. 设置面板：API 密钥、Base URL、模型选择
5. 配置文件读写（`~/.claude/settings.json`）
6. 主题切换（亮色/暗色/跟随系统）
7. 字体大小调节

### 第五阶段：打磨与发布（2-3 天）
1. 错误处理完善：断网、CLI 崩溃、API 限流
2. 快捷键系统
3. 窗口位置/大小记忆
4. 系统托盘（最小化到托盘）
5. 打包为 .msi 安装包
6. README 编写
7. GitHub Release

---

## 七、验证方案

1. **协议验证**：脚本测试 stream-json 双向通信的所有事件类型
2. **单元测试**：Rust 侧 parser 模块的 JSON 解析测试
3. **集成测试**：前端发送消息 → CLI 响应 → 前端正确渲染
4. **多模态测试**：粘贴图片 → 预览 → 发送 → AI 识别图片内容
5. **会话测试**：新建 → 对话 → 关闭 → 恢复 → 历史完整
6. **异常测试**：断网 → 确认错误提示；关闭窗口 → 确认子进程正确清理

---

## 八、关键依赖版本

```toml
# Cargo.toml
[dependencies]
tauri = { version = "2", features = ["shell-open-api"] }
tauri-plugin-shell = "2"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
arboard = "3"                    # 剪贴板
base64 = "0.22"
dirs = "5"                       # 获取 home 目录
```

```json
// package.json
{
  "name": "claude-code-desktop",
  "version": "0.0.1",
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "zustand": "^4",
    "react-markdown": "^9",
    "rehype-highlight": "^7",
    "remark-gfm": "^4",
    "@tauri-apps/api": "^2"
  },
  "devDependencies": {
    "tailwindcss": "^3",
    "typescript": "^5",
    "vite": "^5",
    "@tauri-apps/cli": "^2"
  }
}
```
