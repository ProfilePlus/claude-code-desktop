# Phase 4: 媒体输入（1 天）

## 目标
支持图片上传和发送，实现多模态对话。

## 任务清单
1. 前端添加图片选择按钮
2. 图片预览功能
3. Rust 侧支持图片 base64 编码
4. 修改 bridge.rs 支持 image content block
5. 前端消息显示支持图片

## 涉及文件
- 修改: `src-tauri/src/process/bridge.rs`（支持图片输入）
- 修改: `src/components/chat/ChatView.tsx`（图片选择和预览）
- 修改: `src/stores/chatStore.ts`（消息支持图片）
- 新建: `src-tauri/src/utils/image.rs`（图片处理工具）

## 验收标准
- [ ] 可以选择本地图片
- [ ] 图片有预览显示
- [ ] 发送图片后 Claude 能识别并回复
- [ ] 消息列表正确显示图片

## 技术要点
- CLI 图片输入格式：`{"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "..."}}`
- 支持的图片格式：JPEG, PNG, GIF, WebP
- 图片需要 base64 编码
- 注意：使用第三方 API 代理时图片功能可能受限
