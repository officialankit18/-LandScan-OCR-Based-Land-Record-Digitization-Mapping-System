import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

UPLOAD_FOLDER = os.path.join(PROJECT_DIR, "uploads")
DATABASE_PATH = os.path.join(BASE_DIR, "land_records.db")
ALLOWED_EXTENSIONS = {"pdf"}

# Tesseract path — auto-detect based on OS
import platform
if platform.system() == "Windows":
    TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
else:
    TESSERACT_CMD = "tesseract"  # Linux/Mac — available via PATH

# Frontend paths
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")
STATIC_CSS = os.path.join(FRONTEND_DIR, "css")
STATIC_JS = os.path.join(FRONTEND_DIR, "js")

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
