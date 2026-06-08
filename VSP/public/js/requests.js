// requests.js — Material Requisition (Cart) Module
'use strict';

let cart = []; // Material cart items
let requestTypes = [];
let allMaterials = [];

// ── RENDER REQUESTS LIST ──────────────────────────────────────
async function renderRequests(params = {}) {
    const user = getUser();
    const content = document.getElementById('pageContent');

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-file-earmark-text-fill"></i>
        ${user.role === 'admin' || user.role === 'store_manager' ? 'All Requests' : 'My Requests'}</h1>
        <div class="page-title-actions">
            ${['dept_user','dept_head'].includes(user.role) ? `<button class="erp-btn erp-btn-primary erp-btn-sm" onclick="navTo('new-request')"><i class="bi bi-plus-circle me-1"></i>New Requisition</button>` : ''}
        </div>
    </div>

    <div class="erp-filter-row">
        <div class="filter-group">
            <label class="erp-form-label">Status</label>
            <select class="erp-form-select erp-form-control" id="filterStatus" style="height:32px;font-size:.8rem;" onchange="loadRequests()">
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Dept_Approved">Dept. Approved</option>
                <option value="Dept_Rejected">Dept. Rejected</option>
                <option value="Store_Review">Store Review</option>
                <option value="Allocated">Allocated</option>
                <option value="Partially_Allocated">Partial Alloc.</option>
                <option value="Waitlisted">Waitlisted</option>
                <option value="Issued">Issued</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
            </select>
        </div>
        ${user.role === 'admin' || user.role === 'store_manager' ? `
        <div class="filter-group">
            <label class="erp-form-label">Type</label>
            <select class="erp-form-select erp-form-control" id="filterType" style="height:32px;font-size:.8rem;" onchange="loadRequests()">
                <option value="">All Types</option>
            </select>
        </div>` : ''}
        <div class="filter-group ms-auto" style="flex-direction:row;gap:6px;align-items:flex-end;">
            <button class="erp-btn erp-btn-secondary erp-btn-sm" onclick="loadRequests()"><i class="bi bi-funnel me-1"></i>Filter</button>
        </div>
    </div>

    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title"><i class="bi bi-list-ul me-2"></i>Requests</span>
        </div>
        <div id="requestsTableContainer">${erpLoading()}</div>
    </div>

    <!-- Request Detail Modal -->
    <div class="modal fade" id="requestDetailModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content erp-modal">
                <div class="modal-header erp-modal-header">
                    <h6 class="modal-title"><i class="bi bi-file-earmark-text me-2"></i>Request Details</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="requestDetailBody">${erpLoading()}</div>
                <div class="modal-footer erp-modal-footer" id="requestDetailActions"></div>
            </div>
        </div>
    </div>`;

    // Load request types for filter
    const typesData = await apiFetch('/requests/types');
    if (typesData) {
        requestTypes = typesData.types || [];
        const sel = document.getElementById('filterType');
        if (sel) sel.innerHTML = '<option value="">All Types</option>' + requestTypes.map(t => `<option value="${t.id}">${t.type_name}</option>`).join('');
    }

    if (params.status) { const el = document.getElementById('filterStatus'); if (el) el.value = params.status; }
    await loadRequests();
}

async function loadRequests() {
    const status = document.getElementById('filterStatus')?.value || '';
    const type   = document.getElementById('filterType')?.value || '';
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type)   params.set('type', type);
    params.set('limit', '50');

    const container = document.getElementById('requestsTableContainer');
    container.innerHTML = erpLoading();

    const user = getUser();
    const data = await apiFetch(`/requests?${params.toString()}`);
    const requests = data?.requests || [];

    const isStoreOrAdmin = ['admin','store_manager'].includes(user.role);

    if (!requests.length) {
        container.innerHTML = erpEmpty('No requests found');
        return;
    }

    container.innerHTML = `<div class="erp-table-responsive"><table class="erp-table">
        <thead><tr>
            <th>Request No</th>
            ${isStoreOrAdmin ? '<th>Department</th>' : ''}
            <th>Type</th>
            <th>Items</th>
            <th>Status</th>
            <th>Required By</th>
            <th>Submitted</th>
            <th>Actions</th>
        </tr></thead>
        <tbody>
        ${requests.map(r => `<tr>
            <td><span class="request-no-badge">${r.request_no}</span></td>
            ${isStoreOrAdmin ? `<td><strong>${r.dept_name}</strong><br><small class="text-muted">${r.dept_code}</small></td>` : ''}
            <td><span class="erp-badge ${r.type_code === 'EMER' ? 'badge-emergency' : r.type_code === 'PROD' ? 'badge-critical-stock' : 'badge-draft'}">${r.type_name}</span></td>
            <td class="text-center"><span class="erp-badge badge-submitted">${r.item_count}</span></td>
            <td>${statusBadge(r.status)}</td>
            <td>${r.required_by_date ? formatDate(r.required_by_date) : '—'}</td>
            <td>${formatDate(r.created_at, true)}</td>
            <td>${buildRequestActions(r, user)}</td>
        </tr>`).join('')}
        </tbody>
    </table></div>`;
}

function buildRequestActions(r, user) {
    const btns = [];
    btns.push(`<button class="btn-action btn-action-blue" onclick="viewRequest(${r.id})"><i class="bi bi-eye"></i> View</button>`);

    if (r.status === 'Draft' && (r.requested_by === user.id || user.role === 'admin'))
        btns.push(`<button class="btn-action btn-action-green" onclick="submitRequest(${r.id})"><i class="bi bi-send"></i> Submit</button>`);

    if (r.status === 'Submitted' && user.role === 'dept_head')
        btns.push(`<button class="btn-action btn-action-green" onclick="deptAction(${r.id},'approve')"><i class="bi bi-check2"></i> Approve</button>`);

    if (r.status === 'Dept_Approved' && ['admin','store_manager'].includes(user.role))
        btns.push(`<button class="btn-action btn-action-blue" onclick="sendToReview(${r.id})"><i class="bi bi-arrow-right"></i> Store Review</button>`);

    if (r.status === 'Store_Review' && ['admin','store_manager'].includes(user.role))
        btns.push(`<button class="btn-action btn-action-orange" onclick="runAllocation(${r.id})"><i class="bi bi-cpu"></i> Allocate</button>`);

    if (['Allocated','Partially_Allocated'].includes(r.status) && ['admin','store_manager'].includes(user.role))
        btns.push(`<button class="btn-action btn-action-green" onclick="issueMaterial(${r.id})"><i class="bi bi-box-arrow-up"></i> Issue</button>`);

    if (!['Completed','Cancelled','Rejected','Issued'].includes(r.status))
        btns.push(`<button class="btn-action btn-action-red" onclick="cancelRequest(${r.id})"><i class="bi bi-x"></i></button>`);

    return btns.join(' ');
}

// ── VIEW REQUEST ──────────────────────────────────────────────
async function viewRequest(id) {
    const modal = new bootstrap.Modal(document.getElementById('requestDetailModal'));
    document.getElementById('requestDetailBody').innerHTML = erpLoading();
    document.getElementById('requestDetailActions').innerHTML = '';
    modal.show();

    const data = await apiFetch(`/requests/${id}`);
    if (!data) return;
    const r = data.request;
    const items = data.items || [];
    const workflow = data.workflow || [];
    const user = getUser();

    document.getElementById('requestDetailBody').innerHTML = `
    <div class="row">
        <div class="col-md-8">
            <div class="row g-2 mb-3">
                <div class="col-6"><label class="erp-form-label">Request No</label><div><span class="request-no-badge">${r.request_no}</span></div></div>
                <div class="col-6"><label class="erp-form-label">Status</label><div>${statusBadge(r.status)}</div></div>
                <div class="col-6"><label class="erp-form-label">Department</label><div><strong>${r.dept_name}</strong></div></div>
                <div class="col-6"><label class="erp-form-label">Request Type</label><div><strong>${r.type_name}</strong></div></div>
                <div class="col-6"><label class="erp-form-label">Requested By</label><div>${r.requested_by_name} (${r.employee_id})</div></div>
                <div class="col-6"><label class="erp-form-label">Required By</label><div>${r.required_by_date ? formatDate(r.required_by_date) : '—'}</div></div>
                <div class="col-12"><label class="erp-form-label">Justification</label><div class="p-2 bg-light border rounded" style="font-size:.82rem;">${escapeHTML(r.justification) || '—'}</div></div>
            </div>

            <div class="erp-card-header mb-0 rounded-0" style="border-radius:3px 3px 0 0;"><span class="erp-card-title"><i class="bi bi-cart me-1"></i>Requisition Items</span></div>
            <div class="erp-table-responsive" style="border:1px solid var(--border-color);">
                <table class="erp-table mb-0">
                    <thead><tr><th>#</th><th>Material Code</th><th>Material Name</th><th>Category</th><th>Unit</th><th class="text-end">Requested</th><th class="text-end">Allocated</th><th class="text-end">Issued</th><th>Status</th></tr></thead>
                    <tbody>
                    ${items.map((item, i) => `<tr>
                        <td>${i+1}</td>
                        <td style="font-family:monospace;font-size:.75rem;">${item.material_code}</td>
                        <td>${item.material_name}</td>
                        <td><small>${item.category_name}</small></td>
                        <td>${item.unit_of_measure}</td>
                        <td class="text-end fw-bold">${item.requested_quantity}</td>
                        <td class="text-end ${item.allocated_quantity > 0 ? 'text-success' : ''}">${item.allocated_quantity || 0}</td>
                        <td class="text-end ${item.issued_quantity > 0 ? 'text-primary' : ''}">${item.issued_quantity || 0}</td>
                        <td>${statusBadge(item.item_status)}</td>
                    </tr>`).join('')}
                    </tbody>
                </table>
            </div>

            ${r.dept_remarks ? `<div class="mt-3"><label class="erp-form-label">Dept. Remarks</label><div class="p-2 bg-light border rounded" style="font-size:.82rem;">${escapeHTML(r.dept_remarks)}</div></div>` : ''}
            ${r.store_remarks ? `<div class="mt-2"><label class="erp-form-label">Store Remarks</label><div class="p-2 bg-light border rounded" style="font-size:.82rem;">${escapeHTML(r.store_remarks)}</div></div>` : ''}
        </div>
        <div class="col-md-4">
            <div class="erp-card">
                <div class="erp-card-header"><span class="erp-card-title"><i class="bi bi-diagram-3 me-1"></i>Approval Workflow</span></div>
                <div class="erp-card-body p-2">
                    <ul class="workflow-timeline">
                    ${workflow.map(w => `<li class="workflow-step">
                        <div class="workflow-dot ${w.action === 'Approved' ? 'wf-approved' : w.action === 'Rejected' ? 'wf-rejected' : 'wf-pending'}">
                            <i class="bi ${w.action === 'Approved' ? 'bi-check' : w.action === 'Rejected' ? 'bi-x' : 'bi-clock'}"></i>
                        </div>
                        <div class="workflow-content">
                            <div class="workflow-label">${w.step_name}</div>
                            <div class="workflow-meta">
                                ${w.action !== 'Pending' ? `${w.approver_name || '—'} · ${formatDate(w.action_at, true)}` : 'Awaiting action'}
                                ${w.action_remarks ? `<br><em>${escapeHTML(w.action_remarks)}</em>` : ''}
                            </div>
                        </div>
                    </li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    </div>`;

    // Action buttons
    const actions = document.getElementById('requestDetailActions');
    actions.innerHTML = `<button class="btn erp-btn erp-btn-secondary erp-btn-sm" data-bs-dismiss="modal">Close</button>`;

    if (r.status === 'Submitted' && user.role === 'dept_head') {
        actions.innerHTML += `
            <button class="erp-btn erp-btn-danger erp-btn-sm" onclick="deptActionModal(${r.id}, 'reject')"><i class="bi bi-x-circle me-1"></i>Reject</button>
            <button class="erp-btn erp-btn-success erp-btn-sm" onclick="deptActionModal(${r.id}, 'approve')"><i class="bi bi-check-circle me-1"></i>Approve</button>`;
    }
    if (r.status === 'Dept_Approved' && ['admin','store_manager'].includes(user.role)) {
        actions.innerHTML += `<button class="erp-btn erp-btn-primary erp-btn-sm" onclick="sendToReview(${r.id})"><i class="bi bi-arrow-right me-1"></i>Send to Store Review</button>`;
    }
    if (r.status === 'Store_Review' && ['admin','store_manager'].includes(user.role)) {
        actions.innerHTML += `
            <button class="erp-btn erp-btn-danger erp-btn-sm" onclick="storeRejectModal(${r.id})"><i class="bi bi-x-circle me-1"></i>Reject</button>
            <button class="erp-btn erp-btn-warning erp-btn-sm" onclick="runAllocation(${r.id})"><i class="bi bi-cpu me-1"></i>Run Allocation Engine</button>`;
    }
    if (['Allocated','Partially_Allocated'].includes(r.status) && ['admin','store_manager'].includes(user.role)) {
        actions.innerHTML += `<button class="erp-btn erp-btn-success erp-btn-sm" onclick="issueMaterial(${r.id})"><i class="bi bi-box-arrow-up me-1"></i>Issue Material</button>`;
    }
}

// ── ALLOCATION ────────────────────────────────────────────────
async function runAllocation(requestId) {
    const confirmed = await confirmAction('Run the Intelligent Allocation Engine for this request? The engine will compute priority scores and allocate available stock accordingly.');
    if (!confirmed) return;
    try {
        const data = await apiFetch(`/allocations/${requestId}/run`, { method: 'POST' });
        if (!data) return;
        showToast(`Allocation complete. Status: ${data.result?.status}`, 'success', 6000);
        bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'))?.hide();
        await loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

async function issueMaterial(requestId) {
    const confirmed = await confirmAction('Issue all allocated materials? This will deduct stock and generate transaction records.');
    if (!confirmed) return;
    try {
        await apiFetch(`/allocations/${requestId}/issue`, { method: 'POST' });
        showToast('Materials issued successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'))?.hide();
        await loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

async function submitRequest(id) {
    const confirmed = await confirmAction('Submit this request for department head approval?');
    if (!confirmed) return;
    try {
        await apiFetch(`/requests/${id}/submit`, { method: 'PUT' });
        showToast('Request submitted for approval.', 'success');
        loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deptAction(id, action) {
    const confirmed = await confirmAction(`${action === 'approve' ? 'Approve' : 'Reject'} this request?`);
    if (!confirmed) return;
    await deptActionSubmit(id, action, '');
}

async function deptActionModal(id, action) {
    const remarks = prompt(`Enter remarks for ${action}:`);
    if (remarks === null) return;
    await deptActionSubmit(id, action, remarks);
}

async function deptActionSubmit(id, action, remarks) {
    try {
        await apiFetch(`/requests/${id}/dept-action`, { method: 'PUT', body: { action, remarks } });
        showToast(`Request ${action}d.`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'))?.hide();
        loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

async function sendToReview(id) {
    try {
        await apiFetch(`/requests/${id}/store-review`, { method: 'PUT' });
        showToast('Request sent to store review.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'))?.hide();
        loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

async function storeRejectModal(id) {
    const remarks = prompt('Enter rejection remarks:');
    if (!remarks) return;
    try {
        await apiFetch(`/requests/${id}/store-reject`, { method: 'PUT', body: { remarks } });
        showToast('Request rejected.', 'warning');
        bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'))?.hide();
        loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

async function cancelRequest(id) {
    const confirmed = await confirmAction('Cancel this request?');
    if (!confirmed) return;
    try {
        await apiFetch(`/requests/${id}/cancel`, { method: 'PUT' });
        showToast('Request cancelled.', 'info');
        loadRequests();
    } catch (err) { showToast(err.message, 'error'); }
}

// ── NEW REQUISITION (Cart) ────────────────────────────────────
async function renderNewRequest() {
    cart = [];
    const content = document.getElementById('pageContent');
    const [typesData, matsData] = await Promise.all([apiFetch('/requests/types'), apiFetch('/materials?limit=500')]);
    requestTypes = typesData?.types || [];
    allMaterials = matsData?.materials || [];

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-plus-circle-fill"></i>New Material Requisition</h1>
    </div>

    <div class="row g-3">
        <div class="col-md-8">
            <!-- Material Search -->
            <div class="erp-card mb-3">
                <div class="erp-card-header"><span class="erp-card-title"><i class="bi bi-search me-1"></i>Search & Add Materials to Cart</span></div>
                <div class="erp-card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <div class="erp-search-box">
                                <i class="bi bi-search"></i>
                                <input type="text" class="form-control erp-form-control" id="matSearchInput" placeholder="Search by code or name..." oninput="searchMaterialsCart(this.value)">
                            </div>
                        </div>
                    </div>
                    <div id="matSearchResults" style="max-height:250px;overflow-y:auto;border:1px solid var(--border-color);border-radius:3px;"></div>
                </div>
            </div>

            <!-- Cart Items -->
            <div class="erp-card">
                <div class="erp-card-header">
                    <span class="erp-card-title"><i class="bi bi-cart-fill me-1"></i>Requisition Cart</span>
                    <span class="erp-badge badge-submitted" id="cartCount">0 items</span>
                </div>
                <div class="erp-card-body" id="cartBody">
                    <div class="erp-empty" style="padding:20px;"><i class="bi bi-cart"></i><p>No items in cart. Search and add materials above.</p></div>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="erp-card">
                <div class="erp-card-header"><span class="erp-card-title"><i class="bi bi-file-earmark-plus me-1"></i>Requisition Details</span></div>
                <div class="erp-card-body">
                    <div class="mb-3">
                        <label class="erp-form-label">Request Type *</label>
                        <select class="form-select erp-form-control" id="reqType" required>
                            <option value="">Select Request Type</option>
                            ${requestTypes.map(t => `<option value="${t.id}" data-code="${t.type_code}">${t.type_name}</option>`).join('')}
                        </select>
                        <small class="text-muted" id="reqTypeHint"></small>
                    </div>
                    <div class="mb-3">
                        <label class="erp-form-label">Required By Date</label>
                        <input type="date" class="form-control erp-form-control" id="reqDate" min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="mb-3">
                        <label class="erp-form-label">Justification / Reason *</label>
                        <textarea class="form-control erp-form-control" id="reqJustification" rows="4" placeholder="Describe the need for these materials and their purpose..."></textarea>
                    </div>
                    <div class="d-grid gap-2">
                        <button class="erp-btn erp-btn-secondary" onclick="saveDraft()"><i class="bi bi-floppy me-1"></i>Save as Draft</button>
                        <button class="erp-btn erp-btn-primary" onclick="submitNewRequest()"><i class="bi bi-send me-1"></i>Submit for Approval</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('reqType').addEventListener('change', function() {
        const opt = this.options[this.selectedIndex];
        const code = opt.dataset.code;
        const hints = { EMER: '⚠ Emergency — will skip dept head approval and be highest priority.', PROD: 'Production Critical — high priority allocation.', PREV: 'Preventive Maintenance — medium priority.', ROUT: 'Routine — standard processing.', GEN: 'General — lowest priority.' };
        document.getElementById('reqTypeHint').textContent = hints[code] || '';
    });

    // Pre-populate search
    renderMatSearchResults(allMaterials.slice(0, 20));
}

const searchMaterialsCart = debounce((q) => {
    const filtered = q.trim() ? allMaterials.filter(m => m.material_code?.toLowerCase().includes(q.toLowerCase()) || m.material_name?.toLowerCase().includes(q.toLowerCase())) : allMaterials.slice(0, 20);
    renderMatSearchResults(filtered);
}, 250);

function renderMatSearchResults(mats) {
    const el = document.getElementById('matSearchResults');
    if (!el) return;
    if (!mats.length) { el.innerHTML = `<div class="p-3 text-muted text-center" style="font-size:.82rem;">No materials found</div>`; return; }
    el.innerHTML = mats.map(m => {
        const inCart = cart.find(c => c.material_id === m.id);
        const isLow = m.available_stock <= m.reorder_level;
        return `<div class="cart-item" style="cursor:pointer;${inCart ? 'background:#e3f5ea;border-color:#a3d5b3;' : ''}">
            <div class="cart-item-info">
                <div class="cart-item-name">${m.material_name} <small class="text-muted">(${m.material_code})</small></div>
                <div class="cart-item-meta">${m.category_name || ''} · Available: <strong>${m.available_stock} ${m.unit_of_measure}</strong> ${isLow ? '<span class="erp-badge badge-low-stock ms-1">Low Stock</span>' : ''}</div>
            </div>
            ${inCart ? `<span class="erp-badge badge-allocated">In Cart</span>` : `<button class="erp-btn erp-btn-primary erp-btn-xs" onclick='addToCart(${JSON.stringify({id:m.id,material_code:m.material_code,material_name:m.material_name,unit_of_measure:m.unit_of_measure,available_stock:m.available_stock})})'>Add</button>`}
        </div>`;
    }).join('');
}

function addToCart(mat) {
    if (cart.find(c => c.material_id === mat.id)) { showToast('Already in cart', 'info'); return; }
    cart.push({ material_id: mat.id, material_code: mat.material_code, material_name: mat.material_name, unit: mat.unit_of_measure, available: mat.available_stock, qty: 1, remarks: '' });
    renderCart();
    const q = document.getElementById('matSearchInput')?.value || '';
    searchMaterialsCart(q);
}

function removeFromCart(idx) { cart.splice(idx, 1); renderCart(); }

function renderCart() {
    const body = document.getElementById('cartBody');
    const cnt  = document.getElementById('cartCount');
    if (cnt) cnt.textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''}`;
    if (!cart.length) {
        body.innerHTML = `<div class="erp-empty" style="padding:20px;"><i class="bi bi-cart"></i><p>No items in cart.</p></div>`;
        return;
    }
    body.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
        <div class="cart-item-info">
            <div class="cart-item-name">${item.material_name} <small class="text-muted">(${item.material_code})</small></div>
            <div class="cart-item-meta">Available: ${item.available} ${item.unit}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
            <input type="number" class="form-control erp-form-control" style="width:90px;height:30px;font-size:.82rem;" min="1" max="${item.available || 99999}" value="${item.qty}"
                   onchange="cart[${i}].qty = Math.max(1, parseFloat(this.value)||1); renderCart()">
            <span style="font-size:.75rem;color:var(--text-muted);">${item.unit}</span>
            <button class="btn-action btn-action-red" onclick="removeFromCart(${i})"><i class="bi bi-trash"></i></button>
        </div>
    </div>`).join('');
}

async function saveDraft() { await submitRequisition('Draft'); }
async function submitNewRequest() { await submitRequisition('Submit'); }

async function submitRequisition(action) {
    if (!cart.length) { showToast('Please add at least one material to the cart.', 'warning'); return; }
    const typeId = document.getElementById('reqType').value;
    if (!typeId) { showToast('Please select a request type.', 'warning'); return; }
    const justification = document.getElementById('reqJustification').value.trim();
    if (!justification) { showToast('Please enter a justification.', 'warning'); return; }

    const payload = {
        request_type_id: parseInt(typeId),
        justification,
        required_by_date: document.getElementById('reqDate').value || null,
        items: cart.map(c => ({ material_id: c.material_id, requested_quantity: c.qty }))
    };

    try {
        const data = await apiFetch('/requests', { method: 'POST', body: payload });
        if (!data) return;

        if (action === 'Submit') {
            await apiFetch(`/requests/${data.request_id}/submit`, { method: 'PUT' });
        }

        showToast(`Request ${data.request_no} ${action === 'Submit' ? 'submitted' : 'saved as draft'}!`, 'success', 6000);
        cart = [];
        navTo('requests');
    } catch (err) { showToast(err.message, 'error'); }
}
