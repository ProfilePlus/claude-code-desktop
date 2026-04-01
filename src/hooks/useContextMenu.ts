import { useState, useCallback } from "react";

interface ContextMenuState {
  x: number;
  y: number;
  visible: boolean;
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false });

  const showMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, visible: true });
  }, []);

  const hideMenu = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  return { menu, showMenu, hideMenu };
}
