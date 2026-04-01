use std::fs;
use std::path::Path;
use base64::Engine;
use base64::engine::general_purpose;

pub fn read_image_as_base64(path: &str) -> Result<(String, String), String> {
    let path_obj = Path::new(path);

    if !path_obj.exists() {
        return Err(format!("File not found: {}", path));
    }

    let bytes = fs::read(path_obj).map_err(|e| format!("Failed to read file: {}", e))?;
    let base64_data = general_purpose::STANDARD.encode(&bytes);

    let media_type = match path_obj.extension().and_then(|s| s.to_str()) {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        _ => return Err("Unsupported image format".to_string()),
    };

    Ok((base64_data, media_type.to_string()))
}
