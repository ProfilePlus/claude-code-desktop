use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tauri::{AppHandle, Emitter};
use serde_json::Value;
use std::env;
use std::fs::OpenOptions;
use std::io::Write;

fn find_claude_command() -> String {
    // Common installation paths for Claude CLI (try .cmd first on Windows)
    let common_paths = vec![
        "D:\\ENV\\node\\claude.cmd",
        "D:\\ENV\\node\\claude.exe",
        "D:\\ENV\\node\\claude",
    ];

    for path in common_paths {
        if std::path::Path::new(path).exists() {
            return path.to_string();
        }
    }

    // Try to find claude in PATH (prioritize .cmd on Windows)
    if let Ok(path_var) = env::var("PATH") {
        for path in env::split_paths(&path_var) {
            let claude_cmd = path.join("claude.cmd");
            if claude_cmd.exists() {
                return claude_cmd.to_string_lossy().to_string();
            }
            let claude_exe = path.join("claude.exe");
            if claude_exe.exists() {
                return claude_exe.to_string_lossy().to_string();
            }
            let claude_path = path.join("claude");
            if claude_path.exists() {
                return claude_path.to_string_lossy().to_string();
            }
        }
    }

    // Fallback to just "claude" and hope it's in PATH
    "claude".to_string()
}

#[derive(Clone, serde::Serialize)]
pub struct StreamChunk {
    pub delta: String,
    pub session_id: String,
}

#[derive(Clone, serde::Serialize)]
pub struct StreamDone {
    pub full_text: String,
    pub session_id: String,
    pub cli_session_id: String,
}

#[derive(Clone, serde::Serialize)]
pub struct StreamError {
    pub error: String,
    pub session_id: String,
}

#[derive(Clone, serde::Deserialize)]
pub struct ImageContent {
    pub media_type: String,
    pub data: String,
}

/// 流式发送消息，通过 Tauri Event 推送 delta
/// session_id: 前端会话 ID
/// cli_session_id: CLI 的 session_id（用于 --resume），None 表示新会话
/// images: 可选的图片列表（base64 编码）
/// model: 可选的模型选择（opus/sonnet/haiku）
pub async fn send_message_stream(
    app: AppHandle,
    prompt: String,
    session_id: String,
    cli_session_id: Option<String>,
    images: Option<Vec<ImageContent>>,
    model: Option<String>,
) -> Result<String, String> {
    // 添加文件日志
    let mut log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("D:/AI/ClaudeDesktop/bridge-debug.log")
        .ok();

    if let Some(ref mut f) = log_file {
        let _ = writeln!(f, "\n========== send_message_stream called ==========");
        let _ = writeln!(f, "  prompt: {}", prompt);
        let _ = writeln!(f, "  session_id: {}", session_id);
        let _ = writeln!(f, "  cli_session_id: {:?}", cli_session_id);
        let _ = writeln!(f, "  model: {:?}", model);
    }

    let claude_cmd = find_claude_command();
    let mut args = vec![
        "-p",
        "--output-format",
        "stream-json",
        "--verbose",
        "--input-format",
        "stream-json",
        "--include-partial-messages",
        "--dangerously-skip-permissions",
    ];

    // 如果指定了模型，添加 --model 参数
    let model_arg;
    if let Some(ref m) = model {
        args.push("--model");
        model_arg = m.clone();
        args.push(&model_arg);
    }

    // 如果有 CLI session_id，使用 --resume 复用会话
    let resume_arg;
    if let Some(ref sid) = cli_session_id {
        args.push("--resume");
        resume_arg = sid.clone();
        args.push(&resume_arg);
    }

    let mut child = Command::new(&claude_cmd)
        .args(&args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .creation_flags(0x08000000) // CREATE_NO_WINDOW on Windows
        .spawn()
        .map_err(|e| format!("Failed to spawn claude: {}. Please ensure Claude CLI is installed and in PATH.", e))?;

    // 写入用户消息
    let mut content_blocks: Vec<Value> = vec![];

    // 添加图片
    if let Some(imgs) = images {
        for img in imgs {
            content_blocks.push(serde_json::json!({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": img.media_type,
                    "data": img.data
                }
            }));
        }
    }

    // 添加文本
    content_blocks.push(serde_json::json!({
        "type": "text",
        "text": prompt
    }));

    let input = serde_json::json!({
        "type": "user",
        "message": {
            "role": "user",
            "content": content_blocks
        }
    });
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all((input.to_string() + "\n").as_bytes())
            .await
            .map_err(|e| format!("Failed to write stdin: {e}"))?;
        drop(stdin);
    }

    // 读取 stdout，解析 stream_event
    let stdout = child.stdout.take().ok_or("No stdout")?;
    let mut reader = BufReader::new(stdout).lines();
    let mut full_text = String::new();
    let mut new_cli_session_id = String::new();

    while let Ok(Some(line)) = reader.next_line().await {
        if let Ok(event) = serde_json::from_str::<Value>(&line) {
            // 从 init 事件获取 CLI session_id
            if event["type"] == "system" && event["subtype"] == "init" {
                if let Some(sid) = event["session_id"].as_str() {
                    new_cli_session_id = sid.to_string();
                }
            }
            // 处理 assistant 消息事件（包含完整的内容块）
            else if event["type"] == "assistant" {
                if let Some(content_array) = event["message"]["content"].as_array() {
                    for block in content_array {
                        match block["type"].as_str() {
                            Some("text") => {
                                if let Some(text) = block["text"].as_str() {
                                    full_text.push_str(text);
                                    let _ = app.emit("stream-chunk", StreamChunk {
                                        delta: text.to_string(),
                                        session_id: session_id.clone(),
                                    });
                                }
                            }
                            Some("thinking") => {
                                if let Some(text) = block["text"].as_str() {
                                    let thinking_text = format!("\n\n<details><summary>💭 思考过程</summary>\n\n{}\n</details>\n\n", text);
                                    full_text.push_str(&thinking_text);
                                    let _ = app.emit("stream-chunk", StreamChunk {
                                        delta: thinking_text,
                                        session_id: session_id.clone(),
                                    });
                                }
                            }
                            Some("tool_use") => {
                                if let Some(name) = block["name"].as_str() {
                                    let input = &block["input"];

                                    // 格式化工具调用
                                    let mut tool_text = format!("\n\n<div class=\"tool-call\">\n<div class=\"tool-call-header\">🔧 {}</div>\n", name);

                                    // 格式化参数
                                    if let Some(obj) = input.as_object() {
                                        tool_text.push_str("<div class=\"tool-call-params\">\n");
                                        for (key, value) in obj {
                                            let value_str = if value.is_string() {
                                                value.as_str().unwrap_or("").to_string()
                                            } else {
                                                serde_json::to_string(value).unwrap_or_default()
                                            };
                                            tool_text.push_str(&format!("<div><span class=\"param-key\">{}</span>: {}</div>\n", key, value_str));
                                        }
                                        tool_text.push_str("</div>\n");
                                    }

                                    tool_text.push_str("</div>\n\n");
                                    full_text.push_str(&tool_text);
                                    let _ = app.emit("stream-chunk", StreamChunk {
                                        delta: tool_text,
                                        session_id: session_id.clone(),
                                    });
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
            // 处理 stream_event 中的 text delta（流式输出）
            else if event["type"] == "stream_event" {
                eprintln!("[bridge.rs] stream_event received: {}", serde_json::to_string(&event).unwrap_or_default());
                if let Some(delta_obj) = event["event"]["delta"].as_object() {
                    if delta_obj.get("type").and_then(|v| v.as_str()) == Some("text_delta") {
                        if let Some(text) = delta_obj.get("text").and_then(|v| v.as_str()) {
                            full_text.push_str(text);
                            eprintln!("[bridge.rs] Emitting stream-chunk: delta='{}', session_id='{}'", text, session_id);
                            let _ = app.emit("stream-chunk", StreamChunk {
                                delta: text.to_string(),
                                session_id: session_id.clone(),
                            });
                        }
                    }
                }
            }
            // 处理 result 事件
            else if event["type"] == "result" {
                eprintln!("[bridge.rs] result event received: {}", serde_json::to_string(&event).unwrap_or_default());
                if event["subtype"] == "success" {
                    // 如果 full_text 为空，尝试从 result 字段获取
                    if full_text.is_empty() {
                        // result 可能是字符串或对象，需要正确解析
                        if let Some(result_str) = event["result"].as_str() {
                            full_text = result_str.to_string();
                        } else if let Some(result_obj) = event["result"].as_object() {
                            // 如果是对象，尝试获取 text 字段
                            if let Some(text) = result_obj.get("text").and_then(|v| v.as_str()) {
                                full_text = text.to_string();
                            }
                        }
                    }
                    eprintln!("[bridge.rs] Emitting stream-done: full_text='{}', cli_session_id='{}'", full_text, new_cli_session_id);

                    // 记录到文件
                    if let Some(ref mut f) = log_file {
                        let _ = writeln!(f, "\n========== stream-done ==========");
                        let _ = writeln!(f, "full_text length: {}", full_text.len());
                        let _ = writeln!(f, "full_text: {}", full_text);
                        let _ = writeln!(f, "cli_session_id: {}", new_cli_session_id);
                    }

                    let _ = app.emit("stream-done", StreamDone {
                        full_text: full_text.clone(),
                        session_id: session_id.clone(),
                        cli_session_id: new_cli_session_id.clone(),
                    });
                    break;
                } else if event["is_error"] == true {
                    // 打印完整的错误事件用于调试
                    eprintln!("Error event received: {}", serde_json::to_string_pretty(&event).unwrap_or_default());

                    // 尝试从多个可能的字段提取错误信息
                    let error_msg = if let Some(errors) = event["errors"].as_array() {
                        errors.iter()
                            .filter_map(|e| e.as_str())
                            .collect::<Vec<_>>()
                            .join("; ")
                    } else {
                        event["result"].as_str()
                            .or_else(|| event["error"].as_str())
                            .or_else(|| event["message"].as_str())
                            .unwrap_or("Unknown error")
                            .to_string()
                    };

                    let final_error = if error_msg.is_empty() {
                        "Unknown error".to_string()
                    } else {
                        error_msg
                    };

                    let _ = app.emit("stream-error", StreamError {
                        error: final_error.clone(),
                        session_id: session_id.clone(),
                    });
                    return Err(final_error);
                }
            }
        }
    }

    child.wait().await.map_err(|e| format!("Wait error: {e}"))?;
    Ok(new_cli_session_id)
}
