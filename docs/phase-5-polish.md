# Phase 5: 打磨与发布（2-3 天）

## 目标
完善错误处理、快捷键、打包发布。

## 任务清单
1. 错误处理完善：断网、CLI 崩溃、API 限流
2. 快捷键系统
3. 窗口位置/大小记忆
4. 系统托盘（最小化到托盘）
5. 打包为 .msi 安装包
6. README 编写
7. GitHub Release

## 涉及文件
- 完善: 所有 Rust 模块（错误处理）
- 新建: `src/hooks/useKeyboard.ts`（快捷键 hook）
- 完善: `src-tauri/tauri.conf.json`（打包配置）
- 新建: `README.md`（项目文档）

## 验收标准
- [ ] 断网、崩溃等异常有友好提示
- [ ] 快捷键系统完整（Ctrl+N、Ctrl+L、Ctrl+,等）
- [ ] 窗口状态持久化
- [ ] 系统托盘功能正常
- [ ] .msi 安装包可正常安装
- [ ] README 文档完整

## 技术要点
- 使用 Tauri 的 `tauri-plugin-window-state` 持久化窗口
- 使用 `tauri-plugin-system-tray` 实现托盘
- 打包命令：`npm run tauri build`
