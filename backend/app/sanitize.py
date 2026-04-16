import re
from typing import List, Optional
from html import escape as escape_html
from bleach import clean as bleach_clean, ALLOWED_TAGS, ALLOWED_ATTRIBUTES


# Custom allowed tags for LMS
ALLOWED_LMS_TAGS = [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'del', 's',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code',
    'hr', 'span', 'div',
    'figure', 'figcaption',
]

# Allowed attributes with specific allowed values
ALLOWED_LMS_ATTRIBUTES = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan', 'scope'],
    'span': ['class', 'style'],
    'div': ['class', 'style'],
    'a': ['href', 'title', 'target'],
    '*': ['class'],
}


def sanitize_html(dirty_html: str, strip_tags: bool = False) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    
    Args:
        dirty_html: Raw HTML that may contain malicious content
        strip_tags: If True, strip all tags instead of cleaning
    
    Returns:
        Sanitized HTML safe for rendering
    """
    if not dirty_html:
        return ""
    
    # If strip_tags is True, remove all HTML
    if strip_tags:
        # First decode any entities
        dirty_html = dirty_html.replace('&lt;', '<').replace('&gt;', '>')
        dirty_html = dirty_html.replace('&amp;', '&')
        # Strip all tags
        clean = re.sub(r'<[^>]+>', '', dirty_html)
        return clean.strip()
    
    # Clean HTML using bleach with our allowed list
    try:
        sanitized = bleach_clean(
            dirty_html,
            tags=ALLOWED_LMS_TAGS,
            attributes=ALLOWED_LMS_ATTRIBUTES,
            strip=True,
        )
        return sanitized
    except Exception as e:
        # If sanitization fails, strip all tags
        return re.sub(r'<[^>]+>', '', dirty_html)


def sanitize_html_unsafe(dirty_html: str) -> str:
    """
    Strict sanitization - removes ALL HTML tags.
    Use for user-generated content that should be plain text.
    """
    if not dirty_html:
        return ""
    
    dirty_html = dirty_html.replace('&lt;', '<').replace('&gt;', '>')
    dirty_html = dirty_html.replace('&amp;', '&').replace('&quot;', '"')
    return re.sub(r'<[^>]+>', '', dirty_html).strip()


def strip_html_tags(html: str) -> str:
    """Strip all HTML tags, return plain text."""
    return sanitize_html_unsafe(html)


def escape_html_content(content: str) -> str:
    """Escape HTML for safe storage/display."""
    return escape_html(content)


# CSP header recommended policies
CSP_POLICY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "img-src 'self' data: https: blob:; "
    "font-src 'self' https://fonts.gstatic.com; "
    "connect-src 'self' https:; "
    "frame-ancestors 'self'; "
    "base-uri 'self'; "
    "form-action 'self';"
)


# X-Content-Type-Options header
XCTO_HEADER = "nosniff"

# Frame-Options header  
FRAME_OPTIONS = "DENY"