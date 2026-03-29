# Claude Code Desktop 项目上下文

## 项目概述
全中文 Windows 桌面客户端，通过包装 Claude CLI 子进程提供现代化 GUI 体验。

## 技术栈
- **桌面框架**: Tauri v2（体积小，Win10 自带 WebView2）
- **前端**: React 18 + TypeScript + Zustand + TailwindCSS
- **Markdown**: react-markdown + rehype-highlight
- **核心通信**: CLI Wrapper（子进程 stream-json 协议）

## 核心架构
```
React 前端 → Tauri IPC → Rust 后端 → CLI 子进程 (stream-json)
```

## 目录结构
- `src-tauri/`: Rust 后端（ProcessBridge、SessionManager、ConfigManager）
- `src/`: React 前端（components、stores、hooks、types）
- `docs/`: 计划文档和阶段文件

## 关键技术决策
1. **为什么用 CLI Wrapper**: 复用 CLI 全部 40+ 工具、认证、MCP、hooks，避免重写
2. **stream-json 协议**: CLI 的 `--output-format stream-json` + `--input-format stream-json` 提供完整双向通信
3. **Windows 管道**: 使用 `tokio::process::Command` 异步管理，stdin/stdout 独立 task 避免死锁

## 编码规范
- Rust: 使用 tokio 异步，serde_json 做健壮解析
- React: Zustand 状态管理，组件拆分清晰
- TypeScript: 严格类型，stream-json 事件类型完整定义

## 关键依赖
- Rust: tauri 2, tokio 1, serde_json 1, arboard 3, base64 0.22
- Node: react 18, zustand 4, react-markdown 9, @tauri-apps/api 2
