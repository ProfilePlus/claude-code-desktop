# Phase 3: 会话管理（2 天）

## 目标
实现完整的会话管理功能，支持多会话切换、恢复、搜索。

## 任务清单
1. 侧边栏会话列表，从本地历史加载
2. 新建对话、恢复对话（`--resume`）
3. 会话重命名、删除
4. 工作目录选择器（每个会话可指定不同 cwd）
5. 会话搜索

## 涉及文件
- 新建: `src-tauri/src/commands/session.rs`（会话管理命令）
- 新建: `src/components/sidebar/SessionList.tsx`（会话列表）
- 新建: `src/components/sidebar/SessionItem.tsx`（会话项）
- 新建: `src/stores/sessionStore.ts`（会话状态）

## 验收标准
- [ ] 侧边栏显示所有历史会话
- [ ] 可新建、切换、恢复会话
- [ ] 会话可重命名、删除
- [ ] 每个会话可指定不同工作目录
- [ ] 会话搜索功能正常

## 技术要点
- 读取 `~/.claude/sessions/` 目录
- 使用 `--resume <session-id>` 恢复会话
- Rust 侧维护进程池（HashMap<SessionId, Child>）
