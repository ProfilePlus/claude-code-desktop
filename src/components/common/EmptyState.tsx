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
    <div className="empty-chat-minimal">
      <h2 className="empty-chat-minimal-title">开始新的对话</h2>
      {onNewSession && (
        <button onClick={onNewSession} className="primary-action mt-4">
          新建会话
        </button>
      )}
    </div>
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
      className="empty-state-sidebar"
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
