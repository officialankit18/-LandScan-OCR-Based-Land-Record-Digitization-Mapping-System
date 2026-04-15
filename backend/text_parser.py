import re


def extract_owner_name(text):
    """Extract owner name from OCR text using multiple regex patterns."""
    patterns = [
        r"(?:Owner\s*(?:Name)?|Name\s*of\s*Owner|Land\s*Owner|Registered\s*Owner|Proprietor)\s*[:\-—]?\s*(.+)",
        r"(?:Name)\s*[:\-—]\s*(.+)",
        r"(?:Holder|Title\s*Holder)\s*[:\-—]?\s*(.+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Clean up common OCR artifacts
            name = re.sub(r"[|\\/_]", "", name).strip()
            # Take only first line if multi-line match
            name = name.split("\n")[0].strip()
            if len(name) > 2:
                return name
    return "Unknown"


def extract_plot_number(text):
    """Extract plot/survey number from OCR text."""
    patterns = [
        r"(?:Plot\s*(?:No|Number|#)|Survey\s*(?:No|Number)|Khasra\s*(?:No|Number)?|Parcel\s*(?:No|Number))\s*[:\-—.#]?\s*([A-Za-z0-9\-/]+)",
        r"(?:Plot)\s*[:\-—]?\s*([A-Za-z0-9\-/]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            plot = match.group(1).strip()
            if len(plot) >= 1:
                return plot
    return "N/A"


def extract_coordinates(text):
    """Extract latitude and longitude from OCR text."""
    lat, lng = None, None

    # Pattern: Latitude: 26.8467
    lat_patterns = [
        r"(?:Latitude|Lat)\s*[:\-—]?\s*(-?\d{1,3}\.\d+)",
        r"(?:Lat)\s*[:\-—]?\s*(-?\d{1,3}\.\d+)",
    ]
    lng_patterns = [
        r"(?:Longitude|Long|Lng|Lon)\s*[:\-—]?\s*(-?\d{1,3}\.\d+)",
        r"(?:Lng|Lon)\s*[:\-—]?\s*(-?\d{1,3}\.\d+)",
    ]

    for pattern in lat_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            lat = float(match.group(1))
            break

    for pattern in lng_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            lng = float(match.group(1))
            break

    # Fallback: try coordinate pair format "26.8467, 80.9462"
    if lat is None or lng is None:
        pair_match = re.search(r"(?:Coordinates?|Location|GPS)\s*[:\-—]?\s*(-?\d{1,3}\.\d+)\s*[,;]\s*(-?\d{1,3}\.\d+)", text, re.IGNORECASE)
        if pair_match:
            lat = float(pair_match.group(1))
            lng = float(pair_match.group(2))

    return lat, lng


def parse_land_record(raw_text):
    """Parse all fields from OCR text and return structured data."""
    owner_name = extract_owner_name(raw_text)
    plot_number = extract_plot_number(raw_text)
    latitude, longitude = extract_coordinates(raw_text)

    return {
        "owner_name": owner_name,
        "plot_number": plot_number,
        "latitude": latitude,
        "longitude": longitude,
    }
