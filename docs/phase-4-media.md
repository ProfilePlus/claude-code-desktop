# Phase 4: 多模态与配置（2-3 天）

## 目标
支持图片输入、配置管理、主题切换。

## 任务清单
1. 剪贴板图片粘贴（Ctrl+V）
2. 文件拖拽上传图片
3. 图片预览和删除
4. 设置面板：API 密钥、Base URL、模型选择
5. 配置文件读写（`~/.claude/settings.json`）
6. 主题切换（亮色/暗色/跟随系统）
7. 字体大小调节

## 涉及文件
- 新建: `src-tauri/src/commands/clipboard.rs`（剪贴板命令）
- 新建: `src-tauri/src/config/settings.rs`（配置读写）
- 新建: `src/components/settings/SettingsPanel.tsx`（设置面板）
- 新建: `src/components/settings/McpConfig.tsx`（MCP 配置）
- 新建: `src/stores/settingsStore.ts`（设置状态）
- 完善: `src/components/chat/InputArea.tsx`（图片预览）

## 验收标准
- [ ] Ctrl+V 可粘贴图片并预览
- [ ] 拖拽图片文件可上传
- [ ] 设置面板可读写配置
- [ ] 主题切换正常工作
- [ ] 字体大小可调节

## 技术要点
- 使用 `arboard` crate 读取剪贴板
- 图片 base64 编码注入 stream-json
- 读写 `~/.claude/settings.json` 和 `~/.claude.json`
