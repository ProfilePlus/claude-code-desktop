# Phase 3: 会话管理（1 天）

## 目标
实现多会话管理，支持会话持久化和历史记录。

## 任务清单
1. Rust 侧实现 `SessionManager`：用 `--resume` 复用会话
2. 前端实现会话列表侧边栏
3. 支持新建会话、切换会话
4. 会话标题自动生成（取第一条消息前 20 字）
5. 会话持久化到本地（Tauri store 或 JSON 文件）

## 涉及文件
- 新建: `src-tauri/src/session/manager.rs`（会话管理）
- 修改: `src-tauri/src/process/bridge.rs`（支持 session_id）
- 修改: `src-tauri/src/lib.rs`（添加会话命令）
- 新建: `src/components/sidebar/SessionList.tsx`（会话列表）
- 修改: `src/stores/chatStore.ts`（多会话状态）

## 验收标准
- [ ] 可以新建多个会话
- [ ] 切换会话时消息列表正确切换
- [ ] 会话标题自动生成
- [ ] 应用重启后会话历史保留

## 技术要点
- CLI 的 `--resume <session_id>` 可复用已有会话（保持上下文）
- 会话 ID 从 `system/init` 事件的 `session_id` 字段获取
- 持久化用 JSON 文件存储到 Tauri 的 app_data_dir
