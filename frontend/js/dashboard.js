// ── Dashboard Page Logic ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const res = await fetch('/api/records');
        const data = await res.json();
        const records = data.records || [];

        renderStats(records);
        renderRecentTable(records);
        renderActivityFeed(records);
        renderChart(records);

    } catch (err) {
        console.error('Dashboard fetch error:', err);
    }
}

function renderStats(records) {
    const total = records.length;
    const extracted = records.filter(r => r.owner_name && r.owner_name !== 'Unknown').length;
    const withCoords = records.filter(r => r.latitude != null && r.longitude != null).length;
    const avgTime = total > 0
        ? (records.reduce((s, r) => s + (r.processing_time || 0), 0) / total).toFixed(2)
        : '0.00';

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-extracted').textContent = extracted;
    document.getElementById('stat-ocr').textContent = withCoords;
    document.getElementById('stat-avg-time').textContent = avgTime + 's';
}

function renderRecentTable(records) {
    const tbody = document.getElementById('recent-tbody');
    const recent = records.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-light);">
            No records yet. <a href="/upload" style="color:var(--primary);font-weight:600;">Upload a PDF</a>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(r => {
        const hasCoords = r.latitude != null && r.longitude != null;
        const badge = hasCoords
            ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Mapped</span>'
            : '<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Partial</span>';
        const date = r.timestamp ? r.timestamp.split(' ')[0] : '—';
        const fname = (r.file_name || '—').length > 20 ? r.file_name.substring(0, 20) + '…' : r.file_name;

        return `<tr>
            <td style="color:var(--text-dark); font-weight:500;">${fname}</td>
            <td class="td-name">${r.owner_name || '—'}</td>
            <td>${r.plot_number || '—'}</td>
            <td>${badge}</td>
            <td style="color:var(--text-light); font-size:0.82rem;">${date}</td>
        </tr>`;
    }).join('');
}

function renderActivityFeed(records) {
    const list = document.getElementById('activity-list');
    const recent = records.slice(0, 6);

    if (recent.length === 0) {
        list.innerHTML = `<li class="activity-item">
            <div class="activity-dot blue"></div>
            <div><div class="activity-text">No activity yet</div></div>
        </li>`;
        return;
    }

    list.innerHTML = recent.map(r => {
        const hasCoords = r.latitude != null && r.longitude != null;
        const dotColor = hasCoords ? 'green' : 'orange';
        const action = hasCoords ? 'processed and mapped' : 'processed (no coords)';
        const time = r.timestamp || '';

        return `<li class="activity-item">
            <div class="activity-dot ${dotColor}"></div>
            <div>
                <div class="activity-text"><strong>${r.owner_name || 'Unknown'}</strong> record ${action}</div>
                <div class="activity-time">${time}</div>
            </div>
        </li>`;
    }).join('');
}

function renderChart(records) {
    const ctx = document.getElementById('dashboard-chart');
    if (!ctx || records.length === 0) return;

    const sorted = [...records].reverse();
    const labels = sorted.map((_, i) => `Record ${i + 1}`);
    const ocrTimes = sorted.map(r => r.ocr_time || 0);
    const procTimes = sorted.map(r => r.processing_time || 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'OCR Time (s)',
                    data: ocrTimes,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6',
                },
                {
                    label: 'Total Processing (s)',
                    data: procTimes,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { font: { family: 'Inter', size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, maxTicksLimit: 10 }
                }
            }
        }
    });
}
