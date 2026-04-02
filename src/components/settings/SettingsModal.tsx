import { useSettingsStore } from "../../stores/settingsStore";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, setTheme, setFontSize } = useSettingsStore();

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-surface animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div>
            <div className="settings-title">设置</div>
            <div className="settings-copy">保持界面轻盈、通透，像一层真正贴在桌面上的玻璃应用。</div>
          </div>
          <button onClick={onClose} className="secondary-action" aria-label="关闭设置">
            关闭
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <div className="settings-label">主题</div>
            <div className="settings-help">当前提供深色和浅色两套简约配色，设置会保存在本地，下次打开继续沿用。</div>
            <div className="theme-switcher">
              <button
                onClick={() => setTheme("dark")}
                className={`theme-option ${settings.theme === "dark" ? "theme-option-active" : ""}`}
              >
                <strong>深色</strong>
                <span>更接近 Codex 风格</span>
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`theme-option ${settings.theme === "light" ? "theme-option-active" : ""}`}
              >
                <strong>浅色</strong>
                <span>更清爽，适合白天使用</span>
              </button>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-label">字体大小</div>
            <div className="settings-help">调整阅读密度，让会话区和侧栏适合你的屏幕尺寸。这个偏好也会自动记住。</div>
            <div className="settings-row">
              <span className="text-[var(--text-secondary)]">当前大小</span>
              <kbd>{settings.fontSize}px</kbd>
            </div>
            <input
              type="range"
              min="12"
              max="20"
              value={settings.fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="range-input mt-4"
            />
          </section>

          <section className="settings-section">
            <div className="settings-label">快捷键</div>
            <div className="settings-help">这些快捷键已经接入当前桌面应用，可以直接使用。</div>
            <div className="kbd-list">
              <div className="kbd-row">
                <span>新建会话</span>
                <kbd>Ctrl+N</kbd>
              </div>
              <div className="kbd-row">
                <span>搜索会话</span>
                <kbd>Ctrl+K</kbd>
              </div>
              <div className="kbd-row">
                <span>打开设置</span>
                <kbd>Ctrl+,</kbd>
              </div>
              <div className="kbd-row">
                <span>折叠侧栏</span>
                <kbd>Ctrl+B</kbd>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
