# Email Signature Generator

Automated tool that reads staff data from a CSV file, applies it to an HTML email signature template, and generates one personalised signature file per user.

## Project Structure

```
email-signature-generator/
├── input/                             # Drop one or more CSV files here
│   ├── users.csv
│   └── Active_AD_Staff_List.csv
├── templates/
│   └── signature_template.html        # HTML template with {{Placeholder}} tokens
├── output/                            # Auto-created subfolders per CSV (git-ignored)
│   ├── users/
│   └── Active_AD_Staff_List/
├── src/
│   ├── __init__.py
│   ├── main.py                        # Entry point
│   ├── csv_reader.py                  # Reads and validates the CSV
│   ├── template_renderer.py           # Replaces placeholders with user data
│   ├── file_writer.py                 # Writes rendered HTML to disk
│   └── utils.py                       # Shared helpers (filename sanitisation, etc.)
├── config/
│   └── placeholder_mapping.json       # Column ↔ placeholder mapping & validation rules
├── .gitignore
├── README.md
└── requirements.txt
```

## Prerequisites

- **Python 3.6+** — no external packages required (standard library only)

## Quick Start

```bash
# 1. Navigate to the project root
cd email-signature-generator

# 2. Run the generator
python -m src.main
```

The script scans `input/` for **all CSV files** and generates a matching output subfolder per file:

```
input/                                    output/
├── users.csv                  →          ├── users/
│                                         │   ├── akash_gangoo.html
│                                         │   └── ...
├── Active_AD_Staff_List - Copy.csv  →    ├── Active_AD_Staff_List - Copy/
│                                         │   ├── akash_gangoo.html
│                                         │   └── ...
```

## Input: CSV Files

Drop one or more CSV files into `input/`. Each file must have a header row whose column names match the placeholders in the template.

| FirstName | LastName | Mail | Title | MobilePhone |
|-----------|----------|------|-------|-------------|
| Akash | Gangoo | akash.gangoo@mns.mu | Systems Administrator | +230 57871996 |
| Olivier | Jacob | olivier.jacob@mns.mu | UX Lead | |

> **Tip:** Edit in Excel and save as CSV (UTF-8). You can have multiple CSV files — each gets its own output folder.

## Template: HTML Signature

Edit `templates/signature_template.html` to change the signature design. Use `{{ColumnName}}` placeholders anywhere in the HTML — they must match the CSV column headers exactly.

Current placeholders:

| Placeholder | Source Column | Example Value |
|---|---|---|
| `{{FirstName}}` | FirstName | Akash |
| `{{LastName}}` | LastName | Gangoo |
| `{{Mail}}` | Mail | akash.gangoo@mns.mu |
| `{{Title}}` | Title | Systems Administrator |
| `{{MobilePhone}}` | MobilePhone | +230 57871996 |

## Configuration

`config/placeholder_mapping.json` controls:

| Key | Purpose |
|---|---|
| `filename_fields` | Which columns to use for the output filename (default: `["FirstName", "LastName"]`) |
| `required_fields` | Columns that must be non-empty — rows missing these are skipped |
| `columns` | Documents the semantic meaning of each CSV column |
| `placeholders` | Documents the mapping from column → template token |

## Adding a New Field

1. Add a column to the CSV (e.g. `Department`)
2. Add the placeholder `{{Department}}` in the HTML template
3. Optionally update `placeholder_mapping.json`
4. Re-run — **no code changes needed**

## Missing Values

- Empty CSV cells are replaced with an empty string
- Any `{{Placeholder}}` with no matching CSV column is silently removed
- Rows missing **required fields** (defined in config) are skipped with a warning

## Output

- Each CSV in `input/` gets its own subfolder in `output/` (named after the CSV file)
- Filenames are auto-generated from `FirstName_LastName` in lowercase
- Special characters are replaced with underscores
- The output folder is git-ignored (files are reproducible)

## Logging

The script logs to the console with timestamps:

```
09:15:32  INFO      Email Signature Generator
09:15:32  INFO      Loaded 5 user(s) from users.csv
09:15:32  INFO      Written: akash_gangoo.html
09:15:32  INFO      Written: allan_woo.html
09:15:32  INFO      Done — 5 signature(s) generated, 0 skipped.
```

## Notes

- **Email client fonts:** Web fonts (Montserrat) won't render in most email clients — they fall back to the system sans-serif font
- **Outlook gradients:** CSS `linear-gradient` doesn't work in Outlook — the template already uses images as a workaround
- **Encoding:** Save the CSV as UTF-8 if staff names contain accented characters
- **Deployment:** This generates the HTML files. Deploying them to Outlook requires a separate step (GPO, registry, or manual copy to `%appdata%\Microsoft\Signatures\`)
