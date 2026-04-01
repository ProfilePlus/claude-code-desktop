# UI 改版修复方案

## 问题：图片预览显示方式变更

### 当前状态
新 UI 将图片上传预览从缩略图改为文件名显示：

```tsx
// src/components/chat/ChatView.tsx 第 387-397 行
<div className="attachment-strip animate-slide-in-bottom">
  {images.map((img, idx) => (
    <div key={`${img.path}-${idx}`} className="attachment-chip">
      <span>{img.path.split(/[/\\]/).pop()}</span>  {/* 只显示文件名 */}
      <button onClick={() => setImages(images.filter((_, i) => i !== idx))}>×</button>
    </div>
  ))}
</div>
```

### 问题影响
- 用户无法直观看到上传的图片内容
- 需要依赖文件名判断图片
- 用户体验下降

---

## 修复方案

### 方案 1: 恢复缩略图预览（推荐）

**修改文件**: `src/components/chat/ChatView.tsx`

**修改位置**: 第 387-397 行

**修改内容**:
```tsx
{images.length > 0 && (
  <div className="attachment-strip animate-slide-in-bottom">
    {images.map((img, idx) => (
      <div key={`${img.path}-${idx}`} className="attachment-preview-card">
        <img
          src={`data:${img.mediaType};base64,${img.data}`}
          alt="preview"
          className="attachment-thumbnail"
        />
        <button
          onClick={() => setImages(images.filter((_, i) => i !== idx))}
          className="attachment-remove-btn"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}
```

**新增 CSS** (添加到 `src/index.css`):
```css
.attachment-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.attachment-preview-card {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.attachment-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--accent-red);
  color: white;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.attachment-remove-btn:hover {
  background: var(--accent-red);
  transform: scale(1.1);
}
```

**优点**:
- 用户可以直观看到图片内容
- 符合用户习惯
- 视觉效果更好

**缺点**:
- 需要加载图片数据
- 占用更多空间

---

### 方案 2: 混合显示（文件名 + 小图标）

**修改内容**:
```tsx
<div className="attachment-strip animate-slide-in-bottom">
  {images.map((img, idx) => (
    <div key={`${img.path}-${idx}`} className="attachment-chip-with-preview">
      <div className="attachment-mini-preview">
        <img src={`data:${img.mediaType};base64,${img.data}`} alt="" />
      </div>
      <span className="attachment-filename">
        {img.path.split(/[/\\]/).pop()}
      </span>
      <button onClick={() => setImages(images.filter((_, i) => i !== idx))}>
        ×
      </button>
    </div>
  ))}
</div>
```

**新增 CSS**:
```css
.attachment-chip-with-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.attachment-mini-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.attachment-mini-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment-filename {
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**优点**:
- 兼顾视觉和信息
- 占用空间适中
- 文件名可读性好

**缺点**:
- 图标较小，细节不清晰

---

### 方案 3: 保持现状（不推荐）

**理由**:
- 当前设计更简洁
- 节省空间
- 加载速度快

**问题**:
- 用户体验较差
- 不符合主流设计习惯

---

## 推荐实施

### 第一步：采用方案 1（恢复缩略图）

1. 修改 `src/components/chat/ChatView.tsx` 第 387-397 行
2. 在 `src/index.css` 末尾添加新 CSS
3. 测试图片上传和预览功能
4. 验证删除按钮位置和交互

### 第二步：编译测试

```bash
npm run build
cd src-tauri
cargo build --release
```

### 第三步：功能验证

- [ ] 上传单张图片
- [ ] 上传多张图片
- [ ] 删除图片
- [ ] 粘贴图片
- [ ] 发送带图片的消息

---

## 预期效果

修复后，图片上传区域将显示：
- 80x80 像素的缩略图
- 右上角的删除按钮（红色圆形）
- 悬停时删除按钮放大
- 平滑的进入动画

---

## 其他建议

### 可选优化
1. **添加图片大图预览**
   - 点击缩略图查看原图
   - 使用模态框展示

2. **支持拖拽排序**
   - 调整图片顺序
   - 使用 react-beautiful-dnd

3. **显示图片尺寸信息**
   - 在缩略图下方显示
   - 格式：1920x1080

---

## 时间估算

- 方案 1 实施：15 分钟
- 测试验证：10 分钟
- 总计：25 分钟
