"""
Utility helpers for the Email Signature Generator.
"""

import re


def safe_filename(*parts: str) -> str:
    """
    Build a filesystem-safe .html filename from name parts.

    Example:
        safe_filename("Akash", "Gangoo") -> "akash_gangoo.html"
    """
    combined = "_".join(p.strip() for p in parts if p)
    combined = combined.lower()
    combined = re.sub(r"[^\w]", "_", combined)
    combined = re.sub(r"_+", "_", combined).strip("_")
    return f"{combined}.html" if combined else "unknown.html"


def strip_unreplaced_placeholders(html: str) -> str:
    """Remove any leftover {{...}} placeholders from the rendered HTML."""
    return re.sub(r"\{\{.*?\}\}", "", html)

