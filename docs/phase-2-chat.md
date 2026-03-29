# Phase 2: 核心聊天（3-4 天）

## 目标
完善聊天功能，支持流式渲染、工具调用展示、多轮对话。

## 任务清单
1. 完善 stream-json 协议解析，处理所有事件类型
2. 实现 `ToolCallCard` 组件，展示工具调用过程（折叠/展开）
3. Markdown 渲染：代码高亮、表格、列表
4. 实现 `--continue` 多轮对话
5. 实现会话历史本地持久化
6. 底部状态栏：模型名、费用、token 用量
7. 输入框多行编辑、Shift+Enter 换行、Enter 发送

## 涉及文件
- 完善: `src-tauri/src/process/parser.rs`（stream-json 解析器）
- 新建: `src/components/chat/ToolCallCard.tsx`（工具调用卡片）
- 新建: `src/components/chat/MessageBubble.tsx`（消息气泡）
- 新建: `src/components/chat/StatusBar.tsx`（状态栏）
- 新建: `src/types/stream.ts`（stream-json 类型定义）

## 验收标准
- [ ] 流式消息逐字显示
- [ ] 工具调用过程可视化（折叠/展开）
- [ ] Markdown 正确渲染（代码高亮）
- [ ] 多轮对话正常工作
- [ ] 状态栏显示费用和 token 用量

## 技术要点
- 使用 `react-markdown` + `rehype-highlight` 渲染
- stream-json 事件类型完整处理
- 会话历史持久化到本地文件
