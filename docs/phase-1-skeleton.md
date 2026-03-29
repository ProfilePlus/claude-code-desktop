# Phase 1: 项目骨架（1-2 天）

## 目标
搭建 Tauri v2 + React 项目骨架，打通前后端基础通信。

## 任务清单
1. `npm create tauri-app@latest` 初始化 Tauri v2 + React + TypeScript 项目
2. 配置 TailwindCSS、中文字体
3. Rust 侧实现基础 `ProcessBridge`：spawn claude CLI、捕获 stdout/stderr
4. 前端实现最简聊天界面：输入框 + 消息列表
5. 打通 IPC：前端发消息 → Rust spawn CLI → 返回结果 → 前端显示

## 涉及文件
- 新建: `src-tauri/src/process/bridge.rs`（进程桥接）
- 新建: `src-tauri/src/commands/session.rs`（会话命令）
- 新建: `src/components/chat/ChatView.tsx`（聊天视图）
- 新建: `src/components/chat/InputArea.tsx`（输入区域）
- 新建: `src/stores/chatStore.ts`（聊天状态）

## 验收标准
- [ ] Tauri 项目可正常启动
- [ ] 前端输入消息后能看到 CLI 响应
- [ ] stdout/stderr 正确分离
- [ ] 基础 UI 可用（输入框 + 消息列表）

## 技术要点
- 使用 `tokio::process::Command` 异步 spawn
- stdin/stdout 在独立 tokio task 中处理
- IPC 使用 Tauri 的 `#[tauri::command]`
