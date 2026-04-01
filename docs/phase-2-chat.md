# Phase 2: 流式聊天（1-2 天）

## 目标
实现流式输出，前端实时显示 Claude 响应的打字机效果。

## 任务清单
1. Rust 侧改造 `ProcessBridge`：解析 `stream_event` 事件，通过 Tauri Event 推送到前端
2. 前端监听 Tauri Event，实时更新消息内容
3. 实现打字机效果（逐字显示）
4. 处理 Markdown 渲染（代码高亮）
5. 优化 UI：加载状态、错误提示

## 涉及文件
- 修改: `src-tauri/src/process/bridge.rs`（流式解析）
- 修改: `src-tauri/src/lib.rs`（添加流式命令）
- 修改: `src/components/chat/ChatView.tsx`（监听事件）
- 修改: `src/stores/chatStore.ts`（支持流式更新）

## 验收标准
- [ ] 前端能实时看到 Claude 响应的打字机效果
- [ ] Markdown 代码块正确高亮
- [ ] 流式过程中可以看到加载状态
- [ ] 错误能正确显示

## 技术要点
- 使用 `--include-partial-messages` 获取 `stream_event`
- 解析 `content_block_delta` 事件中的 `text_delta`
- 使用 `app.emit()` 推送事件到前端
- 前端用 `listen()` 监听事件
