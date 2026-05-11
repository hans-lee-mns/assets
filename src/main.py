"""
Email Signature Generator — Main Entry Point
=============================================
Reads users from a CSV file, renders personalised HTML signatures
from a template, and writes one file per user.

Usage:
    python -m src.main
    python src/main.py
"""

import json
import logging
import sys
from pathlib import Path

from .csv_reader import read_users
from .template_renderer import load_template, render
from .file_writer import write_signature
from .utils import safe_filename

# ── Paths (relative to project root) ──────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "input" / "users.csv"
TEMPLATE_FILE = PROJECT_ROOT / "templates" / "signature_template.html"
OUTPUT_DIR = PROJECT_ROOT / "output" / "generated_signatures"
CONFIG_FILE = PROJECT_ROOT / "config" / "placeholder_mapping.json"
# ──────────────────────────────────────────────────────────────────────────


def setup_logging() -> None:
    """Configure console logging with a clean format."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(message)s",
        datefmt="%H:%M:%S",
    )


def load_config() -> dict:
    """Load the placeholder mapping config (optional)."""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def main() -> None:
    setup_logging()
    logger = logging.getLogger(__name__)

    logger.info("=" * 50)
    logger.info("Email Signature Generator")
    logger.info("=" * 50)

    # ── Load config ───────────────────────────────────────────────────────
    config = load_config()
    filename_fields = config.get("filename_fields", ["FirstName", "LastName"])
    required_fields = config.get("required_fields", [])

    # ── Read inputs ───────────────────────────────────────────────────────
    try:
        users = read_users(INPUT_FILE)
        template = load_template(TEMPLATE_FILE)
    except (FileNotFoundError, ValueError) as e:
        logger.error(str(e))
        sys.exit(1)

    # ── Generate signatures ───────────────────────────────────────────────
    success = 0
    skipped = 0

    for i, user in enumerate(users, start=1):
        # Validate required fields
        missing = [f for f in required_fields if not user.get(f)]
        if missing:
            logger.warning(
                "Row %d: skipping — missing required field(s): %s",
                i, ", ".join(missing),
            )
            skipped += 1
            continue

        # Render
        html = render(template, user)

        # Build filename from configured fields
        name_parts = [user.get(f, "") for f in filename_fields]
        filename = safe_filename(*name_parts)

        # Write
        write_signature(OUTPUT_DIR, filename, html)
        success += 1

    # ── Summary ───────────────────────────────────────────────────────────
    logger.info("-" * 50)
    logger.info(
        "Done — %d signature(s) generated, %d skipped.", success, skipped
    )
    logger.info("Output folder: %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()

