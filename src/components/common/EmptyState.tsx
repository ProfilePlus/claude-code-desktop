import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  tips,
  className = "",
}) => {
  return (
    <div className={`empty-board-shell ${className}`}>
      {icon && <div className="empty-icon animate-fade-in">{icon}</div>}
      <div className="empty-title animate-slide-in-bottom">{title}</div>
      {description && <div className="empty-description animate-slide-in-bottom">{description}</div>}
      {tips && tips.length > 0 && (
        <div className="empty-tips animate-slide-in-bottom">
          {tips.map((tip) => (
            <div key={tip} className="tip-chip">
              {tip}
            </div>
          ))}
        </div>
      )}
      {action && (
        <div className="empty-actions animate-scale-in">
          <button onClick={action.onClick} className="primary-action">
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export const EmptyChat: React.FC<{ onNewSession?: () => void }> = ({ onNewSession }) => {
  return (
    <EmptyState
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M7 8h10M7 12h6m-2 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-2l-4 4z"
          />
        </svg>
      }
      title="开始新线程"
      description="从一个干净、安静的工作区开始。重点只放在线程、消息和输入。"
      tips={["Ctrl+K 搜索", "粘贴图片", "自动标题"]}
      action={onNewSession ? { label: "新建会话", onClick: onNewSession } : undefined}
    />
  );
};

export const EmptySessionList: React.FC<{ onNewSession: () => void }> = ({ onNewSession }) => {
  return (
    <EmptyState
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M5 7h14M5 12h14M5 17h8"
          />
        </svg>
      }
      title="还没有会话"
      description="先创建一个会话，左侧列表就会成为你的长期工作记录。"
      action={{ label: "新建会话", onClick: onNewSession }}
    />
  );
};

export const EmptySearchResult: React.FC = () => {
  return (
    <EmptyState
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
          />
        </svg>
      }
      title="没有找到匹配会话"
      description="换个关键词试试，或者直接从左上角新建一个新的对话。"
    />
  );
};
