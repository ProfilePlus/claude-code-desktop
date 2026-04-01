import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true);
    });

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 220);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    error: { icon: "错误", className: "toast-surface-error" },
    success: { icon: "完成", className: "toast-surface-success" },
    info: { icon: "提示", className: "toast-surface-info" },
  }[type];

  return (
    <div
      className={`toast-surface ${styles.className} transition-all duration-200 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="toast-row">
        <div className="toast-icon">{styles.icon}</div>
        <div className="toast-text">{message}</div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 220);
          }}
          className="toast-close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "error" | "success" | "info" }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-stack pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  );
}
