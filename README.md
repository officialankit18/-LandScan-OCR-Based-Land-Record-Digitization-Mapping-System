# 🗺️ LandScan — OCR-Based Land Record Digitization & Mapping System

A production-grade web application that digitizes scanned land record PDFs using Tesseract OCR, extracts structured data (owner names, plot numbers, GPS coordinates), stores it in SQLite, and visualizes plots on an interactive Leaflet map.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-green?logo=flask)
![Tesseract](https://img.shields.io/badge/OCR-Tesseract-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **PDF Upload** | Drag-and-drop or browse to upload scanned land records |
| 🔍 **OCR Extraction** | Tesseract-powered text recognition with regex parsing |
| 🗺️ **Map Visualization** | Interactive Leaflet map with markers and popups |
| 📊 **Analytics Dashboard** | Chart.js-powered processing time trends and statistics |
| 📋 **Record History** | Searchable, sortable, paginated table with filters |
| 📥 **CSV Export** | Download extracted data as CSV from results page |
| 🗑️ **Record Management** | Delete records directly from the history page |
| ⚡ **Performance Metrics** | Track OCR time, conversion time, and total processing |

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Python, Flask |
| **OCR** | Tesseract OCR + pdf2image (Poppler) |
| **Database** | SQLite |
| **Maps** | Leaflet.js + OpenStreetMap |
| **Charts** | Chart.js 4 |
| **Icons** | Font Awesome 6 |
| **Font** | Inter (Google Fonts) |

## 📁 Project Structure

```
├── backend/
│   ├── app.py              # Flask application + API routes
│   ├── config.py           # Configuration (paths, settings)
│   ├── database.py         # SQLite schema + CRUD operations
│   ├── ocr_engine.py       # PDF → Image → OCR pipeline
│   ├── text_parser.py      # Regex-based data extraction
│   └── generate_sample_pdf.py  # Test PDF generator
├── frontend/
│   ├── index.html          # Dashboard page
│   ├── upload.html         # Upload page
│   ├── results.html        # Results page
│   ├── history.html        # History page
│   ├── analytics.html      # Analytics page
│   ├── settings.html       # Settings page
│   ├── css/style.css       # Complete design system
│   └── js/
│       ├── sidebar.js      # Sidebar + toast notifications
│       ├── dashboard.js    # Dashboard stats + charts
│       ├── upload.js       # File upload + processing
│       ├── results.js      # Results display + CSV export
│       ├── history.js      # Table + pagination + sorting
│       └── analytics.js    # Chart.js visualizations
├── uploads/                # Uploaded PDF storage
├── requirements.txt        # Python dependencies
├── build.sh               # Render.com build script
├── .gitignore
└── README.md
```

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.10+
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)
- [Poppler](https://github.com/oschwartz10612/poppler-windows/releases/) (Windows) or `apt install poppler-utils` (Linux)

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/landscan-ocr.git
cd landscan-ocr

# Install Python dependencies
pip install -r requirements.txt

# Generate sample test PDFs
python backend/generate_sample_pdf.py

# Start the server
python backend/app.py
```

Open http://localhost:5000 in your browser.

## 🌐 Deploy (Free)

Deploy to **Render.com** for free:

1. Push code to GitHub
2. Create a Web Service on [Render.com](https://render.com)
3. Set Build Command: `chmod +x build.sh && ./build.sh`
4. Set Start Command: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT`
5. Choose **Free** instance type → Deploy!

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Dashboard page |
| `GET` | `/upload` | Upload page |
| `GET` | `/results` | Results page |
| `GET` | `/history` | History page |
| `GET` | `/analytics` | Analytics page |
| `GET` | `/settings` | Settings page |
| `POST` | `/api/upload` | Upload PDF files for OCR |
| `GET` | `/api/records` | Get all records |
| `GET` | `/api/records/:id` | Get single record |
| `DELETE` | `/api/records/:id` | Delete a record |

## 📄 License

MIT License — free for personal and commercial use.
