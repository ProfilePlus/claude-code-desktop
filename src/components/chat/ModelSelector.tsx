import { useMemo, useRef, useState, useEffect } from "react";
import { useChatStore } from "../../stores/chatStore";

type ModelOption = {
  id: string;
  name: string;
  context: string;
};

const BASE_MODELS: ModelOption[] = [
  { id: "minimax-m2.7", name: "MiniMax M2.7", context: "128K" },
  { id: "opus", name: "Opus 4.6", context: "200K" },
  { id: "opus-1m", name: "Opus 4.6 (1M)", context: "1M" },
  { id: "sonnet", name: "Sonnet 4.6", context: "200K" },
  { id: "sonnet-1m", name: "Sonnet 4.6 (1M)", context: "1M" },
  { id: "sonnet-3.7", name: "Sonnet 3.7", context: "200K" },
  { id: "sonnet-3.5", name: "Sonnet 3.5", context: "200K" },
  { id: "haiku", name: "Haiku 4.5", context: "200K" },
  { id: "haiku-3.5", name: "Haiku 3.5", context: "200K" },
];

function formatModelLabel(modelId: string) {
  if (modelId === "minimax-m2.7") {
    return "MiniMax M2.7";
  }

  return modelId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = useMemo(() => {
    const existing = BASE_MODELS.find((model) => model.id === selectedModel);
    if (existing) {
      return BASE_MODELS;
    }

    return [
      {
        id: selectedModel,
        name: formatModelLabel(selectedModel),
        context: "当前",
      },
      ...BASE_MODELS,
    ];
  }, [selectedModel]);

  const currentModel = models.find((model) => model.id === selectedModel) || models[0];

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

  return (
    <div className="model-selector" ref={dropdownRef}>
      <button
        className="model-selector-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="选择模型"
        type="button"
      >
        <span className="model-selector-value">{currentModel.name}</span>
        <span className={`model-selector-arrow ${isOpen ? "model-selector-arrow-open" : ""}`}>▾</span>
      </button>

      {isOpen && (
        <div className="model-selector-dropdown">
          {models.map((model) => (
            <button
              key={model.id}
              className={`model-selector-option ${
                model.id === selectedModel ? "model-selector-option-active" : ""
              }`}
              onClick={() => {
                setSelectedModel(model.id);
                setIsOpen(false);
              }}
              type="button"
            >
              <div className="model-selector-option-content">
                <span className="model-selector-option-name">{model.name}</span>
                <span className="model-selector-option-context">{model.context}</span>
              </div>
              {model.id === selectedModel && <span className="model-selector-option-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
