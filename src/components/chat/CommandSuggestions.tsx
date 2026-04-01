import { useEffect, useState } from "react";

interface Command {
  name: string;
  description: string;
  category: "skill" | "command";
}

const COMMANDS: Command[] = [
  { name: "/help", description: "显示帮助信息", category: "command" },
  { name: "/clear", description: "清空当前对话", category: "command" },
  { name: "/export", description: "导出对话记录", category: "command" },
  { name: "/settings", description: "打开设置", category: "command" },
];

// 这里可以从系统提醒中获取实际的 skills
const SKILLS: Command[] = [
  { name: "/claude-desktop-next", description: "自动推进到下一开发阶段", category: "skill" },
  { name: "/claude-desktop-phase", description: "阶段跳转和状态查看", category: "skill" },
];

interface CommandSuggestionsProps {
  query: string;
  onSelect: (command: string) => void;
  position: { top: number; left: number };
}

export function CommandSuggestions({ query, onSelect, position }: CommandSuggestionsProps) {
  const [filtered, setFiltered] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const allCommands = [...COMMANDS, ...SKILLS];
    const searchQuery = query.toLowerCase().replace(/^\//, ""); // 移除开头的 /

    const results = allCommands.filter((cmd) => {
      const cmdName = cmd.name.toLowerCase().replace(/^\//, ""); // 移除开头的 /
      const cmdDesc = cmd.description.toLowerCase();

      // 支持模糊匹配：检查命令名称或描述中是否包含搜索词
      return cmdName.includes(searchQuery) || cmdDesc.includes(searchQuery);
    });

    setFiltered(results);
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].name);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelect]);

  if (filtered.length === 0) return null;

  return (
    <div
      className="command-suggestions"
      style={{
        position: "absolute",
        bottom: "100%",
        left: position.left,
        marginBottom: "8px",
      }}
    >
      {filtered.map((cmd, idx) => (
        <button
          key={cmd.name}
          className={`command-suggestion-item ${
            idx === selectedIndex ? "command-suggestion-item-active" : ""
          }`}
          onClick={() => onSelect(cmd.name)}
          onMouseEnter={() => setSelectedIndex(idx)}
        >
          <div className="command-suggestion-content">
            <span className="command-suggestion-name">{cmd.name}</span>
            <span className="command-suggestion-desc">{cmd.description}</span>
          </div>
          <span className="command-suggestion-badge">
            {cmd.category === "skill" ? "Skill" : "命令"}
          </span>
        </button>
      ))}
    </div>
  );
}
