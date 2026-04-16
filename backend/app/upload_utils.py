import os
import uuid
import mimetypes
from typing import Optional
from fastapi import HTTPException, UploadFile, status


# Allowed file extensions for uploads
ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'},
    'video': {'mp4', 'webm', 'mov'},
    'document': {'pdf', 'doc', 'docx', 'xls', 'xlsx'},
    'archive': {'zip', 'rar', '7z'},
    'audio': {'mp3', 'wav', 'ogg'},
}

# Maximum file sizes (in bytes)
MAX_FILE_SIZES = {
    'image': 10 * 1024 * 1024,      # 10 MB
    'video': 100 * 1024 * 1024,    # 100 MB
    'document': 50 * 1024 * 1024,  # 50 MB
    'archive': 100 * 1024 * 1024,  # 100 MB
    'audio': 20 * 1024 * 1024,     # 20 MB
}

# Default max size
DEFAULT_MAX_SIZE = 10 * 1024 * 1024  # 10 MB


def get_file_category(filename: str) -> Optional[str]:
    """Get file category based on extension."""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return category
    return None


def validate_file(filename: str, content_type: str, file_size: int) -> None:
    """
    Validate file before upload.
    
    Raises HTTPException if validation fails.
    """
    # Check extension
    category = get_file_category(filename)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS.keys())}"
        )
    
    # Check file size
    max_size = MAX_FILE_SIZES.get(category, DEFAULT_MAX_SIZE)
    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size for {category}: {max_mb} MB"
        )
    
    # Validate MIME type (basic check - should be done with python-magic for production)
    if content_type:
        # Block dangerous content types
        dangerous_types = [
            'application/x-executable',
            'application/x-msdownload',
            'application/x-sh',
            'application/pdf',
        ]
        if content_type in dangerous_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed"
            )


def generate_secure_filename(original_filename: str) -> str:
    """
    Generate secure filename to prevent path traversal attacks.
    """
    # Get extension
    ext = ''
    if '.' in original_filename:
        ext = original_filename.rsplit('.', 1)[-1].lower()
    
    # Generate UUID-based filename
    safe_name = f"{uuid.uuid4().hex}"
    
    if ext:
        safe_name = f"{safe_name}.{ext}"
    
    return safe_name


def get_mime_type(file_path: str) -> str:
    """Get MIME type from file extension."""
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or 'application/octet-stream'