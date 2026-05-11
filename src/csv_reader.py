"""
Reads user data from a CSV file and returns a list of dictionaries.
"""

import csv
import logging
from pathlib import Path
from typing import List, Dict

logger = logging.getLogger(__name__)


def read_users(csv_path: Path) -> List[Dict[str, str]]:
    """
    Read users from a CSV file.

    Args:
        csv_path: Path to the CSV file.

    Returns:
        List of dictionaries, one per user row.

    Raises:
        FileNotFoundError: If the CSV file does not exist.
        ValueError: If the CSV file is empty or has no data rows.
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"User data file not found: {csv_path}")

    users = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        if reader.fieldnames is None:
            raise ValueError(f"CSV file has no header row: {csv_path}")

        logger.info("CSV columns detected: %s", reader.fieldnames)

        for i, row in enumerate(reader, start=2):  # row 2 = first data row
            # Strip whitespace from keys and values
            cleaned = {k.strip(): (v or "").strip() for k, v in row.items() if k}
            if any(cleaned.values()):  # skip entirely blank rows
                users.append(cleaned)
            else:
                logger.warning("Skipping blank row %d", i)

    if not users:
        raise ValueError(f"No user data found in: {csv_path}")

    logger.info("Loaded %d user(s) from %s", len(users), csv_path.name)
    return users

