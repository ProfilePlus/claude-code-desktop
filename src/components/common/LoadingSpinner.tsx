import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--border-color)] border-t-[var(--accent-primary)]`}
        role="status"
        aria-label="加载中"
      />
      {text && <p className="text-sm text-[var(--text-muted)]">{text}</p>}
    </div>
  );
};

export const SkeletonMessage: React.FC = () => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      <div className="h-4 rounded bg-[var(--bg-elevated)] w-3/4"></div>
      <div className="h-4 rounded bg-[var(--bg-elevated)] w-1/2"></div>
      <div className="h-4 rounded bg-[var(--bg-elevated)] w-5/6"></div>
    </div>
  );
};

export const SkeletonSessionItem: React.FC = () => {
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--border-color)] p-3 animate-pulse">
      <div className="h-4 rounded bg-[var(--bg-elevated)] w-3/4"></div>
      <div className="h-3 rounded bg-[var(--bg-elevated)] w-1/2"></div>
    </div>
  );
};

export const DotsLoader: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`loading-dots ${className}`}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};
