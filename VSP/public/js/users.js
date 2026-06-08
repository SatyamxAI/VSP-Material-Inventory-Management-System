// users.js — User Management (Admin only)
'use strict';

async function renderUsers() {
    const content = document.getElementById('pageContent');
    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-people-fill"></i> User Management</h1>
        <button class="btn erp-btn-primary btn-sm" onclick="showUserModal()">
            <i class="bi bi-plus-circle me-1"></i> Add User
        </button>
    </div>
    <div id="usersContainer">${erpLoading()}</div>`;
    await loadUsers();
}

async function loadUsers() {
    const container = document.getElementById('usersContainer');
    if (!container) return;

    const [usersResp, rolesResp, deptsResp] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/users/roles'),
        apiFetch('/departments')
    ]);

    const users = usersResp?.users || [];
    const roles = rolesResp?.roles || [];
    const depts = deptsResp?.departments || [];

    // Store for modals
    window._allRoles = roles;
    window._allDepts = depts;

    if (!users.length) {
        container.innerHTML = erpEmpty('No users found. Add one to get started.');
        return;
    }

    // Group users by role
    const byRole = {};
    users.forEach(u => {
        const rk = u.role_name || 'other';
        if (!byRole[rk]) byRole[rk] = [];
        byRole[rk].push(u);
    });

    const roleLabels = {
        admin: 'System Administrator',
        store_manager: 'Store Manager',
        dept_head: 'Department Head',
        dept_user: 'Department User'
    };

    container.innerHTML = `
    <div class="row g-3 mb-3">
        <div class="col-md-3">
            <div class="stat-card stat-card-blue">
                <span class="stat-card-label">Total Users</span>
                <div class="stat-card-value">${users.length}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-green">
                <span class="stat-card-label">Active Users</span>
                <div class="stat-card-value">${users.filter(u => u.is_active).length}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-orange">
                <span class="stat-card-label">Departments</span>
                <div class="stat-card-value">${new Set(users.filter(u => u.dept_code).map(u => u.dept_code)).size}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card stat-card-purple">
                <span class="stat-card-label">Roles</span>
                <div class="stat-card-value">${roles.length}</div>
            </div>
        </div>
    </div>
    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title">All System Users</span>
        </div>
        <div class="erp-table-responsive">
            <table class="erp-table">
                <thead>
                    <tr>
                        <th>Emp. ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                ${users.map(u => `
                    <tr>
                        <td style="font-family:monospace;font-size:.78rem;">${u.employee_id}</td>
                        <td><strong>${u.name}</strong></td>
                        <td style="font-size:.78rem;">${u.email}</td>
                        <td>${roleBadge(u.role_name)}</td>
                        <td>${u.dept_name ? `<small>${u.dept_name}</small>` : '<span class="text-muted">—</span>'}</td>
                        <td><small class="text-muted">${u.designation || '—'}</small></td>
                        <td>
                            <span class="erp-badge ${u.is_active ? 'badge-active' : 'badge-rejected'}">
                                ${u.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td style="font-size:.72rem;">${u.last_login ? formatDate(u.last_login, true) : '<span class="text-muted">Never</span>'}</td>
                        <td>
                            <button class="btn btn-sm erp-btn-outline" onclick="showUserModal(${u.id})" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

async function showUserModal(userId) {
    const roles = window._allRoles || [];
    const depts = window._allDepts || [];

    let user = null;
    if (userId) {
        // Fetch user details to pre-fill form
        const all = await apiFetch('/users');
        user = (all?.users || []).find(u => u.id === userId);
    }

    const isEdit = !!user;
    const title = isEdit ? 'Edit User' : 'Add New User';

    const html = `
    <div class="modal fade" id="userModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content erp-modal">
                <div class="modal-header erp-modal-header">
                    <h6 class="modal-title"><i class="bi bi-person-${isEdit ? 'gear' : 'plus'} me-2"></i>${title}</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="userForm">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="erp-form-label">Employee ID *</label>
                                <input type="text" class="form-control erp-form-control" id="uEmpId"
                                    value="${user?.employee_id || ''}" ${isEdit ? 'readonly' : ''} required>
                            </div>
                            <div class="col-md-6">
                                <label class="erp-form-label">Full Name *</label>
                                <input type="text" class="form-control erp-form-control" id="uName"
                                    value="${user?.name || ''}" required>
                            </div>
                            <div class="col-md-12">
                                <label class="erp-form-label">Email *</label>
                                <input type="email" class="form-control erp-form-control" id="uEmail"
                                    value="${user?.email || ''}" required>
                            </div>
                            <div class="col-md-6">
                                <label class="erp-form-label">Password ${isEdit ? '(leave blank to keep)' : '*'}</label>
                                <input type="password" class="form-control erp-form-control" id="uPassword"
                                    placeholder="${isEdit ? 'Leave blank to keep current' : 'Enter password'}" ${isEdit ? '' : 'required'}>
                            </div>
                            <div class="col-md-6">
                                <label class="erp-form-label">Role *</label>
                                <select class="form-select erp-form-control" id="uRole" required>
                                    <option value="">Select Role</option>
                                    ${roles.map(r => `<option value="${r.id}" ${user?.role_name === r.role_name ? 'selected' : ''}>${r.description || r.role_name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="erp-form-label">Department</label>
                                <select class="form-select erp-form-control" id="uDept">
                                    <option value="">None (Admin/Store)</option>
                                    ${depts.map(d => `<option value="${d.id}" ${user?.dept_name === d.dept_name ? 'selected' : ''}>${d.dept_name} (${d.dept_code})</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="erp-form-label">Phone</label>
                                <input type="text" class="form-control erp-form-control" id="uPhone"
                                    value="${user?.phone || ''}">
                            </div>
                            <div class="col-md-12">
                                <label class="erp-form-label">Designation</label>
                                <input type="text" class="form-control erp-form-control" id="uDesig"
                                    value="${user?.designation || ''}">
                            </div>
                            ${isEdit ? `
                            <div class="col-md-12">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="uActive" ${user?.is_active ? 'checked' : ''}>
                                    <label class="form-check-label" for="uActive">Account Active</label>
                                </div>
                            </div>` : ''}
                        </div>
                        <div id="userModalError" class="alert alert-danger mt-3 d-none"></div>
                    </form>
                </div>
                <div class="modal-footer erp-modal-footer">
                    <button class="btn erp-btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn erp-btn-primary btn-sm" onclick="saveUser(${userId || 'null'})">
                        <i class="bi bi-check-circle me-1"></i>${isEdit ? 'Save Changes' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    // Remove old modal if there
    const old = document.getElementById('userModal');
    if (old) old.remove();
    document.getElementById('dynamicModals').insertAdjacentHTML('beforeend', html);
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

async function saveUser(userId) {
    const errEl = document.getElementById('userModalError');
    errEl.classList.add('d-none');

    const body = {
        employee_id: document.getElementById('uEmpId')?.value.trim(),
        name:        document.getElementById('uName')?.value.trim(),
        email:       document.getElementById('uEmail')?.value.trim(),
        password:    document.getElementById('uPassword')?.value,
        role_id:     document.getElementById('uRole')?.value,
        department_id: document.getElementById('uDept')?.value || null,
        phone:       document.getElementById('uPhone')?.value.trim(),
        designation: document.getElementById('uDesig')?.value.trim(),
    };

    if (userId) {
        // Edit mode
        body.is_active = document.getElementById('uActive')?.checked ? 1 : 0;
        if (!body.password) delete body.password; // don't send blank password
    }

    try {
        const url    = userId ? `/users/${userId}` : '/users';
        const method = userId ? 'PUT' : 'POST';
        const resp = await apiFetch(url, { method, body });

        if (!resp || !resp.success) {
            throw new Error(resp?.message || 'Failed to save user.');
        }

        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('userModal'))?.hide();
        showToast(userId ? 'User updated successfully.' : 'User created successfully.', 'success');
        await loadUsers();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('d-none');
    }
}
