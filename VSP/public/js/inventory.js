// inventory.js — Inventory Overview, Transactions, Reservations
'use strict';

async function renderInventory() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-archive-fill"></i>Inventory Overview</h1>
    </div>
    <div class="erp-tab-bar">
        <span class="erp-tab active" id="tab-health" onclick="switchInvTab('health')">Inventory Health</span>
        <span class="erp-tab" id="tab-reservations" onclick="switchInvTab('reservations')">Reservations</span>
        <span class="erp-tab" id="tab-transactions" onclick="switchInvTab('transactions')">Transactions</span>
    </div>
    <div id="invTabContent">${erpLoading()}</div>`;
    await loadHealthTab();
}

async function switchInvTab(tab) {
    document.querySelectorAll('.erp-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    if (tab === 'health') await loadHealthTab();
    else if (tab === 'reservations') await loadReservationsTab();
    else await loadTransactionsTab();
}

async function loadHealthTab() {
    const tc = document.getElementById('invTabContent');
    tc.innerHTML = erpLoading();
    const data = await apiFetch('/inventory/health');
    const inv = data?.inventory || [];
    const counts = { Zero: 0, Critical: 0, Low: 0, Adequate: 0 };
    inv.forEach(m => counts[m.health_status] = (counts[m.health_status] || 0) + 1);

    tc.innerHTML = `
    <div class="row g-2 mb-3">
        <div class="col-6 col-md-3"><div class="stat-card stat-card-red"><span class="stat-card-label">Zero Stock</span><div class="stat-card-value text-danger">${counts.Zero}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card stat-card-red"><span class="stat-card-label">Critical</span><div class="stat-card-value text-danger">${counts.Critical}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card stat-card-orange"><span class="stat-card-label">Low Stock</span><div class="stat-card-value">${counts.Low}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card stat-card-green"><span class="stat-card-label">Adequate</span><div class="stat-card-value text-success">${counts.Adequate}</div></div></div>
    </div>
    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title">Inventory Health Summary</span>
            <div class="erp-search-box ms-auto"><i class="bi bi-search"></i>
                <input type="text" class="form-control" style="height:30px;font-size:.78rem;padding-left:26px;border-radius:2px;" placeholder="Filter..." id="healthFilter" oninput="filterHealth(this.value)">
            </div>
        </div>
        <div class="erp-table-responsive">
            <table class="erp-table" id="healthTable">
                <thead><tr><th>Code</th><th>Material Name</th><th>Category</th><th class="text-end">Current</th><th class="text-end">Reserved</th><th class="text-end">Available</th><th class="text-end">Safety</th><th class="text-end">Reorder</th><th class="text-end">Value</th><th>Health</th></tr></thead>
                <tbody id="healthTbody">
                ${inv.map(m => `<tr class="health-row ${m.health_status === 'Zero' ? 'health-zero' : m.health_status === 'Critical' ? 'health-critical' : m.health_status === 'Low' ? 'health-low' : ''}">
                    <td style="font-family:monospace;font-size:.75rem;">${m.material_code}</td>
                    <td><strong>${m.material_name}</strong></td>
                    <td><small>${m.category_name}</small></td>
                    <td class="text-end fw-bold">${m.current_stock}</td>
                    <td class="text-end text-warning">${m.reserved_stock}</td>
                    <td class="text-end fw-bold">${m.available_stock}</td>
                    <td class="text-end">${m.safety_stock}</td>
                    <td class="text-end">${m.reorder_level}</td>
                    <td class="text-end">${formatCurrency(m.stock_value)}</td>
                    <td>${stockHealthBadge(m.health_status)}</td>
                </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

function filterHealth(q) {
    const rows = document.querySelectorAll('#healthTbody tr.health-row');
    rows.forEach(row => {
        row.style.display = q && !row.textContent.toLowerCase().includes(q.toLowerCase()) ? 'none' : '';
    });
}

async function loadReservationsTab() {
    const tc = document.getElementById('invTabContent');
    tc.innerHTML = erpLoading();
    const data = await apiFetch('/inventory/reservations');
    const res = data?.reservations || [];
    tc.innerHTML = `<div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title"><i class="bi bi-bookmark-fill me-1"></i>Active Reservations (${res.length})</span></div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr><th>Request No</th><th>Department</th><th>Material</th><th class="text-end">Reserved Qty</th><th>Type</th><th>Status</th><th>Expires</th></tr></thead>
            <tbody>
            ${res.map(r => `<tr>
                <td><span class="request-no-badge">${r.request_no}</span></td>
                <td>${r.dept_name}</td>
                <td><span style="font-family:monospace;font-size:.74rem;">${r.material_code}</span> ${r.material_name}</td>
                <td class="text-end fw-bold">${r.reserved_quantity} ${r.unit_of_measure}</td>
                <td>${statusBadge(r.reservation_type)}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatDate(r.expires_at, true)}</td>
            </tr>`).join('') || `<tr><td colspan="7" class="text-center text-muted py-3">No active reservations</td></tr>`}
            </tbody>
        </table></div>
    </div>`;
}

async function loadTransactionsTab() { await renderTransactions(); }

async function renderStockAdjust() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-sliders"></i>Stock Adjustment</h1>
    </div>
    <div class="erp-card mb-3">
        <div class="erp-card-header"><span class="erp-card-title"><i class="bi bi-search me-2"></i>Select Material to Adjust</span></div>
        <div class="erp-card-body">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="erp-form-label">Search Material</label>
                    <input type="text" class="form-control erp-form-control" id="adjSearch" placeholder="Type material code or name..." oninput="searchMaterialForAdjust(this.value)">
                </div>
            </div>
            <div id="adjSearchResults" class="mt-3"></div>
        </div>
    </div>
    <div id="adjFormContainer" class="d-none">
        <div class="erp-card">
            <div class="erp-card-header"><span class="erp-card-title" id="adjMaterialTitle">Adjust Stock</span></div>
            <div class="erp-card-body">
                <input type="hidden" id="adjMatId">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="erp-form-label">Current Stock</label>
                        <input type="text" class="form-control erp-form-control" id="adjCurrentStock" readonly style="background:#f5f5f5;">
                    </div>
                    <div class="col-md-4">
                        <label class="erp-form-label">Adjustment Type *</label>
                        <select class="form-select erp-form-control" id="adjType">
                            <option value="Adjustment_In">Adjustment In (Add Stock)</option>
                            <option value="Adjustment_Out">Adjustment Out (Remove Stock)</option>
                            <option value="Return">Return (Add Stock)</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="erp-form-label">Quantity *</label>
                        <input type="number" class="form-control erp-form-control" id="adjQty" placeholder="0" min="0.001" step="0.001">
                    </div>
                    <div class="col-md-12">
                        <label class="erp-form-label">Remarks</label>
                        <input type="text" class="form-control erp-form-control" id="adjRemarks" placeholder="Reason for adjustment...">
                    </div>
                    <div class="col-12">
                        <button class="erp-btn erp-btn-primary" onclick="doStockAdjust()"><i class="bi bi-check2 me-2"></i>Apply Adjustment</button>
                        <button class="erp-btn erp-btn-secondary ms-2" onclick="document.getElementById('adjFormContainer').classList.add('d-none')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

const _adjSearchDebounced = debounce(async (q) => {
    const rc = document.getElementById('adjSearchResults');
    if (!rc) return;
    if (!q || q.length < 2) { rc.innerHTML = ''; return; }
    rc.innerHTML = erpLoading();
    const data = await apiFetch(`/materials?search=${encodeURIComponent(q)}&limit=10`);
    const mats = data?.materials || [];
    if (!mats.length) { rc.innerHTML = '<p class="text-muted">No materials found.</p>'; return; }
    rc.innerHTML = `<div class="erp-table-responsive"><table class="erp-table"><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Current Stock</th><th>Unit</th><th>Action</th></tr></thead><tbody>`
        + mats.map(m => `<tr><td style="font-family:monospace;font-size:.75rem;">${m.material_code}</td><td>${m.material_name}</td><td>${m.category_name}</td><td class="fw-bold">${m.current_stock}</td><td>${m.unit_of_measure}</td><td><button class="btn-action btn-action-blue" onclick="selectMatForAdjust(${m.id},'${escapeHTML(m.material_code)} — ${escapeHTML(m.material_name)}',${m.current_stock})">Select</button></td></tr>`).join('')
        + '</tbody></table></div>';
}, 350);

function searchMaterialForAdjust(q) { _adjSearchDebounced(q); }

function selectMatForAdjust(id, name, stock) {
    document.getElementById('adjMatId').value = id;
    document.getElementById('adjMaterialTitle').textContent = 'Adjust Stock: ' + name;
    document.getElementById('adjCurrentStock').value = stock;
    document.getElementById('adjQty').value = '';
    document.getElementById('adjRemarks').value = '';
    document.getElementById('adjFormContainer').classList.remove('d-none');
    document.getElementById('adjSearchResults').innerHTML = '';
    document.getElementById('adjSearch').value = name;
}

async function doStockAdjust() {
    const id = document.getElementById('adjMatId').value;
    const qty = parseFloat(document.getElementById('adjQty').value);
    const type = document.getElementById('adjType').value;
    const remarks = document.getElementById('adjRemarks').value.trim();
    if (!id || !qty || qty <= 0) { showToast('Please select a material and enter a valid quantity.', 'error'); return; }
    try {
        const data = await apiFetch(`/materials/${id}/adjust`, { method: 'POST', body: { adjustment_type: type, quantity: qty, remarks } });
        showToast(`Stock adjusted. Before: ${data.stock_before} → After: ${data.stock_after}`, 'success', 5000);
        document.getElementById('adjCurrentStock').value = data.stock_after;
        document.getElementById('adjQty').value = '';
    } catch (err) { showToast(err.message, 'error'); }
}

async function renderTransactions(params = {}) {
    const content = currentPage === 'transactions' ? document.getElementById('pageContent') : document.getElementById('invTabContent');
    if (!content) return;

    const filterHtml = currentPage === 'transactions' ? `
    <div class="page-title-bar"><h1 class="page-title"><i class="bi bi-arrow-left-right"></i>Inventory Transactions</h1></div>
    <div class="erp-filter-row">
        <div class="filter-group"><label class="erp-form-label">From</label>
            <input type="date" class="form-control erp-form-control" id="txnFrom" style="height:32px;font-size:.8rem;"></div>
        <div class="filter-group"><label class="erp-form-label">To</label>
            <input type="date" class="form-control erp-form-control" id="txnTo" style="height:32px;font-size:.8rem;"></div>
        <div class="filter-group"><label class="erp-form-label">Type</label>
            <select class="form-select erp-form-control" id="txnType" style="height:32px;font-size:.8rem;">
                <option value="">All Types</option>
                <option value="Issue">Issue</option>
                <option value="Adjustment_In">Adjustment In</option>
                <option value="Adjustment_Out">Adjustment Out</option>
                <option value="Return">Return</option>
            </select>
        </div>
        <div class="filter-group ms-auto" style="flex-direction:row;gap:6px;align-items:flex-end;">
            <button class="erp-btn erp-btn-primary erp-btn-sm" onclick="doLoadTransactions()"><i class="bi bi-funnel me-1"></i>Apply</button>
        </div>
    </div>` : '';

    content.innerHTML = filterHtml + `<div id="txnTable">${erpLoading()}</div>`;
    await doLoadTransactions();
}

async function doLoadTransactions() {
    const from = document.getElementById('txnFrom')?.value || '';
    const to   = document.getElementById('txnTo')?.value || '';
    const type = document.getElementById('txnType')?.value || '';
    const params = new URLSearchParams({ limit: '50' });
    if (from) params.set('from', from);
    if (to)   params.set('to', to);
    if (type) params.set('type', type);

    const tc = document.getElementById('txnTable');
    if (tc) tc.innerHTML = erpLoading();
    const data = await apiFetch(`/inventory/transactions?${params.toString()}`);
    const txns = data?.transactions || [];
    if (tc) tc.innerHTML = `<div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title">Transactions (${txns.length})</span></div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr><th>Txn No</th><th>Date</th><th>Type</th><th>Material</th><th>Department</th><th class="text-end">Qty</th><th class="text-end">Before</th><th class="text-end">After</th><th class="text-end">Value</th><th>By</th></tr></thead>
            <tbody>
            ${txns.map(t => `<tr>
                <td style="font-family:monospace;font-size:.72rem;">${t.transaction_no}</td>
                <td>${formatDate(t.transaction_date, true)}</td>
                <td><span class="erp-badge ${t.transaction_type === 'Issue' ? 'badge-submitted' : 'badge-dept-approved'}">${t.transaction_type.replace(/_/g,' ')}</span></td>
                <td><strong style="font-size:.78rem;">${t.material_name}</strong><br><small class="text-muted">${t.material_code}</small></td>
                <td>${t.dept_name || '—'}</td>
                <td class="text-end fw-bold">${t.quantity} ${t.unit_of_measure}</td>
                <td class="text-end">${t.stock_before}</td>
                <td class="text-end ${t.stock_after < t.stock_before ? 'text-danger' : 'text-success'}">${t.stock_after}</td>
                <td class="text-end">${formatCurrency(t.total_value)}</td>
                <td><small>${t.performed_by_name}</small></td>
            </tr>`).join('') || `<tr><td colspan="10" class="text-center text-muted py-3">No transactions found</td></tr>`}
            </tbody>
        </table></div>
    </div>`;
}

async function renderReservations() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `<div class="page-title-bar"><h1 class="page-title"><i class="bi bi-bookmark-fill"></i>Active Reservations</h1></div><div id="resvStandalone">${erpLoading()}</div>`;
    const data = await apiFetch('/inventory/reservations');
    const res = data?.reservations || [];
    const container = document.getElementById('resvStandalone');
    if (!container) return;
    container.innerHTML = `<div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title"><i class="bi bi-bookmark-fill me-1"></i>Active Reservations (${res.length})</span></div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr><th>Request No</th><th>Department</th><th>Material</th><th class="text-end">Reserved Qty</th><th>Type</th><th>Status</th><th>Expires</th></tr></thead>
            <tbody>
            ${res.map(r => `<tr>
                <td><span class="request-no-badge">${r.request_no}</span></td>
                <td>${r.dept_name}</td>
                <td><span style="font-family:monospace;font-size:.74rem;">${r.material_code}</span> ${r.material_name}</td>
                <td class="text-end fw-bold">${r.reserved_quantity} ${r.unit_of_measure}</td>
                <td>${statusBadge(r.reservation_type)}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatDate(r.expires_at, true)}</td>
            </tr>`).join('') || `<tr><td colspan="7" class="text-center text-muted py-3">No active reservations</td></tr>`}
            </tbody>
        </table></div>
    </div>`;
}
