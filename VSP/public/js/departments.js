// departments.js — Departments & Users management
'use strict';

async function renderDepartments() {
    const content = document.getElementById('pageContent');
    const user = getUser();
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-building-fill"></i>Departments</h1>
        <div class="page-title-actions">
            ${user?.role === 'admin' ? `<button class="erp-btn erp-btn-primary erp-btn-sm" onclick="showDeptModal(null)"><i class="bi bi-plus-circle me-1"></i>Add Department</button>` : ''}
        </div>
    </div>
    <div id="deptContent">${erpLoading()}</div>`;
    await loadDepartments();
}

async function loadDepartments() {
    const container = document.getElementById('deptContent');
    if (!container) return;
    const data = await apiFetch('/departments');
    const depts = data?.departments || [];
    const user = getUser();

    container.innerHTML = `<div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title">Department Master (${depts.length})</span></div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr><th>Code</th><th>Department Name</th><th>HOD</th><th>Location</th><th>Priority</th><th>Users</th>${user?.role === 'admin' ? '<th>Actions</th>' : ''}</tr></thead>
            <tbody>
            ${depts.map(d => `<tr>
                <td><strong style="font-family:monospace;">${d.dept_code}</strong></td>
                <td><strong>${d.dept_name}</strong></td>
                <td>${d.dept_head_name || '—'}</td>
                <td><small>${d.location || '—'}</small></td>
                <td>${priorityBadge(d.priority_level)}</td>
                <td><span class="erp-badge badge-submitted">${d.user_count || 0}</span></td>
                ${user?.role === 'admin' ? `<td>
                    <button class="btn-action btn-action-blue" onclick='showDeptModal(${JSON.stringify(d)})'><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn-action btn-action-red" onclick="deleteDept(${d.id}, '${escapeHTML(d.dept_name)}')"><i class="bi bi-trash"></i></button>
                </td>` : ''}
            </tr>`).join('')}
            </tbody>
        </table></div>
    </div>

    <div class="modal fade" id="deptModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content erp-modal">
                <div class="modal-header erp-modal-header">
                    <h6 class="modal-title" id="deptModalTitle"><i class="bi bi-building me-2"></i>Department</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="deptModalBody"></div>
                <div class="modal-footer erp-modal-footer">
                    <button class="erp-btn erp-btn-secondary erp-btn-sm" data-bs-dismiss="modal">Cancel</button>
                    <button class="erp-btn erp-btn-primary erp-btn-sm" onclick="saveDept()"><i class="bi bi-check me-1"></i>Save</button>
                </div>
            </div>
        </div>
    </div>`;
}

function showDeptModal(dept) {
    document.getElementById('deptModalTitle').innerHTML = `<i class="bi bi-building me-2"></i>${dept ? 'Edit Department' : 'Add Department'}`;
    document.getElementById('deptModalBody').innerHTML = `
    <input type="hidden" id="dId" value="${dept?.id || ''}">
    <div class="row g-3">
        <div class="col-4"><label class="erp-form-label">Dept Code *</label>
            <input type="text" class="form-control erp-form-control" id="dCode" value="${dept?.dept_code || ''}" ${dept ? 'readonly' : ''}></div>
        <div class="col-8"><label class="erp-form-label">Department Name *</label>
            <input type="text" class="form-control erp-form-control" id="dName" value="${dept?.dept_name || ''}"></div>
        <div class="col-6"><label class="erp-form-label">Head of Department</label>
            <input type="text" class="form-control erp-form-control" id="dHod" value="${dept?.dept_head_name || ''}"></div>
        <div class="col-6"><label class="erp-form-label">Location</label>
            <input type="text" class="form-control erp-form-control" id="dLoc" value="${dept?.location || ''}"></div>
        <div class="col-6"><label class="erp-form-label">Priority Level</label>
            <select class="form-select erp-form-control" id="dPriority">
                <option value="1" ${dept?.priority_level == 1 ? 'selected' : ''}>P1 — Critical</option>
                <option value="2" ${dept?.priority_level == 2 ? 'selected' : ''}>P2 — High</option>
                <option value="3" ${!dept?.priority_level || dept?.priority_level == 3 ? 'selected' : ''}>P3 — Normal</option>
            </select></div>
        <div class="col-6"><label class="erp-form-label">Priority Score</label>
            <input type="number" class="form-control erp-form-control" id="dScore" value="${dept?.priority_score || 1.0}" step="0.5" min="0.5" max="10"></div>
        ${dept ? `<div class="col-6"><label class="erp-form-label">Status</label>
            <select class="form-select erp-form-control" id="dActive">
                <option value="1" ${dept.is_active ? 'selected' : ''}>Active</option>
                <option value="0" ${!dept.is_active ? 'selected' : ''}>Inactive</option>
            </select></div>` : ''}
    </div>`;
    new bootstrap.Modal(document.getElementById('deptModal')).show();
}

async function saveDept() {
    const id = document.getElementById('dId').value;
    const payload = {
        dept_code:      document.getElementById('dCode').value.trim().toUpperCase(),
        dept_name:      document.getElementById('dName').value.trim(),
        dept_head_name: document.getElementById('dHod').value.trim(),
        location:       document.getElementById('dLoc').value.trim(),
        priority_level: parseInt(document.getElementById('dPriority').value),
        priority_score: parseFloat(document.getElementById('dScore').value),
    };
    const activeEl = document.getElementById('dActive');
    if (activeEl) payload.is_active = parseInt(activeEl.value);

    if (!payload.dept_name) { showToast('Department name is required.', 'error'); return; }
    if (!id && !payload.dept_code) { showToast('Department code is required.', 'error'); return; }

    try {
        if (id) await apiFetch(`/departments/${id}`, { method: 'PUT', body: payload });
        else    await apiFetch('/departments', { method: 'POST', body: payload });
        showToast(`Department ${id ? 'updated' : 'created'} successfully.`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('deptModal'))?.hide();
        await loadDepartments();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteDept(id, name) {
    const confirmed = await confirmAction(`Deactivate department "${name}"? This will hide it from the system.`);
    if (!confirmed) return;
    try {
        await apiFetch(`/departments/${id}`, { method: 'DELETE' });
        showToast('Department deactivated.', 'success');
        await loadDepartments();
    } catch (err) { showToast(err.message, 'error'); }
}

// ─────────────────────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────
async function renderUsers() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `<div class="page-title-bar"><h1 class="page-title"><i class="bi bi-people-fill"></i>User Management</h1>
        <div class="page-title-actions"><button class="erp-btn erp-btn-primary erp-btn-sm" id="addUserBtn" onclick="loadUserPage()"><i class="bi bi-person-plus me-1"></i>Add User</button></div>
    </div>
    <div id="usersContent">${erpLoading()}</div>

    <div class="modal fade" id="userModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content erp-modal">
            <div class="modal-header erp-modal-header"><h6 class="modal-title" id="userModalTitle"><i class="bi bi-person me-2"></i>User</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body" id="userModalBody"></div>
            <div class="modal-footer erp-modal-footer">
                <button class="erp-btn erp-btn-secondary erp-btn-sm" data-bs-dismiss="modal">Cancel</button>
                <button class="erp-btn erp-btn-primary erp-btn-sm" onclick="saveUser()"><i class="bi bi-check me-1"></i>Save</button>
            </div>
        </div></div>
    </div>`;
    await loadUserPage();
}

async function loadUserPage() {
    const container = document.getElementById('usersContent');
    if (!container) return;
    container.innerHTML = erpLoading();
    const [usersData, deptData, rolesData] = await Promise.all([apiFetch('/users'), apiFetch('/departments'), apiFetch('/users/roles')]);
    const users = usersData?.users || [];
    const depts = deptData?.departments || [];
    const roles = rolesData?.roles || [];

    // Store depts/roles for modal usage
    window._userDepts = depts;
    window._userRoles = roles;

    container.innerHTML = `<div class="erp-table-wrapper">
        <div class="erp-table-toolbar"><span class="erp-table-toolbar-title">System Users (${users.length})</span></div>
        <div class="erp-table-responsive"><table class="erp-table">
            <thead><tr><th>Emp ID</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Designation</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
            ${users.map(u => `<tr>
                <td style="font-family:monospace;font-weight:700;">${u.employee_id}</td>
                <td><strong>${u.name}</strong></td>
                <td><small>${u.email}</small></td>
                <td>${roleBadge(u.role_name)}</td>
                <td>${u.dept_name || '—'}</td>
                <td><small>${u.designation || '—'}</small></td>
                <td><span class="erp-badge ${u.is_active ? 'badge-active' : 'badge-rejected'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>${u.last_login ? formatDate(u.last_login, true) : 'Never'}</td>
                <td><button class="btn-action btn-action-blue" onclick='showUserModal(${JSON.stringify(u)})'><i class="bi bi-pencil"></i> Edit</button></td>
            </tr>`).join('')}
            </tbody>
        </table></div>
    </div>`;
}

function showUserModal(user) {
    const depts = window._userDepts || [];
    const roles = window._userRoles || [];
    document.getElementById('userModalTitle').innerHTML = `<i class="bi bi-person me-2"></i>${user ? 'Edit User' : 'Add User'}`;
    document.getElementById('userModalBody').innerHTML = `
    <input type="hidden" id="uId" value="${user?.id || ''}">
    <div class="row g-3">
        <div class="col-md-4"><label class="erp-form-label">Employee ID *</label>
            <input type="text" class="form-control erp-form-control" id="uEmpId" value="${user?.employee_id || ''}" ${user ? 'readonly' : ''}></div>
        <div class="col-md-8"><label class="erp-form-label">Full Name *</label>
            <input type="text" class="form-control erp-form-control" id="uName" value="${user?.name || ''}"></div>
        <div class="col-md-6"><label class="erp-form-label">Email *</label>
            <input type="email" class="form-control erp-form-control" id="uEmail" value="${user?.email || ''}"></div>
        <div class="col-md-6"><label class="erp-form-label">${user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" class="form-control erp-form-control" id="uPass" placeholder="${user ? 'Leave blank to keep current' : 'Enter password'}"></div>
        <div class="col-md-6"><label class="erp-form-label">Role *</label>
            <select class="form-select erp-form-control" id="uRole">
                ${roles.map(r => `<option value="${r.id}" ${user?.role_name === r.role_name ? 'selected' : ''}>${r.role_name.replace(/_/g,' ').toUpperCase()}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="erp-form-label">Department</label>
            <select class="form-select erp-form-control" id="uDept">
                <option value="">None</option>
                ${depts.map(d => `<option value="${d.id}" ${user?.department_id === d.id ? 'selected' : ''}>${d.dept_name}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="erp-form-label">Designation</label>
            <input type="text" class="form-control erp-form-control" id="uDesig" value="${user?.designation || ''}"></div>
        <div class="col-md-3"><label class="erp-form-label">Phone</label>
            <input type="text" class="form-control erp-form-control" id="uPhone" value="${user?.phone || ''}"></div>
        ${user ? `<div class="col-md-3"><label class="erp-form-label">Status</label>
            <select class="form-select erp-form-control" id="uActive">
                <option value="1" ${user.is_active ? 'selected' : ''}>Active</option>
                <option value="0" ${!user.is_active ? 'selected' : ''}>Inactive</option>
            </select></div>` : ''}
    </div>`;
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

async function saveUser() {
    const id = document.getElementById('uId').value;
    const payload = {
        employee_id: document.getElementById('uEmpId').value.trim(),
        name:        document.getElementById('uName').value.trim(),
        email:       document.getElementById('uEmail').value.trim(),
        role_id:     parseInt(document.getElementById('uRole').value),
        department_id: document.getElementById('uDept').value || null,
        designation: document.getElementById('uDesig').value.trim(),
        phone:       document.getElementById('uPhone').value.trim(),
    };
    const pass = document.getElementById('uPass').value;
    if (pass) payload.password = pass;
    // New user must have a password
    if (!id && !payload.password) payload.password = 'VSP@2026';
    const isActive = document.getElementById('uActive');
    if (isActive) payload.is_active = parseInt(isActive.value);

    if (!payload.name || !payload.email) { showToast('Name and email are required.', 'error'); return; }

    try {
        if (id) await apiFetch(`/users/${id}`, { method: 'PUT', body: payload });
        else    await apiFetch('/users', { method: 'POST', body: payload });
        showToast(`User ${id ? 'updated' : 'created'} successfully.`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('userModal'))?.hide();
        await loadUserPage();
    } catch (err) { showToast(err.message, 'error'); }
}
