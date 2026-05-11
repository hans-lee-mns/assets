"""
Writes rendered HTML signatures to the output directory.
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def write_signature(output_dir: Path, filename: str, html: str) -> Path:
    """
    Write a single rendered signature to disk.

    Args:
        output_dir: Directory to write the file into (created if missing).
        filename: The output filename (e.g. 'akash_gangoo.html').
        html: The rendered HTML content.

    Returns:
        The full path of the written file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    filepath = output_dir / filename
    filepath.write_text(html, encoding="utf-8")
    logger.info("Written: %s", filepath.name)
    return filepath

