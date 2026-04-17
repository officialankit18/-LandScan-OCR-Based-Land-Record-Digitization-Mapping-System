// ── History Page Logic ──────────────────────────────────────────────
let allRecords = [];
let filteredRecords = [];
let map = null;
let markers = [];
let currentPage = 1;
const perPage = 10;
let sortKey = 'id';
let sortDir = 'desc';

document.addEventListener("DOMContentLoaded", () => {
    fetchRecords();
    document.getElementById("search-input").addEventListener("input", applyFilters);
    document.getElementById("filter-select").addEventListener("change", applyFilters);

    // Sort headers
    document.querySelectorAll("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.sort;
            if (sortKey === key) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortKey = key;
                sortDir = 'asc';
            }
            // Update sort icons
            document.querySelectorAll("th.sortable").forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
            applyFilters();
        });
    });
});

async function fetchRecords() {
    try {
        const res = await fetch("/api/records");
        const data = await res.json();
        allRecords = data.records || [];
        applyFilters();
        initMap(allRecords);
        document.getElementById("record-count").textContent = `${allRecords.length} record(s) in database`;

        if (allRecords.length === 0) {
            document.getElementById("empty-state").style.display = "block";
            document.querySelector(".card").style.display = "none";
            document.querySelector(".toolbar").style.display = "none";
        }
    } catch (err) {
        document.getElementById("record-count").textContent = "Failed to load records";
    }
}

function applyFilters() {
    const q = document.getElementById("search-input").value.toLowerCase();
    const filter = document.getElementById("filter-select").value;

    filteredRecords = allRecords.filter(r => {
        const matchSearch = (r.owner_name || "").toLowerCase().includes(q) ||
            (r.plot_number || "").toLowerCase().includes(q) ||
            (r.file_name || "").toLowerCase().includes(q);

        let matchFilter = true;
        if (filter === 'mapped') matchFilter = r.latitude != null && r.longitude != null;
        if (filter === 'unmapped') matchFilter = r.latitude == null || r.longitude == null;

        return matchSearch && matchFilter;
    });

    // Sort
    filteredRecords.sort((a, b) => {
        let aVal = a[sortKey] ?? '';
        let bVal = b[sortKey] ?? '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    currentPage = 1;
    renderTable();
    renderPagination();
    addMarkers(filteredRecords);
}

function renderTable() {
    const tbody = document.getElementById("records-tbody");
    const start = (currentPage - 1) * perPage;
    const pageRecords = filteredRecords.slice(start, start + perPage);

    if (pageRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-light);">No matching records</td></tr>`;
        return;
    }

    tbody.innerHTML = pageRecords.map(r => {
        const hasCoords = r.latitude != null && r.longitude != null;
        const badge = hasCoords
            ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Mapped</span>'
            : '<span class="badge badge-warning"><i class="fa-solid fa-circle-exclamation"></i> Partial</span>';
        const date = r.timestamp ? r.timestamp.split(" ")[0] : "—";
        const fname = (r.file_name || "—").length > 18 ? r.file_name.substring(0, 18) + "…" : (r.file_name || "—");

        return `<tr>
            <td>${r.id}</td>
            <td class="td-name">${r.owner_name || '—'}</td>
            <td>${r.plot_number || '—'}</td>
            <td>${r.latitude ?? "—"}</td>
            <td>${r.longitude ?? "—"}</td>
            <td title="${r.file_name}">${fname}</td>
            <td style="color:var(--text-light); font-size:0.82rem;">${date}</td>
            <td>${badge}</td>
            <td class="td-actions">
                ${hasCoords ? `<button class="btn btn-outline btn-sm btn-icon" onclick="flyTo(${r.latitude}, ${r.longitude})" title="View on Map"><i class="fa-solid fa-map-pin"></i></button>` : ''}
                <button class="btn btn-outline btn-sm btn-icon" onclick="deleteRecord(${r.id})" title="Delete" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join("");
}

function renderPagination() {
    const pagination = document.getElementById("pagination");
    const totalPages = Math.ceil(filteredRecords.length / perPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
            if (i === 3 || i === totalPages - 2) html += `<span class="page-info">...</span>`;
            continue;
        }
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderTable();
    renderPagination();
}

function initMap(records) {
    const validCoords = records.filter(r => r.latitude != null && r.longitude != null);
    const center = validCoords.length > 0
        ? [validCoords[0].latitude, validCoords[0].longitude]
        : [22.5, 78.9];

    map = L.map("map").setView(center, 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    addMarkers(validCoords);
    if (markers.length > 1) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.3));
    }
}

function addMarkers(records) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    records.forEach(r => {
        if (r.latitude == null || r.longitude == null) return;
        const marker = L.marker([r.latitude, r.longitude]).addTo(map);
        marker.bindPopup(`
            <div class="popup-title">${r.owner_name}</div>
            <div class="popup-detail"><strong>Plot:</strong> ${r.plot_number}</div>
            <div class="popup-detail"><strong>Lat:</strong> ${r.latitude}</div>
            <div class="popup-detail"><strong>Lng:</strong> ${r.longitude}</div>
            <div class="popup-detail"><strong>File:</strong> ${r.file_name}</div>
            <div class="popup-detail"><strong>Date:</strong> ${r.timestamp}</div>
        `);
        markers.push(marker);
    });
}

function flyTo(lat, lng) {
    map.flyTo([lat, lng], 14, { duration: 1.5 });
    markers.forEach(m => {
        const pos = m.getLatLng();
        if (Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001) {
            setTimeout(() => m.openPopup(), 1600);
        }
    });
}

async function deleteRecord(id) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
        const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
        if (res.ok) {
            allRecords = allRecords.filter(r => r.id !== id);
            applyFilters();
            document.getElementById("record-count").textContent = `${allRecords.length} record(s) in database`;
            if (typeof showToast === 'function') showToast("Record deleted successfully", "success");
        }
    } catch (err) {
        if (typeof showToast === 'function') showToast("Failed to delete record", "error");
    }
}
