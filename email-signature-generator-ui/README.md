# Email Signature Generator — Web UI

A client-side web app built with Astro.js that generates personalised HTML email signatures from a CSV file and an HTML template.

## Features

- 📄 **Upload CSV** — drag & drop or click to browse
- 🎨 **Template preview** — see the signature layout before generating
- ⚡ **Client-side processing** — no backend required, all data stays in your browser
- 📊 **Progress bar** — visual feedback during generation
- 📦 **ZIP download** — all signatures packaged into one download
- ✅ **Validation** — warns about missing columns or empty fields

## Project Structure

```
email-signature-generator-ui/
├── public/
│   └── templates/
│       └── signature-template.html    # Default HTML signature template
├── src/
│   ├── components/                    # (future: extracted Astro components)
│   ├── lib/
│   │   ├── csv-parser.ts             # CSV string → array of objects
│   │   ├── template-renderer.ts      # Replace {{Placeholders}} with data
│   │   ├── zip-generator.ts          # JSZip wrapper + download helper
│   │   ├── filename.ts               # Safe filename generation
│   │   └── validation.ts             # Column & row validation
│   ├── pages/
│   │   └── index.astro               # Main page (single-page app)
│   └── styles/
│       └── global.css                 # App-wide styles
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## How It Works

1. User uploads a CSV file with a header row
2. App detects columns and maps them to `{{Placeholder}}` tokens in the template
3. For each row, the template is rendered with that user's data
4. All generated HTML files are packaged into a ZIP
5. User downloads the ZIP — done!

## CSV Format

The CSV must have a header row. Column names become placeholder names.

| FirstName | LastName | Mail | Title | MobilePhone |
|-----------|----------|------|-------|-------------|
| Akash | Gangoo | akash.gangoo@mns.mu | Systems Administrator | +230 57871996 |

## Template Placeholders

Use `{{ColumnName}}` anywhere in the HTML template:

- `{{FirstName}}` — User's first name
- `{{LastName}}` — User's last name
- `{{Mail}}` — Email address
- `{{Title}}` — Job title
- `{{MobilePhone}}` — Mobile number (auto-removed with "m." prefix if empty)

## Adding a New Template

1. Create an HTML file in `public/templates/`
2. Add `{{Placeholder}}` tokens matching your CSV columns
3. Add an `<option>` to the template selector in `index.astro`

## Technical Details

| Concern | Solution |
|---------|----------|
| CSV parsing | Custom parser (handles quoted fields, no dependencies) |
| ZIP generation | [JSZip](https://stuk.github.io/jszip/) via CDN |
| Missing values | Replaced with empty string; `m.` prefix auto-removed |
| Filename safety | Non-alphanumeric chars → underscores, lowercase |
| Large files | Progress bar + `setTimeout` yielding every 10 rows |
| Security | All processing client-side; no data sent to any server |

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

