// ── Analytics Page Logic ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchAnalytics();
});

async function fetchAnalytics() {
    try {
        const res = await fetch('/api/records');
        const data = await res.json();
        const records = data.records || [];

        renderKPIs(records);
        renderLineChart(records);
        renderPieChart(records);
        renderBarChart(records);
    } catch (err) {
        console.error('Analytics fetch error:', err);
    }
}

function renderKPIs(records) {
    const total = records.length;
    const mapped = records.filter(r => r.latitude != null && r.longitude != null).length;
    const avgOcr = total > 0 ? (records.reduce((s, r) => s + (r.ocr_time || 0), 0) / total).toFixed(2) : '0.00';
    const avgProc = total > 0 ? (records.reduce((s, r) => s + (r.processing_time || 0), 0) / total).toFixed(2) : '0.00';
    const successRate = total > 0 ? ((mapped / total) * 100).toFixed(1) : '0.0';
    const fastest = total > 0 ? Math.min(...records.map(r => r.processing_time || Infinity)).toFixed(2) : '0.00';

    document.getElementById('a-total').textContent = total;
    document.getElementById('a-mapped').textContent = mapped;
    document.getElementById('a-avg-ocr').textContent = avgOcr + 's';
    document.getElementById('a-avg-proc').textContent = avgProc + 's';
    document.getElementById('a-success').textContent = successRate + '%';
    document.getElementById('a-fastest').textContent = fastest + 's';
}

function renderLineChart(records) {
    const ctx = document.getElementById('chart-line');
    if (!ctx || records.length === 0) return;

    const sorted = [...records].reverse();
    const labels = sorted.map((r, i) => r.timestamp ? r.timestamp.split(' ')[0] : `#${i + 1}`);
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
                    pointRadius: 3,
                    pointBackgroundColor: '#3b82f6',
                    borderWidth: 2,
                },
                {
                    label: 'Total Processing (s)',
                    data: procTimes,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#6366f1',
                    borderWidth: 2,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, padding: 16, font: { family: 'Inter', size: 12 } }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Inter', size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45, maxTicksLimit: 10 } }
            }
        }
    });
}

function renderPieChart(records) {
    const ctx = document.getElementById('chart-pie');
    if (!ctx || records.length === 0) return;

    const mapped = records.filter(r => r.latitude != null && r.longitude != null).length;
    const unmapped = records.length - mapped;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Mapped (with coordinates)', 'Unmapped (no coordinates)'],
            datasets: [{
                data: [mapped, unmapped],
                backgroundColor: ['#10b981', '#f59e0b'],
                borderColor: ['#fff', '#fff'],
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
                }
            },
            cutout: '55%',
        }
    });
}

function renderBarChart(records) {
    const ctx = document.getElementById('chart-bar');
    if (!ctx || records.length === 0) return;

    // Group by date
    const dateCounts = {};
    records.forEach(r => {
        const date = r.timestamp ? r.timestamp.split(' ')[0] : 'Unknown';
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    const counts = sortedDates.map(d => dateCounts[d]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Records Uploaded',
                data: counts,
                backgroundColor: 'rgba(59,130,246,0.7)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 }
                }
            }
        }
    });
}
