import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Message } from "../../stores/chatStore";
import { MessageMenu } from "./MessageMenu";
import { useContextMenu } from "../../hooks/useContextMenu";

interface MessageBubbleProps {
  msg: Message;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ msg, onEdit, onDelete, onRegenerate }: MessageBubbleProps) {
  const isUser = msg.role === "user";
  const { menu, showMenu, hideMenu } = useContextMenu();

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
  };

  const menuOptions = isUser
    ? [
        { label: "复制", onClick: handleCopy, icon: "复制" },
        { label: "编辑", onClick: () => onEdit?.(msg.id), icon: "编辑" },
        { label: "删除", onClick: () => onDelete?.(msg.id), icon: "删除" },
      ]
    : [
        { label: "复制", onClick: handleCopy, icon: "复制" },
        { label: "重新生成", onClick: () => onRegenerate?.(), icon: "重试" },
        { label: "删除", onClick: () => onDelete?.(msg.id), icon: "删除" },
      ];

  return (
    <>
      <div className={`message-row ${isUser ? "message-row-user" : ""} animate-message-slide-in`}>
        <div
          onContextMenu={showMenu}
          className={`message-bubble ${
            isUser
              ? "message-bubble-user"
              : msg.error
              ? "message-bubble-error"
              : "message-bubble-assistant"
          }`}
        >
          <div className="message-meta">
            <span>{isUser ? "You" : "Claude"}</span>
            <span className="message-dot"></span>
            <span>{msg.error ? "错误" : msg.streaming ? "处理中" : "完成"}</span>
          </div>

          {isUser ? (
            <div className="message-body message-body-user">
              {msg.images && msg.images.length > 0 && (
                <div className="uploaded-image-grid">
                  {msg.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`data:${img.mediaType};base64,${img.data}`}
                      alt="uploaded"
                      className="uploaded-image"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              {msg.content}
            </div>
          ) : (
            <div className="message-body assistant-markdown">
              <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                {msg.content || (msg.streaming ? "..." : "")}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {menu.visible && <MessageMenu x={menu.x} y={menu.y} options={menuOptions} onClose={hideMenu} />}
    </>
  );
}
