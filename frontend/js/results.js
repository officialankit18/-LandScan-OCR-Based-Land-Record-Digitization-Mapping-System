// ── Results Page Logic ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const resultsData = sessionStorage.getItem("ocr_results");

    if (!resultsData) {
        document.getElementById("results-subtitle").textContent = "No results to display. Upload a file first.";
        document.getElementById("results-container").innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-inbox"></i></div>
                <h3>No Results Available</h3>
                <p>Please upload a PDF file first to see extraction results.</p>
                <a href="/upload" class="btn btn-primary btn-sm" style="margin-top:12px;"><i class="fa-solid fa-cloud-arrow-up"></i> Upload PDF</a>
            </div>
        `;
        initEmptyMap();
        return;
    }

    const results = JSON.parse(resultsData);
    const validResults = results.filter(r => !r.error);
    const errorResults = results.filter(r => r.error);

    document.getElementById("results-subtitle").textContent =
        `${validResults.length} file(s) processed successfully` +
        (errorResults.length > 0 ? `, ${errorResults.length} failed` : "");

    if (validResults.length > 0) {
        document.getElementById("btn-export-csv").style.display = "inline-flex";
    }

    renderMetrics(validResults);
    initMap(validResults);
    renderResults(validResults, errorResults);

    // CSV Export
    document.getElementById("btn-export-csv").addEventListener("click", () => {
        exportCSV(validResults);
    });
});

function renderMetrics(results) {
    const metricsRow = document.getElementById("metrics-row");
    if (results.length === 0) return;

    const avgOcr = results.reduce((sum, r) => sum + (r.metrics?.ocr_time || 0), 0) / results.length;
    const avgConvert = results.reduce((sum, r) => sum + (r.metrics?.conversion_time || 0), 0) / results.length;
    const avgTotal = results.reduce((sum, r) => sum + (r.metrics?.total_time || 0), 0) / results.length;
    const totalPages = results.reduce((sum, r) => sum + (r.pages_processed || 0), 0);

    const metrics = [
        { value: avgOcr.toFixed(2) + "s", label: "OCR Time", icon: "fa-brain" },
        { value: avgConvert.toFixed(2) + "s", label: "Conversion Time", icon: "fa-rotate" },
        { value: avgTotal.toFixed(2) + "s", label: "Total Time", icon: "fa-stopwatch" },
        { value: totalPages, label: "Pages Processed", icon: "fa-file" },
    ];

    metricsRow.innerHTML = metrics.map(m => `
        <div class="metric-card">
            <div class="metric-value">${m.value}</div>
            <div class="metric-label">${m.label}</div>
        </div>
    `).join("");
}

function initEmptyMap() {
    const map = L.map("map").setView([22.5, 78.9], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);
}

function initMap(results) {
    const validCoords = results.filter(r => r.latitude != null && r.longitude != null);
    const center = validCoords.length > 0
        ? [validCoords[0].latitude, validCoords[0].longitude]
        : [22.5, 78.9];
    const zoom = validCoords.length === 1 ? 13 : 5;

    const map = L.map("map").setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    const markers = [];
    validCoords.forEach(r => {
        const marker = L.marker([r.latitude, r.longitude]).addTo(map);
        marker.bindPopup(`
            <div class="popup-title">${r.owner_name}</div>
            <div class="popup-detail"><strong>Plot:</strong> ${r.plot_number}</div>
            <div class="popup-detail"><strong>Lat:</strong> ${r.latitude}</div>
            <div class="popup-detail"><strong>Lng:</strong> ${r.longitude}</div>
            <div class="popup-detail"><strong>File:</strong> ${r.file}</div>
        `);
        markers.push(marker);
    });

    if (markers.length > 1) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.3));
    } else if (markers.length === 1) {
        markers[0].openPopup();
    }
}

function renderResults(valid, errors) {
    const container = document.getElementById("results-container");
    let html = "";

    valid.forEach((r, i) => {
        const hasCoords = r.latitude != null && r.longitude != null;

        const badges = [];
        badges.push('<span class="badge badge-success"><i class="fa-solid fa-check"></i> Processed</span>');
        if (hasCoords) badges.push('<span class="badge badge-info"><i class="fa-solid fa-map-pin"></i> Mapped</span>');
        if (r.owner_name && r.owner_name !== 'Unknown') badges.push('<span class="badge badge-primary"><i class="fa-solid fa-shield-check"></i> Verified</span>');

        html += `
        <div class="result-block">
            <div class="result-block-title">
                <i class="fa-solid fa-file-lines"></i> ${r.file}
                ${badges.join(' ')}
            </div>
            <div class="results-grid">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-user"></i> Extracted Data</h3>
                    </div>
                    <div class="data-row">
                        <span class="label">Owner Name</span>
                        <span class="value">${r.owner_name}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Plot Number</span>
                        <span class="value">${r.plot_number}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Latitude</span>
                        <span class="value highlight">${r.latitude ?? "Not found"}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Longitude</span>
                        <span class="value highlight">${r.longitude ?? "Not found"}</span>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-bolt"></i> Performance</h3>
                    </div>
                    <div class="data-row">
                        <span class="label">OCR Time</span>
                        <span class="value">${r.metrics?.ocr_time ?? "—"}s</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Conversion Time</span>
                        <span class="value">${r.metrics?.conversion_time ?? "—"}s</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Parse Time</span>
                        <span class="value">${r.metrics?.parse_time ?? "—"}s</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Total Time</span>
                        <span class="value highlight">${r.metrics?.total_time ?? "—"}s</span>
                    </div>
                    <div class="data-row">
                        <span class="label">Pages</span>
                        <span class="value">${r.pages_processed ?? "—"}</span>
                    </div>
                </div>
            </div>
        </div>`;

        if (r.raw_text_preview && i === valid.length - 1) {
            const rawSection = document.getElementById("raw-text-section");
            rawSection.style.display = "block";
            document.getElementById("raw-text").textContent = r.raw_text_preview;
        }
    });

    errors.forEach(r => {
        html += `
        <div class="result-block">
            <div class="result-block-title">
                <i class="fa-solid fa-file-lines"></i> ${r.file}
                <span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> Error</span>
            </div>
            <div class="card" style="border-left: 4px solid var(--danger);">
                <p style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> ${r.error}</p>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

function exportCSV(results) {
    const headers = ["File", "Owner Name", "Plot Number", "Latitude", "Longitude", "OCR Time", "Total Time"];
    const rows = results.map(r => [
        r.file,
        r.owner_name,
        r.plot_number,
        r.latitude ?? '',
        r.longitude ?? '',
        r.metrics?.ocr_time ?? '',
        r.metrics?.total_time ?? ''
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
        csv += row.map(v => `"${v}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "landscan_results.csv";
    a.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast("CSV exported successfully!", "success");
}
