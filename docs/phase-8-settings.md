# Phase 8: 设置面板与快捷键（1 天）

## 目标
添加全局设置面板，支持主题切换、字体调整、快捷键配置等个性化设置。

## 任务清单
1. 创建设置面板组件
2. 实现主题切换（Dark/Light）
3. 实现字体大小调整
4. 实现快捷键系统
5. 实现设置持久化
6. 添加设置入口按钮

## 涉及文件
- 新建: `src/components/settings/SettingsModal.tsx`（设置对话框）
- 新建: `src/components/settings/AppearanceTab.tsx`（外观设置）
- 新建: `src/components/settings/KeybindingsTab.tsx`（快捷键设置）
- 新建: `src/hooks/useKeyboard.ts`（快捷键 Hook）
- 新建: `src/stores/settingsStore.ts`（设置状态管理）
- 新建: `src-tauri/src/settings/mod.rs`（设置管理）
- 修改: `src-tauri/src/lib.rs`（添加设置命令）
- 修改: `src/index.css`（添加 Light 主题）

## 验收标准
- [ ] 可以打开设置面板
- [ ] 可以切换主题（Dark/Light）
- [ ] 可以调整字体大小
- [ ] 可以配置快捷键
- [ ] Ctrl+N 新建会话
- [ ] Ctrl+K 搜索会话
- [ ] Ctrl+, 打开设置
- [ ] 重启后设置保留

## 技术要点
- 使用 CSS 变量实现主题切换
- 快捷键使用 useEffect + addEventListener
- 设置存储到 {app_data_dir}/settings.json
- 字体大小通过 CSS 变量动态调整
- 快捷键冲突检测
