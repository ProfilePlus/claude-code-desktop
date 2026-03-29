# Phase 0: 协议验证（0.5 天）

## 目标
验证 Claude CLI 的 stream-json 双向通信协议，确认所有假设正确。

## 任务清单
1. 测试 `claude -p --output-format stream-json --verbose --input-format stream-json` 的完整输出格式
2. 验证 stream-json 输入中 image content block 是否被支持
3. 验证权限确认事件的格式和交互方式
4. 记录所有事件类型的完整 JSON 结构到 `docs/protocol.md`
5. 如果发现协议限制，调整后续方案

## 涉及文件
- 新建: `docs/protocol.md`（协议文档）
- 新建: `scripts/test-stream-json.sh`（测试脚本）

## 验收标准
- [ ] 所有事件类型的 JSON 结构已记录
- [ ] 图片输入支持已确认（或找到备选方案）
- [ ] 权限交互流程已验证
- [ ] protocol.md 文档完整清晰

## 技术要点
- CLI 输出是 NDJSON（每行一个 JSON）
- 需要区分 stdout（JSON 事件）和 stderr（系统消息）
- 关键事件类型：system/init、assistant/message、tool_use、tool_result、result/success
