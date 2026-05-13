# Email Signature Generator — Web UI

A client-side web app built with Astro.js that generates personalised HTML email signatures from a CSV file and an HTML template.

## Features

- 🔀 **Two modes** — CSV bulk upload (default) or single-user form
- 📄 **Upload CSV** — drag & drop or click to browse
- 📝 **Single-user form** — manual entry with live inline validation
- 🎨 **Live template preview** — updates as you type in single-user mode
- ⚡ **Client-side processing** — no backend required, all data stays in your browser
- 📊 **Progress bar** — visual feedback during CSV generation
- 📦 **ZIP download** — bulk ZIP for CSV mode, email-named ZIP for single mode
- ✅ **Validation** — required-field + email-format checks, inline errors

## Project Structure

```
email-signature-generator-ui/
├── public/
│   └── templates/
│       └── signature-template.html    # Default HTML signature template
├── src/
│   ├── lib/
│   │   ├── app.ts                    # Bootstrap + mode switching
│   │   ├── dom.ts                    # Shared DOM helpers ($, messages, steps)
│   │   ├── csv-parser.ts             # CSV string → array of objects
│   │   ├── template-renderer.ts      # Replace {{Placeholders}} with data
│   │   ├── template-loader.ts        # Fetch (cache-busted) + render preview
│   │   ├── zip-generator.ts          # JSZip wrapper + download helper
│   │   ├── filename.ts               # Safe filenames (names + email-based)
│   │   ├── validation.ts             # Column / row / form validators
│   │   └── modes/
│   │       ├── csv-mode.ts           # CSV upload + bulk generation
│   │       └── single-mode.ts        # Single-user form mode
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

The app has **two modes** controlled by a switch at the top — CSV Upload (default) and Single User.

**CSV Upload mode**
1. Upload a CSV with a header row
2. Columns are auto-mapped to `{{Placeholder}}` tokens
3. Each row is rendered against the template
4. All HTML files packaged into `email-signatures.zip`

**Single User mode**
1. Fill in the form (FirstName, LastName, Email, Title, MobilePhone)
2. Live validation — required fields + email format
3. Preview updates live as you type
4. Click generate → ZIP named after the email (e.g. `akash.gangoo_mns_mu.zip`) containing the matching HTML file

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

## Deploy to Netlify

This app is deployed as a static Astro site.

- `Base directory`: `email-signature-generator-ui`
- `Build command`: `npm run build`
- `Publish directory`: `dist`
- `Functions directory`: leave empty/default

A root-level `netlify.toml` is included at `../netlify.toml` (workspace path: `D:\Projects\assets\netlify.toml`) so Netlify can pick these settings automatically.
