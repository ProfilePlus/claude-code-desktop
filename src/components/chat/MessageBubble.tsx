import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Message } from "../../stores/chatStore";
import { MessageMenu } from "./MessageMenu";
import { useContextMenu } from "../../hooks/useContextMenu";
import { DotsLoader } from "../common/LoadingSpinner";

interface MessageBubbleProps {
  msg: Message;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ msg, onEdit, onDelete, onRegenerate }: MessageBubbleProps) {
  const isUser = msg.role === "user";
  const { menu, hideMenu } = useContextMenu();

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
      <div className={`message ${isUser ? "message-outgoing" : "message-incoming"} animate-message-slide-in`}>
        {!isUser && (
          <div className="message-avatar ai">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.67 20 7.53 18.83 6.26 16.95C6.74 14.97 8.94 14 12 14C15.06 14 17.26 14.97 17.74 16.95C16.47 18.83 14.33 20 12 20Z"></path>
            </svg>
          </div>
        )}
        <div className="message-content">
          <div
            className={`message-bubble ${
              isUser
                ? "message-bubble-user"
                : msg.error
                  ? "message-bubble-error"
                  : "message-bubble-assistant"
            }`}
          >
            {isUser ? (
              <>
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
              </>
            ) : (
              <>
                {msg.streaming && !msg.content.trim() ? (
                  <div className="message-streaming-loader">
                    <DotsLoader />
                  </div>
                ) : (
                  <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </>
            )}
          </div>
          <div className="message-time">
            下午 {isUser ? "2:18" : "2:16"}
          </div>
        </div>
        {isUser && <div className="message-avatar me">AL</div>}
      </div>

      {menu.visible && <MessageMenu x={menu.x} y={menu.y} options={menuOptions} onClose={hideMenu} />}
    </>
  );
}
