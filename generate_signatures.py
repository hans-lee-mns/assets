"""
Email Signature Generator
=========================
Reads a CSV staff list and an HTML template with {{Placeholder}} tokens,
then generates one personalised HTML signature file per user.

Usage:
    python generate_signatures.py

Configuration:
    Edit the three constants below if your file names or paths differ.
"""

import csv
import os
import re

# ── Configuration ──────────────────────────────────────────────────────────
TEMPLATE_FILE = "template.html"
CSV_FILE = "Active_AD_Staff_List - Copy.csv"
OUTPUT_DIR = "output"
# ───────────────────────────────────────────────────────────────────────────


def safe_filename(first: str, last: str) -> str:
    """Build a filesystem-safe filename from first + last name."""
    name = f"{first}_{last}".lower()
    name = re.sub(r"[^\w]", "_", name)
    return name + ".html"


def generate_signatures():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, TEMPLATE_FILE)
    csv_path = os.path.join(script_dir, CSV_FILE)
    output_path = os.path.join(script_dir, OUTPUT_DIR)

    # Read the template once
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    # Ensure output folder exists
    os.makedirs(output_path, exist_ok=True)

    # Process each staff row
    count = 0
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            result = template

            # Replace every {{ColumnName}} with the corresponding value
            for key, value in row.items():
                placeholder = "{{" + key.strip() + "}}"
                result = result.replace(placeholder, (value or "").strip())

            # Remove any leftover unreplaced placeholders
            result = re.sub(r"\{\{.*?\}\}", "", result)

            # Write the personalised signature
            fname = safe_filename(row.get("FirstName", "unknown"),
                                  row.get("LastName", "unknown"))
            filepath = os.path.join(output_path, fname)
            with open(filepath, "w", encoding="utf-8") as out:
                out.write(result)

            count += 1
            print(f"  ✔ {fname}")

    print(f"\nDone — {count} signature(s) generated in '{OUTPUT_DIR}/' folder.")


if __name__ == "__main__":
    generate_signatures()

