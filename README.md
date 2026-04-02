# ClaudeDesktop

基于 Tauri + React + TypeScript 构建的桌面应用，调用 Claude CLI 实现智能对话功能。

## 已实现功能

### 核心功能
- **多模型支持**：支持 MiniMax、Opus、Sonnet、Haiku 等多种模型切换
- **流式响应**：实时显示 AI 回复，支持流式输出
- **会话管理**：创建、切换、删除对话会话
- **会话持久化**：本地存储对话历史

### 界面特性
- **主题切换**：支持深色/浅色主题
- **交通灯按钮**：自定义窗口控制按钮（关闭/最小化/最大化）
- **响应式布局**：普通窗口和最大化窗口自适应边距
- **命令提示**：输入 `/` 唤起快捷命令和技能选择

### 快捷键
- `Ctrl+N`：新建对话
- `Ctrl+K`：聚焦搜索框
- `Ctrl+,`：打开设置
- `Ctrl+B`：展开/收起侧边栏
- `Shift+Enter`：发送消息

## 后续升级计划

### Phase 1 - 用户体验优化
- [ ] 命令提示框增加更多内置命令（/help, /clear, /export, /settings）
- [ ] 技能（Skills）系统集成
- [ ] 对话导出功能（Markdown/JSON 格式）

### Phase 2 - 项目绑定功能
- [ ] 新建对话时选择关联项目目录
- [ ] 项目管理器（创建、删除、列表）
- [ ] 会话与项目绑定，支持工作目录上下文
- [ ] 侧边栏显示当前会话关联的项目信息

### Phase 3 - 高级功能
- [ ] 图片上传与理解
- [ ] 语音输入
- [ ] 多语言支持

## 技术栈

- **前端**：React + TypeScript + Zustand + TailwindCSS
- **后端**：Rust + Tauri
- **AI**：Claude CLI (通过 IPC 调用)

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 打包

```bash
# 打包为安装程序
npm run tauri build
```

打包后的文件位于 `src-tauri/target/release/bundle/` 目录。

## 运行要求

- Windows 10/11（含 WebView2）
- 已安装并配置好的 Claude CLI
