"""
Email Signature Generator — Main Entry Point
=============================================
Scans the input/ folder for CSV files, renders personalised HTML signatures
from a template, and writes one file per user into a subfolder per CSV.

Usage:
    python -m src.main
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
INPUT_DIR = PROJECT_ROOT / "input"
TEMPLATE_FILE = PROJECT_ROOT / "templates" / "signature_template.html"
OUTPUT_DIR = PROJECT_ROOT / "output"
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


def process_csv(csv_path: Path, template: str, config: dict, logger: logging.Logger) -> tuple:
    """
    Process a single CSV file: read users, render signatures, write output.

    Output subfolder is named after the CSV file (without extension).
    e.g. input/users.csv -> output/users/
         input/Active_AD_Staff_List - Copy.csv -> output/Active_AD_Staff_List - Copy/

    Returns:
        (success_count, skipped_count)
    """
    filename_fields = config.get("filename_fields", ["FirstName", "LastName"])
    required_fields = config.get("required_fields", [])

    # Output subfolder matches the CSV filename (without extension)
    subfolder_name = csv_path.stem
    output_subfolder = OUTPUT_DIR / subfolder_name

    try:
        users = read_users(csv_path)
    except (FileNotFoundError, ValueError) as e:
        logger.error(str(e))
        return 0, 0

    success = 0
    skipped = 0

    for i, user in enumerate(users, start=1):
        # Validate required fields
        missing = [f for f in required_fields if not user.get(f)]
        if missing:
            logger.warning(
                "  Row %d: skipping — missing required field(s): %s",
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
        write_signature(output_subfolder, filename, html)
        success += 1

    return success, skipped


def main() -> None:
    setup_logging()
    logger = logging.getLogger(__name__)

    logger.info("=" * 50)
    logger.info("Email Signature Generator")
    logger.info("=" * 50)

    # ── Load config ───────────────────────────────────────────────────────
    config = load_config()

    # ── Load template ─────────────────────────────────────────────────────
    try:
        template = load_template(TEMPLATE_FILE)
    except FileNotFoundError as e:
        logger.error(str(e))
        sys.exit(1)

    # ── Discover CSV files in input/ ──────────────────────────────────────
    if not INPUT_DIR.exists():
        logger.error("Input directory not found: %s", INPUT_DIR)
        sys.exit(1)

    csv_files = sorted(INPUT_DIR.glob("*.csv"))
    if not csv_files:
        logger.error("No CSV files found in: %s", INPUT_DIR)
        sys.exit(1)

    logger.info("Found %d CSV file(s) in input/", len(csv_files))

    # ── Process each CSV ──────────────────────────────────────────────────
    total_success = 0
    total_skipped = 0

    for csv_path in csv_files:
        logger.info("-" * 50)
        logger.info("Processing: %s", csv_path.name)
        logger.info("  Output → output/%s/", csv_path.stem)

        success, skipped = process_csv(csv_path, template, config, logger)
        total_success += success
        total_skipped += skipped

        logger.info("  %d generated, %d skipped", success, skipped)

    # ── Summary ───────────────────────────────────────────────────────────
    logger.info("=" * 50)
    logger.info(
        "Total: %d signature(s) generated, %d skipped across %d file(s).",
        total_success, total_skipped, len(csv_files),
    )
    logger.info("Output root: %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()

