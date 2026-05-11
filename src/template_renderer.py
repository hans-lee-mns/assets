"""
Renders an HTML template by replacing {{Placeholder}} tokens with user data.
"""

import logging
from pathlib import Path
from typing import Dict

import re

from .utils import strip_unreplaced_placeholders

logger = logging.getLogger(__name__)


def load_template(template_path: Path) -> str:
    """
    Load the HTML template from disk.

    Raises:
        FileNotFoundError: If the template file does not exist.
    """
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    html = template_path.read_text(encoding="utf-8")
    logger.info("Loaded template: %s (%d chars)", template_path.name, len(html))
    return html


def render(template: str, user: Dict[str, str]) -> str:
    """
    Replace all {{ColumnName}} placeholders in the template with user values.

    - Known columns are replaced with their value (or empty string if missing).
    - Any remaining unreplaced placeholders are stripped.

    Args:
        template: The raw HTML template string.
        user: A dictionary of column_name -> value for one user.

    Returns:
        The rendered HTML string.
    """
    result = template

    for key, value in user.items():
        placeholder = "{{" + key + "}}"
        result = result.replace(placeholder, value)

    # Remove "m. " prefix if mobile phone is empty
    result = re.sub(r"\s*m\.\s*(?=<br>|<br/>|<br />)", "", result)

    # Clean up any placeholders that had no matching column
    before = result
    result = strip_unreplaced_placeholders(result)
    if result != before:
        logger.warning(
            "Some placeholders had no matching data for user %s %s",
            user.get("FirstName", "?"),
            user.get("LastName", "?"),
        )

    return result

