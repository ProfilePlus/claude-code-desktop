# Phase 5: 界面优化（1 天）

## 目标
完善用户体验，添加必要的交互细节和错误处理。

## 任务清单
1. 会话持久化到本地 JSON 文件
2. 添加会话删除功能
3. 优化加载状态显示
4. 添加错误提示 Toast
5. 优化滚动行为
6. 添加空状态提示

## 涉及文件
- 修改: `src-tauri/src/session/manager.rs`（持久化逻辑）
- 修改: `src-tauri/src/lib.rs`（添加删除会话命令）
- 修改: `src/components/sidebar/SessionList.tsx`（删除按钮）
- 修改: `src/components/chat/ChatView.tsx`（优化交互）
- 新建: `src/components/common/Toast.tsx`（错误提示）

## 验收标准
- [ ] 应用重启后会话历史保留
- [ ] 可以删除会话
- [ ] 加载时有明确的状态提示
- [ ] 错误有友好的提示信息
- [ ] 滚动行为流畅自然
- [ ] 空状态有引导文案

## 技术要点
- 使用 Tauri 的 app_data_dir 存储会话数据
- 会话文件路径：`{app_data_dir}/sessions.json`
- 启动时自动加载会话列表
- 每次会话变更时保存到文件
