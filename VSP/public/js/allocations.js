// allocations.js — Allocations Management
'use strict';

async function renderAllocations() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-diagram-3-fill"></i>Allocations Management</h1>
        <div class="page-title-actions">
            <button class="erp-btn erp-btn-secondary erp-btn-sm" onclick="viewShortageReport()"><i class="bi bi-exclamation-triangle me-1"></i>Shortage Report</button>
        </div>
    </div>
    <div class="erp-filter-row">
        <div class="filter-group"><label class="erp-form-label">Status</label>
            <select class="form-select erp-form-control" id="allocStatus" style="height:32px;font-size:.8rem;" onchange="loadAllocations()">
                <option value="">All</option><option value="Pending_Issue">Pending Issue</option><option value="Issued">Issued</option>
            </select>
        </div>
        <div class="filter-group"><label class="erp-form-label">From</label>
            <input type="date" class="form-control erp-form-control" id="allocFrom" style="height:32px;" onchange="loadAllocations()">
        </div>
        <div class="filter-group"><label class="erp-form-label">To</label>
            <input type="date" class="form-control erp-form-control" id="allocTo" style="height:32px;" onchange="loadAllocations()">
        </div>
    </div>
    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title"><i class="bi bi-list me-1"></i>Allocation Records</span></div>
        <div id="allocTableContainer">${erpLoading()}</div>
    </div>

    <div class="modal fade" id="shortageModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered"><div class="modal-content erp-modal">
            <div class="modal-header erp-modal-header"><h6 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Material Shortage Report</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body" id="shortageBody">${erpLoading()}</div>
        </div></div>
    </div>`;

    await loadAllocations();
}

async function loadAllocations() {
    const container = document.getElementById('allocTableContainer');
    if (!container) return;
    container.innerHTML = erpLoading();
    const params = new URLSearchParams();
    const status = document.getElementById('allocStatus')?.value;
    const from   = document.getElementById('allocFrom')?.value;
    const to     = document.getElementById('allocTo')?.value;
    if (status) params.set('status', status);
    if (from)   params.set('from', from);
    if (to)     params.set('to', to);

    const data = await apiFetch(`/allocations?${params.toString()}`);
    const allocs = data?.allocations || [];

    if (!allocs.length) { container.innerHTML = erpEmpty(); return; }

    container.innerHTML = `<div class="erp-table-responsive"><table class="erp-table">
        <thead><tr><th>Request No</th><th>Department</th><th>Material</th><th>Type</th>
            <th class="text-end">Requested</th><th class="text-end">Allocated</th><th class="text-end">Shortage</th>
            <th>Alloc. Type</th><th>Status</th><th>Date</th><th>By</th>
        </tr></thead>
        <tbody>
        ${allocs.map(a => `<tr>
            <td><span class="request-no-badge">${a.request_no}</span></td>
            <td>${a.dept_name}</td>
            <td><strong style="font-size:.78rem;">${a.material_name}</strong><br><small class="text-muted">${a.material_code}</small></td>
            <td><small>${a.type_name}</small></td>
            <td class="text-end">${a.requested_quantity} ${a.unit_of_measure}</td>
            <td class="text-end text-success fw-bold">${a.allocated_quantity}</td>
            <td class="text-end ${a.shortage_quantity > 0 ? 'text-danger fw-bold' : ''}">${a.shortage_quantity || 0}</td>
            <td><span class="erp-badge ${a.allocation_type === 'Full' ? 'badge-allocated' : a.allocation_type === 'Partial' ? 'badge-partial' : 'badge-waitlisted'}">${a.allocation_type}</span></td>
            <td>${statusBadge(a.status)}</td>
            <td>${formatDate(a.allocated_at, true)}</td>
            <td><small>${a.allocated_by_name}</small></td>
        </tr>`).join('')}
        </tbody>
    </table></div>`;
}

async function viewShortageReport() {
    const modal = new bootstrap.Modal(document.getElementById('shortageModal'));
    document.getElementById('shortageBody').innerHTML = erpLoading();
    modal.show();
    const data = await apiFetch('/allocations/shortage-report');
    const rows = data?.data || [];
    document.getElementById('shortageBody').innerHTML = rows.length ? `
    <div class="erp-table-responsive"><table class="erp-table">
        <thead><tr><th>Request No</th><th>Department</th><th>Material</th><th>Request Type</th>
            <th class="text-end">Requested</th><th class="text-end">Allocated</th><th class="text-end">Shortage</th><th>Date</th></tr></thead>
        <tbody>${rows.map(r => `<tr>
            <td><span class="request-no-badge">${r.request_no}</span></td>
            <td>${r.dept_name}</td>
            <td>${r.material_name} <small class="text-muted">(${r.material_code})</small></td>
            <td>${r.request_type}</td>
            <td class="text-end">${r.requested_quantity}</td>
            <td class="text-end text-success">${r.allocated_quantity}</td>
            <td class="text-end text-danger fw-bold">${r.shortage_quantity}</td>
            <td>${formatDate(r.created_at)}</td>
        </tr>`).join('')}</tbody>
    </table></div>` : erpEmpty('No shortage records found', 'bi-check-circle');
}
