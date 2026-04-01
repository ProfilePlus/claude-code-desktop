# Phase 7: 会话增强功能（1 天）

## 目标
增强会话管理能力，支持重命名、导出、搜索等高级功能。

## 任务清单
1. 实现会话重命名功能
2. 实现会话导出（Markdown/JSON）
3. 添加会话搜索框
4. 显示会话统计信息
5. 优化会话列表 UI

## 涉及文件
- 修改: `src/components/sidebar/SessionList.tsx`（添加搜索和重命名）
- 新建: `src/components/sidebar/SessionExport.tsx`（导出对话框）
- 新建: `src-tauri/src/session/export.rs`（导出逻辑）
- 修改: `src-tauri/src/lib.rs`（添加 export_session 命令）
- 修改: `src/stores/chatStore.ts`（添加搜索状态）

## 验收标准
- [ ] 双击会话标题可以重命名
- [ ] 可以导出会话为 Markdown 文件
- [ ] 可以导出会话为 JSON 文件
- [ ] 搜索框可以过滤会话列表
- [ ] 会话显示消息数量统计
- [ ] 会话显示创建时间

## 技术要点
- 使用 Tauri dialog 插件选择保存路径
- Markdown 导出格式化消息内容
- JSON 导出包含完整会话数据
- 搜索使用前端过滤
- 重命名实时保存到持久化存储
