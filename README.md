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

详细计划见 [plans/upgrade-plan.md](plans/upgrade-plan.md)

### Phase 1: 项目中心化 (Project-Centric)
**目标：让 AI 工作真正围绕"项目"展开**

- [ ] 新建对话时选择关联项目目录
- [ ] 项目管理器（创建/删除/列表）
- [ ] 会话与项目绑定，支持工作目录上下文
- [ ] 自动读取项目文件结构作为上下文
- [ ] 代码库索引和语义搜索

### Phase 2: 技能与自动化 (Skills & Automation)
**目标：把 ClaudeDesktop 变成真正的 AI 工作站**

- [ ] 内置技能市场（Skills Marketplace）
- [ ] 自定义技能创建（YAML/JSON 定义）
- [ ] 自动化工作流编排器
- [ ] Git 操作界面、数据库连接器等应用集成

### Phase 3: 多模态交互 (Multimodal)
**目标：支持更丰富的输入输出**

- [ ] 图片理解与分析、截图快捷键
- [ ] 语音输入（STT）和语音播报（TTS）
- [ ] PDF/Word/Excel 文档处理

### Phase 4: 团队协作 (Team Collaboration)
**目标：从个人工具扩展到团队工具**

- [ ] 团队空间（创建/管理/共享项目）
- [ ] 实时协作编辑、评论和标注
- [ ] 团队知识库

### Phase 5: 开发者生态 (Developer Ecosystem)
**目标：开放生态，赋能社区**

- [ ] 插件系统和插件市场
- [ ] REST API 和 Webhook
- [ ] 主题市场和主题编辑器

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
