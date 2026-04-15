import os
import sys
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, FRONTEND_DIR, STATIC_CSS, STATIC_JS
from database import init_db, insert_record, get_all_records, get_record_by_id
from ocr_engine import process_pdf
from text_parser import parse_land_record

app = Flask(__name__, static_folder=None)
CORS(app)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB max

# Ensure database tables exist (critical for Gunicorn deployments)
try:
    init_db()
except Exception as e:
    print(f"Warning: Failed to initialize DB: {e}")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── Serve Frontend Pages ──────────────────────────────────────────────

@app.route("/")
def serve_home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/upload")
def serve_upload():
    return send_from_directory(FRONTEND_DIR, "upload.html")


@app.route("/results")
def serve_results():
    return send_from_directory(FRONTEND_DIR, "results.html")


@app.route("/history")
def serve_history():
    return send_from_directory(FRONTEND_DIR, "history.html")


@app.route("/analytics")
def serve_analytics():
    return send_from_directory(FRONTEND_DIR, "analytics.html")


@app.route("/settings")
def serve_settings():
    return send_from_directory(FRONTEND_DIR, "settings.html")


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(STATIC_CSS, filename)


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(STATIC_JS, filename)


# ── API Endpoints ─────────────────────────────────────────────────────

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "files" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"error": "No files selected"}), 400

    results = []
    for file in files:
        if not file or file.filename == "":
            continue
        if not allowed_file(file.filename):
            results.append({"file": file.filename, "error": "File type not allowed. Only PDF files accepted."})
            continue

        filename = secure_filename(file.filename)
        # Add timestamp to avoid overwrites
        base, ext = os.path.splitext(filename)
        unique_name = f"{base}_{int(time.time())}{ext}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
        file.save(filepath)

        try:
            # OCR processing
            t_start = time.perf_counter()
            ocr_result = process_pdf(filepath)
            raw_text = ocr_result["raw_text"]

            # Text parsing
            t_parse = time.perf_counter()
            parsed = parse_land_record(raw_text)
            parse_time = round(time.perf_counter() - t_parse, 3)

            total_time = round(time.perf_counter() - t_start, 3)

            # Store in database
            record_id = insert_record(
                owner_name=parsed["owner_name"],
                plot_number=parsed["plot_number"],
                latitude=parsed["latitude"],
                longitude=parsed["longitude"],
                file_name=unique_name,
                raw_text=raw_text[:2000],  # Store first 2000 chars
                ocr_time=ocr_result["ocr_time"],
                processing_time=total_time,
            )

            results.append({
                "id": record_id,
                "file": filename,
                "owner_name": parsed["owner_name"],
                "plot_number": parsed["plot_number"],
                "latitude": parsed["latitude"],
                "longitude": parsed["longitude"],
                "pages_processed": ocr_result["pages_processed"],
                "metrics": {
                    "ocr_time": ocr_result["ocr_time"],
                    "conversion_time": ocr_result["conversion_time"],
                    "parse_time": parse_time,
                    "total_time": total_time,
                },
                "raw_text_preview": raw_text[:500],
            })

        except Exception as e:
            import traceback
            with open("error_log.txt", "w") as f:
                f.write(traceback.format_exc())
            results.append({"file": filename, "error": str(e)})

    return jsonify({"results": results})


@app.route("/api/records", methods=["GET"])
def get_records():
    records = get_all_records()
    return jsonify({"records": records})


@app.route("/api/records/<int:record_id>", methods=["GET"])
def get_record(record_id):
    record = get_record_by_id(record_id)
    if record is None:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"record": record})


@app.route("/api/records/<int:record_id>", methods=["DELETE"])
def remove_record(record_id):
    from database import delete_record
    record = get_record_by_id(record_id)
    if record is None:
        return jsonify({"error": "Record not found"}), 404
    delete_record(record_id)
    return jsonify({"message": "Record deleted", "id": record_id})


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("\n  +---------------------------------------------------+")
    print("  |  OCR Land Record Digitization & Mapping System   |")
    print("  |  Server running at http://localhost:5000          |")
    print("  +---------------------------------------------------+\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
