import { useEffect, useRef } from "react";

interface MenuOption {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface MessageMenuProps {
  x: number;
  y: number;
  options: MenuOption[];
  onClose: () => void;
}

export function MessageMenu({ x, y, options, onClose }: MessageMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={menuRef} className="menu-surface fixed z-50 min-w-[180px]" style={{ left: x, top: y }}>
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          className="menu-item"
        >
          {option.icon && <span className="text-[11px] text-[var(--text-muted)]">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
