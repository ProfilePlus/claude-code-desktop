# Phase 6: 消息操作增强（1 天）

## 目标
为消息添加右键菜单和快捷操作，支持复制、删除、编辑、重新生成等功能。

## 任务清单
1. 创建右键菜单组件
2. 实现消息复制功能
3. 实现消息删除功能
4. 实现消息编辑功能
5. 实现重新生成回复功能
6. 添加代码块复制按钮

## 涉及文件
- 新建: `src/components/chat/MessageMenu.tsx`（右键菜单组件）
- 新建: `src/hooks/useContextMenu.ts`（右键菜单 Hook）
- 修改: `src/components/chat/ChatView.tsx`（集成菜单和编辑功能）
- 修改: `src/stores/chatStore.ts`（添加 deleteMessage, editMessage 方法）

## 验收标准
- [ ] 右键点击消息显示菜单
- [ ] 可以复制消息内容到剪贴板
- [ ] 可以复制代码块内容
- [ ] 可以删除单条消息
- [ ] 可以编辑用户消息并重新发送
- [ ] 可以重新生成 AI 回复
- [ ] 删除/编辑有确认提示

## 技术要点
- 使用自定义右键菜单实现
- 消息编辑需要保存原始消息，支持取消
- 删除消息后需要更新会话状态
- 代码块复制需要识别 Markdown 代码块
- 使用 navigator.clipboard API 复制内容
