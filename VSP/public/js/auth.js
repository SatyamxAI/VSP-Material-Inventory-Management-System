// auth.js — Authentication & Session Management
'use strict';

function fillLogin(email) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = 'VSP@2026';
}

function logout() {
    // 1. Clear session immediately so app can't re-read it
    clearSession();
    // 2. Tell server to log the event (fire-and-forget)
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(() => {}); // ignore errors - server may be down
    // 3. Reset UI back to login screen without reload (avoids stale state)
    document.getElementById('appShell').classList.add('d-none');
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').classList.add('d-none');
}

// Show My Profile modal
function showMyProfile() {
    const user = getUser();
    if (!user) return;
    const html = `
    <div class="modal fade" id="profileModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content erp-modal">
                <div class="modal-header erp-modal-header">
                    <h6 class="modal-title"><i class="bi bi-person-circle me-2"></i>My Profile</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="d-flex align-items-center mb-4">
                        <div class="erp-user-avatar me-3" style="width:56px;height:56px;font-size:1.5rem;">${(user.name||'U').charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="fw-700" style="font-size:1.1rem;">${user.name}</div>
                            <div class="text-muted" style="font-size:.82rem;">${user.email}</div>
                            <div class="mt-1">${roleBadge(user.role)}</div>
                        </div>
                    </div>
                    <table class="table table-sm" style="font-size:.85rem;">
                        <tr><td class="text-muted">Employee ID</td><td><strong>${user.employee_id || '—'}</strong></td></tr>
                        <tr><td class="text-muted">Designation</td><td>${user.designation || '—'}</td></tr>
                        <tr><td class="text-muted">Department</td><td>${user.dept_name || 'N/A (Admin/Store)'}</td></tr>
                        <tr><td class="text-muted">Role</td><td>${user.role?.replace(/_/g,' ').toUpperCase()}</td></tr>
                    </table>
                </div>
                <div class="modal-footer erp-modal-footer">
                    <button class="btn erp-btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
                    <button class="btn erp-btn-danger btn-sm" onclick="logout()"><i class="bi bi-box-arrow-left me-2"></i>Sign Out</button>
                </div>
            </div>
        </div>
    </div>`;
    // Remove existing if any
    const existing = document.getElementById('profileModal');
    if (existing) existing.remove();
    document.getElementById('dynamicModals').insertAdjacentHTML('beforeend', html);
    new bootstrap.Modal(document.getElementById('profileModal')).show();
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');
    const btn      = document.getElementById('loginBtn');

    errEl.classList.add('d-none');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';

    try {
        const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
        if (!data) return;
        setToken(data.token);
        setUser(data.user);
        initApp(data.user);
    } catch (err) {
        errEl.textContent = err.message || 'Login failed. Please check your credentials.';
        errEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
    }
});

// Password visibility toggle
const togglePasswordBtn = document.getElementById('togglePassword');
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function () {
        const passInput = document.getElementById('loginPassword');
        const icon = document.getElementById('togglePasswordIcon');
        if (passInput.type === 'password') {
            passInput.type = 'text';
            icon.classList.remove('bi-eye-slash-fill');
            icon.classList.add('bi-eye-fill');
        } else {
            passInput.type = 'password';
            icon.classList.remove('bi-eye-fill');
            icon.classList.add('bi-eye-slash-fill');
        }
    });
}
