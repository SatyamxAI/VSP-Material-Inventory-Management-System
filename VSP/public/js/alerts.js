// alerts.js — Alerts & Notifications
'use strict';

let alertFilter = 'Active';

async function renderAlerts() {
    const content = document.getElementById('pageContent');
    const user = getUser();

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-bell-fill"></i>Alerts & Notifications</h1>
        <div class="page-title-actions">
            ${['admin','store_manager'].includes(user?.role) ?
                `<button class="erp-btn erp-btn-secondary erp-btn-sm" onclick="runAlertCheck()"><i class="bi bi-arrow-clockwise me-1"></i>Run Stock Check</button>` : ''}
        </div>
    </div>

    <div class="erp-tab-bar">
        <span class="erp-tab active" id="alert-tab-Active" onclick="switchAlertTab('Active')">Active</span>
        <span class="erp-tab" id="alert-tab-Acknowledged" onclick="switchAlertTab('Acknowledged')">Acknowledged</span>
        <span class="erp-tab" id="alert-tab-Resolved" onclick="switchAlertTab('Resolved')">Resolved</span>
        <span class="erp-tab" id="alert-tab-" onclick="switchAlertTab('')">All</span>
    </div>

    <div id="alertsList">${erpLoading()}</div>`;

    await loadAlerts();
}

async function switchAlertTab(status) {
    alertFilter = status;
    document.querySelectorAll('.erp-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`alert-tab-${status}`)?.classList.add('active');
    await loadAlerts();
}

async function loadAlerts() {
    const el = document.getElementById('alertsList');
    if (!el) return;
    el.innerHTML = erpLoading();
    const params = alertFilter ? `?status=${alertFilter}` : '';
    const data = await apiFetch(`/alerts${params}`);
    const alerts = data?.alerts || [];
    const user = getUser();

    if (!alerts.length) { el.innerHTML = erpEmpty('No alerts found', 'bi-bell-slash'); return; }

    el.innerHTML = alerts.map(a => `
    <div class="alert-card alert-card-${a.severity?.toLowerCase()}">
        <div class="d-flex align-items-start justify-content-between gap-2">
            <div class="flex-1">
                <div class="alert-card-title">
                    ${a.severity === 'Emergency' ? '<i class="bi bi-exclamation-octagon-fill me-2"></i>' : a.severity === 'Critical' ? '<i class="bi bi-exclamation-triangle-fill me-2"></i>' : '<i class="bi bi-info-circle me-2"></i>'}
                    ${a.alert_type?.replace(/_/g,' ')} — ${severityBadge(a.severity)}
                </div>
                <div class="alert-card-body">${a.alert_message}</div>
                <div class="alert-card-meta">
                    ${a.material_name ? `<i class="bi bi-box-seam me-1"></i>${a.material_code} — ${a.material_name}` : ''}
                    ${a.dept_name ? `<i class="bi bi-building ms-2 me-1"></i>${a.dept_name}` : ''}
                    <i class="bi bi-clock ms-2 me-1"></i>${formatDate(a.created_at, true)}
                </div>
            </div>
            <div class="d-flex flex-column gap-1" style="flex-shrink:0;">
                ${statusBadge(a.status)}
                ${a.status === 'Active' ? `<button class="btn-action btn-action-blue mt-1" onclick="acknowledgeAlert(${a.id})"><i class="bi bi-check"></i> Acknowledge</button>` : ''}
                ${a.status !== 'Resolved' && ['admin','store_manager'].includes(user?.role) ? `<button class="btn-action btn-action-green" onclick="resolveAlert(${a.id})"><i class="bi bi-check2-all"></i> Resolve</button>` : ''}
            </div>
        </div>
    </div>`).join('');
}

async function acknowledgeAlert(id) {
    try {
        await apiFetch(`/alerts/${id}/acknowledge`, { method: 'PUT' });
        showToast('Alert acknowledged.', 'success');
        loadAlerts();
        loadAlertCount();
    } catch (err) { showToast(err.message, 'error'); }
}

async function resolveAlert(id) {
    try {
        await apiFetch(`/alerts/${id}/resolve`, { method: 'PUT' });
        showToast('Alert resolved.', 'success');
        loadAlerts();
        loadAlertCount();
    } catch (err) { showToast(err.message, 'error'); }
}

async function runAlertCheck() {
    try {
        await apiFetch('/alerts/run-check', { method: 'POST' });
        showToast('Stock alert check completed.', 'success');
        loadAlerts();
        loadAlertCount();
    } catch (err) { showToast(err.message, 'error'); }
}
