# Email Signature Generator — User Guide

![Banner](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/banner.gif)

A simple guide for end users. No coding required.

Generate email signatures in two ways:
- **Single Mode** — one signature
- **CSV Mode** — many signatures at once

---

## Who is this for?

- Team members who need one signature quickly
- Admin/operations users generating signatures for multiple people

---

## Single Mode (one user)

### Step 1: Open the app and choose **Single Mode**
![Single Step 1](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/single-step-1.gif)

### Step 2: Fill in the details (name, title, email, mobile, etc.)
![Single Step 2](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/single-step-2.png)

### Step 3: Click generate — your signature ZIP downloads
![Single Step 3](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/single-step-3.gif)

> Output is a ZIP named after the email (e.g. `akash.gangoo_mns_mu.zip`) containing the HTML signature.

---

## CSV Mode (bulk users)

### Step 1: Prepare a CSV in the correct format
![CSV Step 1](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/csv-step-1.png)

### Step 2: Choose **CSV Mode** and upload the file
![CSV Step 2](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/csv-step-2.gif)

### Step 3: Click generate — download `email-signatures.zip`
![CSV Step 3](https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/csv-step-3.png)

---

## CSV format

- First row must be headers
- Each row after that is one person
- Header names must match the placeholders in the template

### Example

```csv
FirstName,LastName,Mail,Title,MobilePhone
Akash,Gangoo,akash.gangoo@mns.mu,Systems Administrator,+230 57871996
Jane,Doe,jane.doe@mns.mu,Marketing Manager,+230 50000000
```

> Tip: Save the file as **UTF-8 CSV**.

---

## Supported placeholders

| Placeholder | Meaning |
|-------------|---------|
| `{{FirstName}}` | First name |
| `{{LastName}}` | Last name |
| `{{Mail}}` | Email address |
| `{{Title}}` | Job title |
| `{{MobilePhone}}` | Mobile number (auto-removed if empty) |

---

## Image hosting (maintainers)

- Source repo: `https://github.com/mnsltd/mns-public/tree/develop/email`
- CDN base: `https://cdn.jsdelivr.net/gh/mnsltd/mns-public@master/email/`

If you replace an image, purge the CDN cache:
- `https://www.jsdelivr.com/tools/purge`

Then hard-refresh the browser (Ctrl + F5).

---

## Troubleshooting

- **CSV not accepted** — check headers and required columns
- **Blank fields in output** — check the matching values in the CSV
- **Image not updating** — purge jsDelivr cache and hard refresh
- **Nothing downloads** — allow pop-ups/downloads for the site

