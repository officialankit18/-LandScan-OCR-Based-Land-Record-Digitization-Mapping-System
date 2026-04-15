import time
import os
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
from config import TESSERACT_CMD

def get_tesseract_path():
    """Attempt to find tesseract.exe in common installation paths."""
    import glob
    # Default Windows common location
    if os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe"):
        return r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"):
        return r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
        
    # Check WinGet paths
    winget_path = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages')
    matches = glob.glob(os.path.join(winget_path, '*Tesseract*', '**', 'tesseract.exe'), recursive=True)
    if matches:
        return matches[0]
        
    # User AppData fallback (including Local\Programs)
    appdata = os.environ.get('LOCALAPPDATA', '')
    local_programs_path = os.path.join(appdata, 'Programs', 'Tesseract-OCR', 'tesseract.exe')
    if os.path.exists(local_programs_path):
        return local_programs_path
        
    matches = glob.glob(os.path.join(appdata, 'Tesseract-OCR', 'tesseract.exe'))
    if matches:
        return matches[0]
        
    return TESSERACT_CMD

# (Removed global execution to avoid caching missing paths)


def get_poppler_path():
    """Attempt to find poppler in common winget installation paths."""
    import glob
    # Check WinGet paths
    winget_path = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages')
    matches = glob.glob(os.path.join(winget_path, 'oschwartz10612.Poppler*', '**', 'pdftoppm.exe'), recursive=True)
    if matches:
        return os.path.dirname(matches[0])
        
    # Check Program Files
    prog_files = os.environ.get('PROGRAMFILES', 'C:\\Program Files')
    matches = glob.glob(os.path.join(prog_files, 'poppler*', '**', 'pdftoppm.exe'), recursive=True)
    if matches:
        return os.path.dirname(matches[0])
    
    return None

def pdf_to_images(pdf_path):
    """Convert each page of a PDF to a PIL Image."""
    try:
        poppler_path = get_poppler_path()
        if poppler_path:
            images = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)
        else:
            images = convert_from_path(pdf_path, dpi=300)
        return images
    except Exception as e:
        raise RuntimeError(f"Failed to convert PDF to images: {e}")


def extract_text_from_images(images):
    """Run Tesseract OCR on each image and return concatenated text."""
    # Ensure Tesseract path is dynamically checked exactly when needed
    tesseract_found = get_tesseract_path()
    if tesseract_found and os.path.exists(tesseract_found):
        pytesseract.pytesseract.tesseract_cmd = tesseract_found
        
    all_text = []
    for i, img in enumerate(images):
        page_text = pytesseract.image_to_string(img, lang="eng")
        all_text.append(page_text)
    return "\n".join(all_text)


def process_pdf(pdf_path):
    """Full pipeline: PDF → images → OCR text. Returns text and timing metrics."""

    # Step 1: PDF to images
    t0 = time.perf_counter()
    images = pdf_to_images(pdf_path)
    conversion_time = time.perf_counter() - t0

    # Step 2: OCR
    t1 = time.perf_counter()
    raw_text = extract_text_from_images(images)
    ocr_time = time.perf_counter() - t1

    total_time = conversion_time + ocr_time

    return {
        "raw_text": raw_text,
        "ocr_time": round(ocr_time, 3),
        "conversion_time": round(conversion_time, 3),
        "total_processing_time": round(total_time, 3),
        "pages_processed": len(images),
    }
