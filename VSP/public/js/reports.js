// reports.js — Reports & Analytics page + Audit Logs
'use strict';

let reportCharts = {};

// Helper: download a file from a URL
function downloadExport(url) {
    const token = getToken();
    // Create a temporary link to trigger download
    const a = document.createElement('a');
    a.href = url + '?token=' + encodeURIComponent(token);
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Actually we need to fetch with auth header and create a blob download
async function exportFile(apiPath, filename) {
    showToast('Preparing export, please wait...', 'info', 2000);
    try {
        const token = getToken();
        const resp = await fetch('/api' + apiPath, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!resp.ok) {
            showToast('Export failed. Try again.', 'error');
            return;
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Export downloaded!', 'success');
    } catch (err) {
        console.error('Export error:', err);
        showToast('Export failed: ' + err.message, 'error');
    }
}

async function renderReports() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-bar-chart-fill"></i> Reports &amp; Analytics</h1>
    </div>
    <div class="erp-tab-bar">
        <span class="erp-tab active" id="rt-dept"     onclick="switchReportTab('dept')">Dept. Consumption</span>
        <span class="erp-tab"        id="rt-material" onclick="switchReportTab('material')">Material Consumption</span>
        <span class="erp-tab"        id="rt-trend"    onclick="switchReportTab('trend')">Monthly Trend</span>
        <span class="erp-tab"        id="rt-stock"    onclick="switchReportTab('stock')">Stock Status</span>
        <span class="erp-tab"        id="rt-alloc"    onclick="switchReportTab('alloc')">Allocation Summary</span>
    </div>
    <div id="reportContent">${erpLoading()}</div>`;
    await loadReportDept();
}

async function switchReportTab(tab) {
    document.querySelectorAll('.erp-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('rt-' + tab)?.classList.add('active');
    // destroy old charts so canvas can be reused
    Object.values(reportCharts).forEach(c => { if (c && c.destroy) c.destroy(); });
    reportCharts = {};
    if (tab === 'dept')     await loadReportDept();
    else if (tab === 'material') await loadReportMaterial();
    else if (tab === 'trend')    await loadReportTrend();
    else if (tab === 'stock')    await loadReportStock();
    else if (tab === 'alloc')    await loadReportAlloc();
}

// ─────────────────────────────────────────────────
// Department Consumption Report
// ─────────────────────────────────────────────────
async function loadReportDept() {
    const rc = document.getElementById('reportContent');
    rc.innerHTML = erpLoading();

    // Build query params from filter inputs if they exist
    let params = '';
    const fromEl = document.getElementById('rptFrom');
    const toEl   = document.getElementById('rptTo');
    if (fromEl && fromEl.value && toEl && toEl.value) {
        params = '?from=' + fromEl.value + '&to=' + toEl.value;
    }

    const data = await apiFetch('/reports/dept-consumption' + params);
    const rows = data?.data || [];

    // Calculate total for summary
    const totalValue = rows.reduce((sum, r) => sum + parseFloat(r.total_value || 0), 0);
    const totalQty   = rows.reduce((sum, r) => sum + parseFloat(r.total_qty || 0), 0);

    rc.innerHTML = `
    <div class="erp-filter-row mb-3">
        <div class="filter-group">
            <label class="erp-form-label">From Date</label>
            <input type="date" class="form-control erp-form-control" id="rptDeptFrom" style="height:32px;">
        </div>
        <div class="filter-group">
            <label class="erp-form-label">To Date</label>
            <input type="date" class="form-control erp-form-control" id="rptDeptTo" style="height:32px;">
        </div>
        <div class="filter-group" style="align-self:flex-end;">
            <button class="btn erp-btn-primary btn-sm" onclick="filterDeptReport()">
                <i class="bi bi-funnel me-1"></i>Filter
            </button>
        </div>
        <div class="filter-group ms-auto" style="align-self:flex-end;">
            <button class="btn erp-btn-secondary btn-sm me-2"
                onclick="exportFile('/export/dept-consumption-excel', 'VSP_DeptConsumption.xlsx')">
                <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
            </button>
            <button class="btn erp-btn-secondary btn-sm"
                onclick="exportFile('/export/dept-consumption-pdf', 'VSP_DeptConsumption.pdf')">
                <i class="bi bi-file-earmark-pdf me-1"></i>Export PDF
            </button>
        </div>
    </div>
    <div class="row g-3 mb-3">
        <div class="col-md-3">
            <div class="stat-card stat-card-blue">
                <span class="stat-card-label">Departments Active</span>
                <div class="stat-card-value">${rows.length}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-green">
                <span class="stat-card-label">Total Qty Issued</span>
                <div class="stat-card-value">${formatNumber(totalQty)}</div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="stat-card stat-card-orange">
                <span class="stat-card-label">Total Value Consumed</span>
                <div class="stat-card-value">${formatCurrency(totalValue)}</div>
            </div>
        </div>
    </div>
    <div class="row g-3">
        <div class="col-md-7">
            <div class="erp-table-wrapper">
                <div class="erp-table-toolbar">
                    <span class="erp-table-toolbar-title">Department-wise Consumption</span>
                </div>
                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead><tr>
                            <th>#</th>
                            <th>Department</th>
                            <th class="text-end">Total Qty</th>
                            <th class="text-end">Total Value</th>
                            <th class="text-end">Transactions</th>
                            <th class="text-end">Materials</th>
                        </tr></thead>
                        <tbody>
                        ${rows.map((r, i) => `<tr>
                            <td><strong>${i + 1}</strong></td>
                            <td><strong>${r.dept_name}</strong> <small class="text-muted">(${r.dept_code})</small></td>
                            <td class="text-end fw-bold">${formatNumber(r.total_qty)}</td>
                            <td class="text-end">${formatCurrency(r.total_value)}</td>
                            <td class="text-end">${r.transactions}</td>
                            <td class="text-end">${r.material_types}</td>
                        </tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted py-3">No data for selected period</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-5">
            <div class="erp-card">
                <div class="erp-card-header"><span class="erp-card-title">Consumption by Department</span></div>
                <div class="erp-card-body"><div class="chart-container"><canvas id="deptRptChart"></canvas></div></div>
            </div>
        </div>
    </div>`;

    // Draw bar chart
    if (rows.length) {
        const colors = ['#1a6faf','#1a7a4a','#d4670a','#c0392b','#5b3fa6','#177a7a','#8a1a1a','#4a5d6e','#6a5a1a'];
        reportCharts.dept = new Chart(document.getElementById('deptRptChart'), {
            type: 'bar',
            data: {
                labels: rows.map(r => r.dept_code),
                datasets: [{
                    label: 'Issue Value (₹)',
                    data: rows.map(r => parseFloat(r.total_value)),
                    backgroundColor: colors.slice(0, rows.length),
                    borderRadius: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

async function filterDeptReport() {
    const from = document.getElementById('rptDeptFrom')?.value;
    const to   = document.getElementById('rptDeptTo')?.value;
    const rc = document.getElementById('reportContent');
    rc.innerHTML = erpLoading();

    let params = '';
    if (from && to) params = '?from=' + from + '&to=' + to;
    const data = await apiFetch('/reports/dept-consumption' + params);
    const rows = data?.data || [];

    // re-render the table portion only
    await loadReportDept();
}

// ─────────────────────────────────────────────────
// Material Consumption Report
// ─────────────────────────────────────────────────
async function loadReportMaterial() {
    const rc = document.getElementById('reportContent');
    rc.innerHTML = erpLoading();
    const data = await apiFetch('/reports/material-consumption');
    const rows = data?.data || [];

    rc.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Top Material Consumption</h5>
        <button class="btn erp-btn-secondary btn-sm"
            onclick="exportFile('/export/material-consumption-excel', 'VSP_MaterialConsumption.xlsx')">
            <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
        </button>
    </div>
    <div class="erp-table-wrapper">
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr>
                <th>#</th><th>Code</th><th>Material Name</th>
                <th>Category</th><th class="text-end">Total Qty</th>
                <th class="text-end">Total Value</th><th class="text-end">Txns</th>
            </tr></thead>
            <tbody>
            ${rows.map((r, i) => `<tr>
                <td><strong>${i + 1}</strong></td>
                <td style="font-family:monospace;font-size:.75rem;">${r.material_code}</td>
                <td>${r.material_name}</td>
                <td><small class="text-muted">${r.category_name}</small></td>
                <td class="text-end fw-bold">${formatNumber(r.total_qty)}</td>
                <td class="text-end">${formatCurrency(r.total_value)}</td>
                <td class="text-end">${r.transactions}</td>
            </tr>`).join('') || '<tr><td colspan="7" class="text-center text-muted py-3">No data</td></tr>'}
            </tbody>
        </table></div>
    </div>`;
}

// ─────────────────────────────────────────────────
// Monthly Trend Report
// ─────────────────────────────────────────────────
async function loadReportTrend() {
    const rc = document.getElementById('reportContent');
    rc.innerHTML = erpLoading();
    const data = await apiFetch('/reports/monthly-trend');
    const rows = data?.data || [];

    rc.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Monthly Issue Trend (Last 12 Months)</h5>
        <button class="btn erp-btn-secondary btn-sm"
            onclick="exportFile('/export/monthly-trend-excel', 'VSP_MonthlyTrend.xlsx')">
            <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
        </button>
    </div>
    <div class="erp-card mb-3">
        <div class="erp-card-header"><span class="erp-card-title">Monthly Consumption Chart</span></div>
        <div class="erp-card-body">
            <div class="chart-container" style="height:320px;"><canvas id="trendChart"></canvas></div>
        </div>
    </div>
    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title">Monthly Breakdown</span></div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr>
                <th>Month</th><th class="text-end">Transactions</th>
                <th class="text-end">Total Qty</th><th class="text-end">Total Value</th>
            </tr></thead>
            <tbody>
            ${rows.map(r => `<tr>
                <td><strong>${r.month_label}</strong></td>
                <td class="text-end">${r.transactions}</td>
                <td class="text-end fw-bold">${formatNumber(r.total_qty)}</td>
                <td class="text-end">${formatCurrency(r.total_value)}</td>
            </tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted py-3">No data</td></tr>'}
            </tbody>
        </table></div>
    </div>`;

    if (rows.length) {
        reportCharts.trend = new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
                labels: rows.map(r => r.month_label),
                datasets: [
                    {
                        label: 'Total Qty',
                        data: rows.map(r => parseFloat(r.total_qty)),
                        borderColor: '#1a6faf',
                        backgroundColor: 'rgba(26,111,175,0.12)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Value (₹)',
                        data: rows.map(r => parseFloat(r.total_value)),
                        borderColor: '#d4670a',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: true } },
                scales: {
                    y:  { beginAtZero: true, position: 'left', title: { display: true, text: 'Quantity' } },
                    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Value (₹)' } }
                }
            }
        });
    }
}

// ─────────────────────────────────────────────────
// Stock Status Report
// ─────────────────────────────────────────────────
async function loadReportStock() {
    const rc = document.getElementById('reportContent');
    rc.innerHTML = erpLoading();
    const data = await apiFetch('/reports/stock-status');
    const rows = data?.data || [];

    // Count status categories
    const zeroCnt     = rows.filter(r => r.stock_status === 'Zero').length;
    const critCnt     = rows.filter(r => r.stock_status === 'Critical').length;
    const lowCnt      = rows.filter(r => r.stock_status === 'Low').length;
    const okCnt       = rows.filter(r => r.stock_status === 'OK').length;
    const totalValue  = rows.reduce((s, r) => s + parseFloat(r.stock_value || 0), 0);

    rc.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Current Stock Status</h5>
        <div>
            <button class="btn erp-btn-secondary btn-sm me-2"
                onclick="exportFile('/export/stock-excel', 'VSP_StockStatus.xlsx')">
                <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
            </button>
            <button class="btn erp-btn-secondary btn-sm"
                onclick="exportFile('/export/stock-pdf', 'VSP_StockStatus.pdf')">
                <i class="bi bi-file-earmark-pdf me-1"></i>Export PDF
            </button>
        </div>
    </div>
    <div class="row g-3 mb-3">
        <div class="col-md-3">
            <div class="stat-card" style="border-left:4px solid #cc0000;">
                <span class="stat-card-label">Zero Stock</span>
                <div class="stat-card-value text-danger">${zeroCnt}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card" style="border-left:4px solid #cc4400;">
                <span class="stat-card-label">Critical Stock</span>
                <div class="stat-card-value" style="color:#cc4400;">${critCnt}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card" style="border-left:4px solid #bb6600;">
                <span class="stat-card-label">Low Stock</span>
                <div class="stat-card-value" style="color:#bb6600;">${lowCnt}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-green">
                <span class="stat-card-label">Total Stock Value</span>
                <div class="stat-card-value" style="font-size:1.1rem;">${formatCurrency(totalValue)}</div>
            </div>
        </div>
    </div>
    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title">All Materials — Stock Position</span>
            <small class="text-muted ms-3">${rows.length} materials | ${okCnt} OK, ${lowCnt} Low, ${critCnt} Critical, ${zeroCnt} Zero</small>
        </div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr>
                <th>Code</th><th>Material</th><th>Category</th><th>UOM</th>
                <th class="text-end">Current</th><th class="text-end">Reserved</th>
                <th class="text-end">Available</th><th class="text-end">Safety</th>
                <th class="text-end">Reorder</th><th class="text-end">Value</th>
                <th>Status</th>
            </tr></thead>
            <tbody>
            ${rows.map(m => `<tr class="${m.stock_status === 'Zero' ? 'health-zero' : m.stock_status === 'Critical' ? 'health-critical' : m.stock_status === 'Low' ? 'health-low' : ''}">
                <td style="font-family:monospace;font-size:.73rem;">${m.material_code}</td>
                <td>${m.material_name}</td>
                <td><small class="text-muted">${m.category_name}</small></td>
                <td><small>${m.unit_of_measure}</small></td>
                <td class="text-end fw-bold">${parseFloat(m.current_stock).toFixed(0)}</td>
                <td class="text-end text-warning">${parseFloat(m.reserved_stock).toFixed(0)}</td>
                <td class="text-end">${parseFloat(m.available_stock).toFixed(0)}</td>
                <td class="text-end"><small>${parseFloat(m.safety_stock).toFixed(0)}</small></td>
                <td class="text-end"><small>${parseFloat(m.reorder_level).toFixed(0)}</small></td>
                <td class="text-end">${formatCurrency(m.stock_value)}</td>
                <td>${stockHealthBadge(m.stock_status)}</td>
            </tr>`).join('')}
            </tbody>
        </table></div>
    </div>`;
}

// ─────────────────────────────────────────────────
// Allocation Efficiency Summary
// ─────────────────────────────────────────────────
async function loadReportAlloc() {
    const rc = document.getElementById('reportContent');
    rc.innerHTML = erpLoading();
    const data = await apiFetch('/reports/allocation-efficiency');
    const s = data?.data || {};
    const total = parseInt(s.total_allocations) || 1;
    const fullPct = Math.round((parseInt(s.full_count) || 0) / total * 100);

    rc.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Allocation Efficiency Summary</h5>
        <button class="btn erp-btn-secondary btn-sm"
            onclick="exportFile('/export/allocation-excel', 'VSP_Allocations.xlsx')">
            <i class="bi bi-file-earmark-excel me-1"></i>Export Details (Excel)
        </button>
    </div>
    <div class="row g-3 mb-3">
        <div class="col-md-3">
            <div class="stat-card stat-card-blue">
                <span class="stat-card-label">Total Allocations</span>
                <div class="stat-card-value">${s.total_allocations || 0}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-green">
                <span class="stat-card-label">Full Allocations</span>
                <div class="stat-card-value">${s.full_count || 0}</div>
                <div class="stat-card-sub">${fullPct}% efficiency</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-orange">
                <span class="stat-card-label">Partial Allocations</span>
                <div class="stat-card-value">${s.partial_count || 0}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-purple">
                <span class="stat-card-label">Waitlisted</span>
                <div class="stat-card-value">${s.waitlisted_count || 0}</div>
            </div>
        </div>
    </div>
    <div class="row g-3">
        <div class="col-md-6">
            <div class="stat-card stat-card-green">
                <span class="stat-card-label">Total Qty Allocated</span>
                <div class="stat-card-value">${formatNumber(s.total_allocated)}</div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="stat-card stat-card-red">
                <span class="stat-card-label">Total Shortage</span>
                <div class="stat-card-value">${formatNumber(s.total_shortage)}</div>
            </div>
        </div>
    </div>
    <div class="erp-card mt-3">
        <div class="erp-card-header"><span class="erp-card-title">Allocation Type Distribution</span></div>
        <div class="erp-card-body">
            <div class="chart-container-sm"><canvas id="allocPieChart"></canvas></div>
        </div>
    </div>`;

    if (s.total_allocations > 0) {
        reportCharts.allocPie = new Chart(document.getElementById('allocPieChart'), {
            type: 'doughnut',
            data: {
                labels: ['Full', 'Partial', 'Waitlisted'],
                datasets: [{
                    data: [s.full_count || 0, s.partial_count || 0, s.waitlisted_count || 0],
                    backgroundColor: ['#1a7a4a', '#d4670a', '#5b3fa6'],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: false }
        });
    }
}

// ─────────────────────────────────────────────────
// Audit Logs (admin only)
// ─────────────────────────────────────────────────
async function renderAuditLogs() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-clock-history"></i> Audit Logs</h1>
    </div>
    <div class="erp-filter-row">
        <div class="filter-group">
            <label class="erp-form-label">Module</label>
            <select class="form-select erp-form-control" id="auditModule" style="height:32px;font-size:.8rem;" onchange="loadAuditLogs()">
                <option value="">All Modules</option>
                ${['Auth','Materials','Requests','Allocations','Users','Departments','Inventory'].map(m => `<option>${m}</option>`).join('')}
            </select>
        </div>
        <div class="filter-group">
            <label class="erp-form-label">From</label>
            <input type="date" class="form-control erp-form-control" id="auditFrom" style="height:32px;" onchange="loadAuditLogs()">
        </div>
        <div class="filter-group">
            <label class="erp-form-label">To</label>
            <input type="date" class="form-control erp-form-control" id="auditTo" style="height:32px;" onchange="loadAuditLogs()">
        </div>
    </div>
    <div class="erp-table-wrapper">
        <div id="auditTableContainer">${erpLoading()}</div>
    </div>`;
    await loadAuditLogs();
}

async function loadAuditLogs() {
    const params = new URLSearchParams({ limit: '100' });
    const module = document.getElementById('auditModule')?.value;
    const from   = document.getElementById('auditFrom')?.value;
    const to     = document.getElementById('auditTo')?.value;
    if (module) params.set('module', module);
    if (from)   params.set('from', from);
    if (to)     params.set('to', to);

    const tc = document.getElementById('auditTableContainer');
    if (tc) tc.innerHTML = erpLoading();

    const data = await apiFetch('/reports/audit-logs?' + params.toString());
    const logs = data?.logs || [];

    if (!tc) return;
    if (!logs.length) {
        tc.innerHTML = erpEmpty('No audit logs found');
        return;
    }

    tc.innerHTML = `<div class="erp-table-responsive"><table class="erp-table">
        <thead><tr>
            <th>Date/Time</th><th>User</th><th>Role</th>
            <th>Module</th><th>Action</th><th>Description</th><th>IP</th>
        </tr></thead>
        <tbody>
        ${logs.map(l => `<tr>
            <td style="white-space:nowrap;font-size:.72rem;">${formatDate(l.created_at, true)}</td>
            <td><strong>${l.user_name || '—'}</strong></td>
            <td>${roleBadge(l.user_role)}</td>
            <td><span class="erp-badge badge-submitted">${l.module}</span></td>
            <td><code style="font-size:.72rem;">${l.action}</code></td>
            <td style="max-width:280px;font-size:.78rem;">${l.description || '—'}</td>
            <td style="font-family:monospace;font-size:.72rem;">${l.ip_address || '—'}</td>
        </tr>`).join('')}
        </tbody>
    </table></div>`;
}
