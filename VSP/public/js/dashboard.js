// dashboard.js — Role-aware Dashboard
'use strict';

let dashCharts = {};

async function renderDashboard() {
    const user = getUser();
    const role = user?.role;
    const content = document.getElementById('pageContent');

    if (role === 'admin') await renderAdminDashboard(content);
    else if (role === 'store_manager') await renderStoreDashboard(content);
    else await renderDeptDashboard(content);
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────
async function renderAdminDashboard(content) {
    content.innerHTML = erpLoading();
    const data = await apiFetch('/dashboard/admin');
    if (!data) return;
    const s = data.stats;

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-grid-1x2-fill"></i>Admin Dashboard</h1>
        <div class="page-title-actions">
            <button class="erp-btn erp-btn-secondary erp-btn-sm" onclick="renderDashboard()"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
        </div>
    </div>

    ${s.emergency_count > 0 ? `<div class="emergency-banner"><i class="bi bi-exclamation-octagon-fill"></i>${s.emergency_count} Emergency Request(s) Require Immediate Attention! <button class="erp-btn erp-btn-sm ms-auto" style="background:#fff;color:#5b0000;" onclick="navTo('requests',{status:'Submitted',type:'1'})">View Now</button></div>` : ''}

    <!-- Stat Row 1 -->
    <div class="row g-3 mb-3">
        <div class="col-6 col-md-3">
            <div class="stat-card stat-card-blue">
                <span class="stat-card-label">Total Materials</span>
                <div class="stat-card-value">${formatNumber(s.total_materials)}</div>
                <div class="stat-card-sub">Active in catalog</div>
                <i class="bi bi-box-seam stat-card-icon"></i>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card stat-card-green">
                <span class="stat-card-label">Inventory Value</span>
                <div class="stat-card-value" style="font-size:1.2rem;">${formatCurrency(s.inventory_value)}</div>
                <div class="stat-card-sub">Total stock value</div>
                <i class="bi bi-currency-rupee stat-card-icon"></i>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card stat-card-orange">
                <span class="stat-card-label">Pending Requests</span>
                <div class="stat-card-value text-warning">${s.pending_requests || 0}</div>
                <div class="stat-card-sub">Awaiting approval</div>
                <i class="bi bi-clock stat-card-icon"></i>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card stat-card-red">
                <span class="stat-card-label">Low Stock Items</span>
                <div class="stat-card-value text-danger">${s.low_stock_count || 0}</div>
                <div class="stat-card-sub">${s.critical_stock_count || 0} critical</div>
                <i class="bi bi-exclamation-triangle stat-card-icon"></i>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-6 col-md-2">
            <div class="stat-card stat-card-purple">
                <span class="stat-card-label">Departments</span>
                <div class="stat-card-value">${s.total_departments || 0}</div>
            </div>
        </div>
        <div class="col-6 col-md-2">
            <div class="stat-card stat-card-teal">
                <span class="stat-card-label">Store Review</span>
                <div class="stat-card-value">${s.store_review || 0}</div>
            </div>
        </div>
        <div class="col-6 col-md-2">
            <div class="stat-card stat-card-orange">
                <span class="stat-card-label">Partial Alloc.</span>
                <div class="stat-card-value">${s.partially_allocated || 0}</div>
            </div>
        </div>
        <div class="col-6 col-md-2">
            <div class="stat-card stat-card-purple">
                <span class="stat-card-label">Waitlisted</span>
                <div class="stat-card-value">${s.waitlisted || 0}</div>
            </div>
        </div>
        <div class="col-6 col-md-2">
            <div class="stat-card stat-card-red">
                <span class="stat-card-label">Emergency</span>
                <div class="stat-card-value text-danger">${s.emergency_count || 0}</div>
            </div>
        </div>
        <div class="col-6 col-md-2">
            <div class="stat-card stat-card-blue">
                <span class="stat-card-label">Active Alerts</span>
                <div class="stat-card-value">${s.active_alerts || 0}</div>
            </div>
        </div>
    </div>

    <!-- Charts Row -->
    <div class="row g-3 mb-3">
        <div class="col-md-8">
            <div class="erp-card">
                <div class="erp-card-header">
                    <span class="erp-card-title"><i class="bi bi-bar-chart"></i>Monthly Consumption Trend (Last 6 Months)</span>
                </div>
                <div class="erp-card-body">
                    <div class="chart-container"><canvas id="monthlyChart"></canvas></div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="erp-card">
                <div class="erp-card-header">
                    <span class="erp-card-title"><i class="bi bi-pie-chart"></i>Dept. Consumption</span>
                </div>
                <div class="erp-card-body">
                    <div class="chart-container"><canvas id="deptChart"></canvas></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Row -->
    <div class="row g-3">
        <div class="col-md-6">
            <div class="erp-table-wrapper">
                <div class="erp-table-toolbar"><span class="erp-table-toolbar-title"><i class="bi bi-fire me-2"></i>Top Consumed Materials</span></div>
                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead><tr><th>#</th><th>Material</th><th>Category</th><th class="text-end">Qty</th><th class="text-end">Value</th></tr></thead>
                        <tbody>
                        ${(data.top_materials || []).map((m, i) => `<tr>
                            <td><strong>${i+1}</strong></td>
                            <td><span class="text-muted" style="font-size:.72rem;">${m.material_code}</span><br><span class="fw-600">${m.material_name}</span></td>
                            <td>${m.category_name || '—'}</td>
                            <td class="text-end fw-bold">${formatNumber(m.total_consumed)}</td>
                            <td class="text-end">${formatCurrency(m.total_value)}</td>
                        </tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-3">No transactions yet</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="erp-table-wrapper">
                <div class="erp-table-toolbar"><span class="erp-table-toolbar-title"><i class="bi bi-clock-history me-2"></i>Recent Requests</span>
                    <button class="erp-btn erp-btn-secondary erp-btn-xs ms-auto" onclick="navTo('requests')">View All</button>
                </div>
                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead><tr><th>Request No</th><th>Department</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>
                        ${(data.recent_requests || []).map(r => `<tr>
                            <td><span class="request-no-badge">${r.request_no}</span></td>
                            <td>${r.dept_name}</td>
                            <td>${r.type_name}</td>
                            <td>${statusBadge(r.status)}</td>
                            <td>${formatDate(r.created_at)}</td>
                        </tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-3">No requests yet</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;

    // Render Charts
    Object.values(dashCharts).forEach(c => c.destroy && c.destroy());
    dashCharts = {};

    const monthly = data.monthly_trend || [];
    if (monthly.length && document.getElementById('monthlyChart')) {
        dashCharts.monthly = new Chart(document.getElementById('monthlyChart'), {
            type: 'bar',
            data: { labels: monthly.map(m => m.month), datasets: [{
                label: 'Total Qty Issued', data: monthly.map(m => m.total_qty),
                backgroundColor: '#1a6faf', borderRadius: 2
            }]},
            options: { responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#eee' } }, x: { grid: { display: false } } }}
        });
    }

    const depts = data.dept_consumption || [];
    if (depts.length && document.getElementById('deptChart')) {
        const colors = ['#1a6faf','#1a7a4a','#d4670a','#c0392b','#5b3fa6','#177a7a','#8a1a1a','#4a5d6e','#6a5a1a'];
        dashCharts.dept = new Chart(document.getElementById('deptChart'), {
            type: 'doughnut',
            data: { labels: depts.map(d => d.dept_code), datasets: [{
                data: depts.map(d => d.total_qty), backgroundColor: colors.slice(0, depts.length), borderWidth: 1
            }]},
            options: { responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } }}
        });
    }
}

// ── STORE DASHBOARD ───────────────────────────────────────────
async function renderStoreDashboard(content) {
    content.innerHTML = erpLoading();
    const data = await apiFetch('/dashboard/store');
    if (!data) return;
    const s = data.stats;

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-grid-1x2-fill"></i>Store Manager Dashboard</h1>
    </div>
    <div class="row g-3 mb-3">
        <div class="col-6 col-md-3"><div class="stat-card stat-card-orange">
            <span class="stat-card-label">Pending Allocation</span>
            <div class="stat-card-value">${s.pending_allocation || 0}</div>
            <div class="stat-card-sub">Dept. Approved</div>
        </div></div>
        <div class="col-6 col-md-3"><div class="stat-card stat-card-blue">
            <span class="stat-card-label">In Store Review</span>
            <div class="stat-card-value">${s.in_store_review || 0}</div>
        </div></div>
        <div class="col-6 col-md-3"><div class="stat-card stat-card-green">
            <span class="stat-card-label">Ready to Issue</span>
            <div class="stat-card-value">${s.pending_issue || 0}</div>
        </div></div>
        <div class="col-6 col-md-3"><div class="stat-card stat-card-red">
            <span class="stat-card-label">Emergency</span>
            <div class="stat-card-value text-danger">${s.emergency || 0}</div>
        </div></div>
    </div>
    <div class="row g-3 mb-3">
        <div class="col-md-3"><div class="stat-card stat-card-orange">
            <span class="stat-card-label">Low Stock Items</span>
            <div class="stat-card-value">${s.low_stock || 0}</div>
        </div></div>
        <div class="col-md-3"><div class="stat-card stat-card-red">
            <span class="stat-card-label">Critical Stock</span>
            <div class="stat-card-value">${s.critical_stock || 0}</div>
        </div></div>
        <div class="col-md-3"><div class="stat-card stat-card-purple">
            <span class="stat-card-label">Partially Alloc.</span>
            <div class="stat-card-value">${s.partially_allocated || 0}</div>
        </div></div>
        <div class="col-md-3"><div class="stat-card stat-card-teal">
            <span class="stat-card-label">Waitlisted</span>
            <div class="stat-card-value">${s.waitlisted || 0}</div>
        </div></div>
    </div>
    <div class="row g-3">
        <div class="col-md-7">
            <div class="erp-table-wrapper">
                <div class="erp-table-toolbar">
                    <span class="erp-table-toolbar-title"><i class="bi bi-list-check me-2"></i>Pending Work Queue</span>
                    <button class="erp-btn erp-btn-secondary erp-btn-xs ms-auto" onclick="navTo('requests')">View All</button>
                </div>
                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead><tr><th>Request No</th><th>Department</th><th>Type</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                        <tbody>
                        ${(data.pending_requests || []).map(r => `<tr>
                            <td><span class="request-no-badge">${r.request_no}</span></td>
                            <td>${r.dept_name}</td>
                            <td><span class="erp-badge badge-submitted" style="font-size:.65rem;">${r.type_name}</span></td>
                            <td>${statusBadge(r.status)}</td>
                            <td>${formatDate(r.created_at)}</td>
                            <td><button class="btn-action btn-action-blue" onclick="viewRequest(${r.id})"><i class="bi bi-eye"></i> View</button></td>
                        </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted py-3">No pending requests</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-5">
            <div class="erp-table-wrapper">
                <div class="erp-table-toolbar">
                    <span class="erp-table-toolbar-title"><i class="bi bi-exclamation-triangle me-2 text-danger"></i>Critical Low Stock</span>
                    <button class="erp-btn erp-btn-secondary erp-btn-xs ms-auto" onclick="navTo('inventory')">View All</button>
                </div>
                <div class="erp-table-responsive">
                    <table class="erp-table">
                        <thead><tr><th>Code</th><th>Material</th><th>Stock</th><th>Reorder</th></tr></thead>
                        <tbody>
                        ${(data.low_stock_items || []).map(m => `<tr class="${m.current_stock <= 0 ? 'health-zero' : m.current_stock <= m.safety_stock ? 'health-critical' : 'health-low'}">
                            <td style="font-family:monospace;font-size:.75rem;">${m.material_code}</td>
                            <td>${m.material_name}</td>
                            <td class="fw-bold">${m.current_stock} ${m.unit_of_measure}</td>
                            <td>${m.reorder_level}</td>
                        </tr>`).join('') || `<tr><td colspan="4" class="text-center text-muted py-3">All stocks adequate</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;
}

// ── DEPT DASHBOARD ────────────────────────────────────────────
async function renderDeptDashboard(content) {
    content.innerHTML = erpLoading();
    const data = await apiFetch('/dashboard/dept');
    if (!data) return;
    const s = data.stats;
    const user = getUser();

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-grid-1x2-fill"></i>${user.dept_name || 'Department'} Dashboard</h1>
        <div class="page-title-actions">
            <button class="erp-btn erp-btn-primary erp-btn-sm" onclick="navTo('new-request')"><i class="bi bi-plus-circle me-1"></i>New Requisition</button>
        </div>
    </div>
    <div class="row g-3 mb-3">
        <div class="col-6 col-md-2"><div class="stat-card stat-card-blue">
            <span class="stat-card-label">Total Requests</span><div class="stat-card-value">${s.total || 0}</div></div></div>
        <div class="col-6 col-md-2"><div class="stat-card stat-card-orange">
            <span class="stat-card-label">Draft</span><div class="stat-card-value">${s.draft || 0}</div></div></div>
        <div class="col-6 col-md-2"><div class="stat-card stat-card-orange">
            <span class="stat-card-label">Submitted</span><div class="stat-card-value">${s.submitted || 0}</div></div></div>
        <div class="col-6 col-md-2"><div class="stat-card stat-card-green">
            <span class="stat-card-label">Approved</span><div class="stat-card-value">${s.approved || 0}</div></div></div>
        <div class="col-6 col-md-2"><div class="stat-card stat-card-teal">
            <span class="stat-card-label">Issued</span><div class="stat-card-value">${s.issued || 0}</div></div></div>
        <div class="col-6 col-md-2"><div class="stat-card stat-card-red">
            <span class="stat-card-label">Rejected</span><div class="stat-card-value">${s.rejected || 0}</div></div></div>
    </div>

    ${user.role === 'dept_head' && data.pending_approvals?.length > 0 ? `
    <div class="erp-table-wrapper mb-3">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title"><i class="bi bi-hand-index me-2 text-warning"></i>Pending Your Approval (${data.pending_approvals.length})</span>
        </div>
        <div class="erp-table-responsive">
            <table class="erp-table">
                <thead><tr><th>Request No</th><th>Requested By</th><th>Type</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                ${data.pending_approvals.map(r => `<tr>
                    <td><span class="request-no-badge">${r.request_no}</span></td>
                    <td>${r.requested_by_name}</td>
                    <td><span class="erp-badge badge-submitted">${r.type_name}</span></td>
                    <td>${formatDate(r.created_at)}</td>
                    <td>
                        <button class="btn-action btn-action-green me-1" onclick="quickApprove(${r.id}, 'approve')"><i class="bi bi-check2"></i> Approve</button>
                        <button class="btn-action btn-action-red" onclick="viewRequest(${r.id})"><i class="bi bi-eye"></i> Review</button>
                    </td>
                </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>` : ''}

    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title"><i class="bi bi-clock-history me-2"></i>Recent Requests</span>
            <button class="erp-btn erp-btn-secondary erp-btn-xs ms-auto" onclick="navTo('requests')">View All</button>
        </div>
        <div class="erp-table-responsive">
            <table class="erp-table">
                <thead><tr><th>Request No</th><th>Type</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                ${(data.recent_requests || []).map(r => `<tr>
                    <td><span class="request-no-badge">${r.request_no}</span></td>
                    <td>${r.type_name}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td>${formatDate(r.created_at)}</td>
                    <td><button class="btn-action btn-action-blue" onclick="viewRequest(${r.id})"><i class="bi bi-eye"></i> View</button></td>
                </tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-3">No requests yet. <a href="javascript:void(0)" onclick="navTo('new-request')">Create one now</a></td></tr>`}
                </tbody>
            </table>
        </div>
    </div>`;
}

async function quickApprove(requestId, action) {
    const confirmed = await confirmAction(`Are you sure you want to ${action} this request?`);
    if (!confirmed) return;
    try {
        await apiFetch(`/requests/${requestId}/dept-action`, { method: 'PUT', body: { action, remarks: '' } });
        showToast(`Request ${action}d successfully.`, 'success');
        renderDashboard();
    } catch (err) { showToast(err.message, 'error'); }
}
