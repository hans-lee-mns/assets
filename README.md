# Email Signature Generator

Automated tool that generates personalised HTML email signatures for staff from a CSV file and an HTML template.

## How It Works

1. Reads staff data from a CSV file
2. Loads a reusable HTML template containing `{{Placeholder}}` tokens
3. Replaces each placeholder with the corresponding CSV column value
4. Outputs one HTML signature file per staff member

## Folder Structure

```
assets/
├── Active_AD_Staff_List - Copy.csv   # Staff data (editable in Excel)
├── template.html                     # HTML signature template with placeholders
├── generate_signatures.py            # The generator script
├── output/                           # Generated signatures (git-ignored)
│   ├── akash_gangoo.html
│   └── ...
└── index 6 1.html                    # Original reference signature
```

## Prerequisites

- **Python 3.6+** (no external packages required)

## Usage

```bash
python generate_signatures.py
```

Generated signatures will appear in the `output/` folder.

## CSV Format

The CSV must have a header row. Column names map directly to template placeholders.

| Column | Example | Template Placeholder |
|---|---|---|
| FirstName | Akash | `{{FirstName}}` |
| LastName | Gangoo | `{{LastName}}` |
| Mail | akash.gangoo@mns.mu | `{{Mail}}` |
| Title | Systems Administrator | `{{Title}}` |
| MobilePhone | +230 57871996 | `{{MobilePhone}}` |

### Adding New Fields

1. Add a new column to the CSV (e.g. `Department`)
2. Add the matching placeholder in `template.html` (e.g. `{{Department}}`)
3. Re-run the script — no code changes needed

## Template

Edit `template.html` to change the signature design. Use `{{ColumnName}}` placeholders anywhere in the HTML. They will be replaced with the corresponding value from each CSV row.

- Missing or empty values are replaced with an empty string
- Any unreplaced placeholders are automatically removed

## Output

- Files are saved to the `output/` folder
- Filenames are generated from `FirstName_LastName` in lowercase (e.g. `akash_gangoo.html`)
- Special characters in names are replaced with underscores

## Notes

- Save the CSV as **UTF-8** if staff names contain accented characters
- Web fonts (e.g. Montserrat) will not render in most email clients — they fall back to the system sans-serif font
- The `output/` folder is git-ignored since files are reproducible by running the script

