---
name: mac-desktop-refresh
version: 2.0.0
description: 检查当前 Tauri + React 桌面项目，优化功能体验，并将页面统一为更稳定的 mac 应用风格。
author: dev-task-generator
---

# Mac Desktop Refresh

自动生成的项目级任务控制 Skill。它不会在首轮 Phase 完成后自动退场，而是持续维护项目状态、迭代记录和测试闭环。

## 需求摘要

当前项目是一个已完成功能基线的 Tauri + React 桌面应用，用户要求在现有基础上继续做变更驱动型优化：先检查项目现状，再优化功能体验，并把页面统一成更接近 mac 桌面应用的视觉与交互风格。

**功能点：**
- 审计当前前端与桌面端实现，确认可优化点和兼容风险
- 优化现有功能体验，例如设置持久化、模型选择记忆、输入与侧栏交互一致性
- 将页面重构为更接近 mac 应用的窗口层次、工具栏、侧栏和内容区风格
- 修复视觉变量、组件层级和交互细节中的不一致项
- 为前端、后端、前后端联动测试补齐回归闭环

**技术栈：**
- Vite
- React 19 + TypeScript
- Zustand
- Tailwind CSS 4
- Tauri 2 + Rust

## Phase 列表

### phase-1: 现状审计与优化方案

**状态：** pending

**模块：** shared

**任务：**
- 审计当前聊天区、侧栏、设置面板和状态管理实现
- 确认功能体验不一致点与视觉不统一点
- 界定本轮优化涉及的前端、状态持久化和桌面样式范围
- 形成 replacement 策略，避免破坏已完成功能

**依赖：** 无

**来源 Phase：** 无

**验收标准：**
- 已列出当前项目中需要优化的关键功能点
- 已明确 mac 风格改造涉及的主要组件和样式入口
- 已确认本轮不直接改写历史完成记录，而是通过新增优化 Phase 推进

### phase-2: 优化或替换实现

**状态：** pending

**模块：** shared

**任务：**
- 实现功能体验优化，包括本地持久化、侧栏交互和输入区细节修正
- 重构窗口层次、工具栏、侧栏和会话区样式，使其更接近 mac 应用风格
- 修复未定义或不一致的设计变量与组件表现
- 核对与现有 Tauri 聊天、会话、设置能力的兼容性

**依赖：** phase-1

**来源 Phase：** 无

**验收标准：**
- 页面整体视觉风格明显向 mac 桌面应用靠拢
- 核心功能在优化后仍保持可用
- 设置与关键交互状态可以在重新打开后保持
- 关键受影响文件已记录到 artifacts 中

### phase-3: 优化回归测试

**状态：** pending

**模块：** integration

**任务：**
- 执行前端构建与关键界面回归
- 执行 Tauri 会话、发送消息、设置和侧栏操作的联动验证
- 记录前端、后端、联动测试结果与剩余风险

**依赖：** phase-2

**来源 Phase：** 无

**验收标准：**
- 前端构建通过
- 已覆盖主要界面和关键交互链路
- 已记录剩余风险与后续 iterate 建议

## 使用方式

### 首次执行
```bash
/mac-desktop-refresh
```
开始当前计划中的首个可执行 Phase。

### 恢复执行
```bash
/mac-desktop-refresh
```
自动检测 `progress.json`，恢复当前 Phase 或启动下一个可执行 Phase。

### 查看状态
```bash
/mac-desktop-refresh status
```
显示 lifecycle、当前 iteration、已完成与待执行 Phase，以及三模块测试覆盖状态。

### 追加迭代
```bash
/mac-desktop-refresh iterate
```
在现有历史基础上追加新的 Phase，例如新功能、优化、返工、补测。

### 重排未完成计划
```bash
/mac-desktop-refresh replan
```
只调整 `pending` / `in_progress` 的 Phase。已完成 Phase 始终保留为历史事实，不直接改写。

## 执行逻辑（内部）

### 1. 状态检测

每次调用时先读取 `.claude/skills/mac-desktop-refresh/progress.json`，并按以下顺序判断：

```javascript
const progress = readJSON("progress.json");

if (command === "status") {
  showStatus(progress);
  return;
}

if (command === "iterate") {
  enterIterateMode(progress);
  return;
}

if (command === "replan") {
  enterReplanMode(progress);
  return;
}

const activePhase = progress.phases.find((phase) => phase.status === "in_progress");
if (activePhase) {
  resumePhase(activePhase);
  return;
}

const nextPhase = progress.phases.find((phase) =>
  phase.status === "pending" &&
  phase.dependencies.every((depId) => {
    const dep = progress.phases.find((item) => item.id === depId);
    return dep && dep.status === "completed";
  })
);

if (nextPhase) {
  startPhase(nextPhase);
  return;
}

if (progress.metrics.completedPhases === progress.metrics.totalPhases) {
  markLifecycle(progress, "delivered");
  showDeliveredActions(["status", "iterate"]);
  return;
}

showBlockedState(progress);
```

### 2. iterate 模式

`iterate` 不是覆盖旧计划，而是向尾部追加新 Phase。

### 3. replan 模式

`replan` 只影响未完成部分。

### 4. Phase 状态与生命周期

项目级 lifecycle：
- `active`
- `delivered`
- `iterating`
- `replanning`
- `blocked`

Phase 状态：
- `pending`
- `in_progress`
- `completed`
- `failed`
- `superseded`

### 5. 三模块测试规则

**后端测试**
- 默认工具：`curl`
- 重点覆盖 Tauri command 调用链路、会话管理、消息发送与错误路径

**前端测试**
- 工具优先级：`browser-use` -> `agent browser` -> `opencli`
- 重点覆盖窗口层次、侧栏、聊天输入区、设置面板与模型选择

**前后端联动测试**
- 覆盖“前端动作 -> Tauri 调用或状态变化 -> 前端结果可见”的桌面应用闭环

### 6. 完成与交付

每个 Phase 完成后更新：
- `completedAt`
- `artifacts`
- `verification`
- `context.lastGitCommit`
- `metrics.completedPhases`

如果当前所有 Phase 均完成：
- 将 `lifecycle` 更新为 `delivered`
- 写入 `completionHistory`
- 不结束项目，只提示可继续 `iterate`

## 注意事项

1. 不直接改写已完成历史；新优化通过追加 Phase 推进。
2. `replan` 只影响未完成部分。
3. 三模块测试必须保持结构化。
4. 当前项目以 React + Tauri 双端兼容为前提，不能只做纯视觉改造而忽略功能稳定性。

## Iteration 1

### phase-4: 生成多版 mac UI 方案图

**状态：** pending

**模块：** frontend

**任务：**
- 基于 imagegen 工作流生成 3 到 4 版差异明确的 mac 风格桌面 UI 概念图
- 每版方案明确窗口 chrome、侧栏、消息区、工具栏、材质和留白策略
- 控制设计方向避免当前界面的普通网页感，强调更强的 mac 应用气质
- 整理每版方案的关键词、优缺点和适合实现的风险说明，供用户选择

**依赖：** 无

**来源 Phase：** phase-2

**验收标准：**
- 已输出至少 3 版可比较的 UI 概念图
- 每版方案均有文字说明与选择依据
- 用户可以明确选定一个方向进入实现

### phase-5: 按选定方案实现新 UI

**状态：** pending

**模块：** frontend

**任务：**
- 将用户选中的 mac UI 方案翻译为实际组件和样式改造
- 统一窗口层次、导航密度、字体节奏、阴影材质与交互反馈
- 在不破坏现有功能的前提下重做关键页面视觉表现
- 记录与概念图之间的偏差、约束与取舍

**依赖：** phase-4

**来源 Phase：** phase-2, phase-4

**验收标准：**
- 选定方案的关键视觉特征已落地
- 主要页面的 mac 风格显著增强
- 核心功能和操作流程保持可用

### phase-6: 新 UI 设计回归测试

**状态：** pending

**模块：** integration

**任务：**
- 执行新 UI 的前端构建与关键视觉回归
- 验证选定设计实现后会话、设置、输入和侧栏操作链路未退化
- 记录视觉还原度、交互一致性和剩余设计债务

**依赖：** phase-5

**来源 Phase：** phase-5

**验收标准：**
- 前端构建通过
- 关键交互链路通过回归验证
- 视觉与实现偏差已记录

## Iteration 2

### phase-7: Figma 100% 还原实现

**状态：** pending

**模块：** frontend

**任务：**
- 以 Figma Make 中选定的 GlassMacOS 方案为唯一基线，重新校准窗口 chrome、侧栏、主内容区、空状态卡片和输入区
- 逐项消除当前实现与 Figma 在材质、比例、留白、层级、边框、高光和控件密度上的偏差
- 必要时调整组件结构和布局，不以保留现有视觉实现为优先，而以高保真还原为优先
- 记录仍无法完全对齐 Figma 的技术约束与残余差异

**依赖：** phase-6

**来源 Phase：** phase-4, phase-5, phase-6

**验收标准：**
- 核心视觉区域与 Figma 方案高度一致
- 当前实现的主要偏差已被修正或明确记录
- 已为截图对比验证准备好稳定界面

### phase-8: Figma 截图对比验证

**状态：** pending

**模块：** integration

**任务：**
- 启动应用并截取实现后的关键界面截图
- 与 Figma GlassMacOS 方案进行并排对比，逐项检查窗口 chrome、侧栏、内容区、空状态和输入区
- 输出截图对比结论与剩余偏差清单
- 确认高保真还原没有破坏关键交互链路

**依赖：** phase-7

**来源 Phase：** phase-7

**验收标准：**
- 已完成实现图与 Figma 图的截图对比
- 主要视觉区域偏差有明确结论
- 关键交互链路经回归后仍可用

## Iteration 3

### phase-9: Figma 输入区重设计

**状态：** pending

**模块：** frontend

**任务：**
- 基于当前 GlassMacOS 方案重新设计聊天态页面，重点重做底部输入区
- 不改变产品类型，保留 mac 桌面聊天工作区方向，但提升输入区与主内容区的一体化程度
- 输出 3 个以内但差异明确的高保真方案，核心比较输入区壳层、输入面比例、模型栏整合方式与聊天区关系
- 冻结一个新的输入区基准方案用于后续实现

**依赖：** phase-8

**来源 Phase：** phase-4, phase-7, phase-8

**验收标准：**
- 已输出可比较的输入区重设计方案
- 当前“输入框不融入页面风格”的问题被直接作为设计对象处理
- 用户可明确选定新输入区方案进入实现

### phase-10: 按新 Figma 输入区方案实现

**状态：** pending

**模块：** frontend

**任务：**
- 按选中的新 Figma 方案重做输入区、底部工具带和与聊天区的衔接关系
- 必要时连带调整消息区纵向节奏、底部留白和最后一条消息位置
- 保持现有消息发送、文件上传、模型选择和停止生成等功能可用
- 记录与旧实现的替换点和仍未完全对齐的细节

**依赖：** phase-9

**来源 Phase：** phase-7, phase-8, phase-9

**验收标准：**
- 输入区整体观感明显比当前实现更贴近 mac 风格 Figma 方案
- 输入区与页面主内容区不再割裂
- 相关交互仍保持可用

### phase-11: 新输入区截图对比与回归

**状态：** pending

**模块：** integration

**任务：**
- 启动桌面应用并截取新输入区实现图
- 对照新的 Figma 输入区方案做截图比对
- 验证输入、发送、文件选择、模型切换等交互链路
- 输出新一轮对比结论与剩余偏差清单

**依赖：** phase-10

**来源 Phase：** phase-10

**验收标准：**
- 已完成输入区重设计后的截图对比
- 输入区相关交互链路未退化
- 剩余偏差有明确记录
