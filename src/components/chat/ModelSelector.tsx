import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../stores/chatStore";

const MODELS = [
  { id: "opus", name: "Opus 4.6", fullName: "claude-opus-4-6", context: "200K" },
  { id: "opus-1m", name: "Opus 4.6 (1M)", fullName: "claude-opus-4-6-1m", context: "1M" },
  { id: "sonnet", name: "Sonnet 4.6", fullName: "claude-sonnet-4-6", context: "200K" },
  { id: "sonnet-1m", name: "Sonnet 4.6 (1M)", fullName: "claude-sonnet-4-6-1m", context: "1M" },
  { id: "sonnet-3.7", name: "Sonnet 3.7", fullName: "claude-3-7-sonnet-20250219", context: "200K" },
  { id: "sonnet-3.5", name: "Sonnet 3.5", fullName: "claude-3-5-sonnet-20241022", context: "200K" },
  { id: "haiku", name: "Haiku 4.5", fullName: "claude-haiku-4-5", context: "200K" },
  { id: "haiku-3.5", name: "Haiku 3.5", fullName: "claude-3-5-haiku-20241022", context: "200K" },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsOpen(false);
  };

  return (
    <div className="model-selector" ref={dropdownRef}>
      <button
        className="model-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="选择模型"
      >
        <span className="model-selector-label">Claude</span>
        <span className="model-selector-dot">·</span>
        <span className="model-selector-value">{currentModel.name}</span>
        <span className={`model-selector-arrow ${isOpen ? "model-selector-arrow-open" : ""}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="model-selector-dropdown">
          {MODELS.map((model) => (
            <button
              key={model.id}
              className={`model-selector-option ${
                model.id === selectedModel ? "model-selector-option-active" : ""
              }`}
              onClick={() => handleSelect(model.id)}
            >
              <div className="model-selector-option-content">
                <span className="model-selector-option-name">{model.name}</span>
                <span className="model-selector-option-context">{model.context}</span>
              </div>
              {model.id === selectedModel && (
                <span className="model-selector-option-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
