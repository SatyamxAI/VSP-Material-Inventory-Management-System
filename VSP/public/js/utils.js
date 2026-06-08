// utils.js — Shared Utilities for VSP ERP Frontend
'use strict';

const API_BASE = '/api';

// ── API FETCH ─────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
        method: options.method || 'GET',
        headers: { ...headers, ...(options.headers || {}) },
    };
    if (options.body && config.method !== 'GET') {
        config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    let response;
    try {
        response = await fetch(`${API_BASE}${endpoint}`, config);
    } catch (networkErr) {
        // Server is down or unreachable — clear session if not a login attempt
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout')) {
            clearSession();
            document.getElementById('appShell')?.classList.add('d-none');
            document.getElementById('loginPage')?.classList.remove('d-none');
            showToast('Server unreachable. Please start the server and try again.', 'error', 5000);
        }
        throw networkErr;
    }

    const ct = response.headers.get('content-type') || '';

    if (!ct.includes('application/json')) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout')) {
            logout();
            return null;
        }
        throw new Error(`Server error (${response.status})`);
    }

    const data = await response.json();

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout')) {
        showToast('Session expired. Please log in again.', 'warning');
        setTimeout(logout, 1500);
        return null;
    }
    if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
}

// ── TOKEN MANAGEMENT ──────────────────────────────────────────
function getToken()    { return localStorage.getItem('vsp_token'); }
function setToken(t)   { localStorage.setItem('vsp_token', t); }
function getUser()     { try { return JSON.parse(localStorage.getItem('vsp_user') || 'null'); } catch { return null; } }
function setUser(u)    { localStorage.setItem('vsp_user', JSON.stringify(u)); }
function clearSession(){ localStorage.removeItem('vsp_token'); localStorage.removeItem('vsp_user'); }

// ── TOAST NOTIFICATIONS ───────────────────────────────────────
const TOAST_ICONS = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `erp-toast erp-toast-${type}`;
    toast.innerHTML = `<i class="bi ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

// Global error handlers — placed after showToast is defined
window.addEventListener('error', function(event) {
    console.error('Frontend Error:', event.error);
    showToast('Error: ' + (event.message || 'Unknown error'), 'error', 6000);
});
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    const msg = event.reason && event.reason.message ? event.reason.message : 'Unknown error';
    // Don't show toast for network errors during session restore (handled elsewhere)
    if (!msg.includes('Failed to fetch')) {
        showToast('Error: ' + msg, 'error', 6000);
    }
});

// ── CONFIRM DIALOG ────────────────────────────────────────────
function confirmAction(message) {
    return new Promise(resolve => {
        document.getElementById('confirmMessage').textContent = message;
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
        const btn = document.getElementById('confirmOkBtn');
        let resolved = false;
        const handler = () => { if (!resolved) { resolved = true; modal.hide(); resolve(true); } btn.removeEventListener('click', handler); };
        btn.addEventListener('click', handler);
        document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => { if (!resolved) { resolved = true; resolve(false); } }, { once: true });
    });
}

// ── DATE FORMATTING ───────────────────────────────────────────
function formatDate(val, includeTime = false) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return '—';
    const day   = String(d.getDate()).padStart(2, '0');
    const mon   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    const year  = d.getFullYear();
    if (!includeTime) return `${day}-${mon}-${year}`;
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${day}-${mon}-${year} ${hh}:${mm}`;
}

function formatCurrency(val) {
    if (val === null || val === undefined) return '—';
    return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(val) {
    if (val === null || val === undefined) return '—';
    return parseFloat(val).toLocaleString('en-IN');
}

// ── STATUS BADGE HELPERS ──────────────────────────────────────
const STATUS_MAP = {
    'Draft':              { cls: 'badge-draft',         label: 'Draft' },
    'Submitted':          { cls: 'badge-submitted',     label: 'Submitted' },
    'Dept_Approved':      { cls: 'badge-dept-approved', label: 'Dept. Approved' },
    'Dept_Rejected':      { cls: 'badge-dept-rejected', label: 'Dept. Rejected' },
    'Store_Review':       { cls: 'badge-store-review',  label: 'Store Review' },
    'Allocated':          { cls: 'badge-allocated',     label: 'Allocated' },
    'Partially_Allocated':{ cls: 'badge-partial',       label: 'Partial Alloc.' },
    'Waitlisted':         { cls: 'badge-waitlisted',    label: 'Waitlisted' },
    'Issued':             { cls: 'badge-issued',        label: 'Issued' },
    'Completed':          { cls: 'badge-completed',     label: 'Completed' },
    'Rejected':           { cls: 'badge-rejected',      label: 'Rejected' },
    'Cancelled':          { cls: 'badge-cancelled',     label: 'Cancelled' },
    'Active':             { cls: 'badge-active',        label: 'Active' },
    'Resolved':           { cls: 'badge-resolved',      label: 'Resolved' },
    'Acknowledged':       { cls: 'badge-store-review',  label: 'Acknowledged' },
};

function statusBadge(status) {
    const s = STATUS_MAP[status] || { cls: 'badge-draft', label: status || '—' };
    return `<span class="erp-badge ${s.cls}">${s.label}</span>`;
}

function severityBadge(sev) {
    const map = { 'Emergency': 'badge-emergency', 'Critical': 'badge-critical-stock', 'Warning': 'badge-warning' };
    return `<span class="erp-badge ${map[sev] || 'badge-draft'}">${sev || '—'}</span>`;
}

function stockHealthBadge(status) {
    const map = { 'Zero': 'badge-zero-stock', 'Critical': 'badge-critical-stock', 'Low': 'badge-low-stock', 'OK': 'badge-ok', 'Adequate': 'badge-ok' };
    return `<span class="erp-badge ${map[status] || 'badge-draft'}">${status || '—'}</span>`;
}

function roleBadge(role) {
    const map = {
        'admin': ['badge-submitted', 'Admin'],
        'store_manager': ['badge-allocated', 'Store Manager'],
        'dept_head': ['badge-dept-approved', 'Dept. Head'],
        'dept_user': ['badge-draft', 'Dept. User'],
    };
    const [cls, lbl] = map[role] || ['badge-draft', role || '—'];
    return `<span class="erp-badge ${cls}">${lbl}</span>`;
}

// ── PRIORITY BADGE ────────────────────────────────────────────
function priorityBadge(level) {
    const map = { 1: 'Critical', 2: 'High', 3: 'Normal' };
    const cls = level === 1 ? 'badge-emergency' : level === 2 ? 'badge-store-review' : 'badge-draft';
    return `<span class="erp-badge ${cls}">P${level || 3} — ${map[level || 3]}</span>`;
}

// ── LOADING STATE ─────────────────────────────────────────────
function loadingHtml(rows = 5, cols = 5) {
    return `<tr>${Array(cols).fill('<td><span class="placeholder col-10 rounded"></span></td>').join('')}</tr>`.repeat(rows);
}

function erpLoading() { return `<div class="erp-loading"><div class="erp-spinner"></div></div>`; }

function erpEmpty(msg = 'No records found', icon = 'bi-inbox') {
    return `<div class="erp-empty"><i class="bi ${icon}"></i><p>${msg}</p></div>`;
}

// ── DEBOUNCE ──────────────────────────────────────────────────
function debounce(fn, delay) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ── CLOCK ─────────────────────────────────────────────────────
function startClock() {
    function tick() {
        const el = document.getElementById('erpClock');
        if (!el) return;
        const now = new Date();
        el.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) + '  ' +
                         now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    tick(); setInterval(tick, 1000);
}

// ── TABLE UTILITIES ───────────────────────────────────────────
function buildTable({ headers, rows, emptyMsg = 'No records found' }) {
    if (!rows || rows.length === 0)
        return `<div class="erp-table-responsive"><table class="erp-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody><tr><td colspan="${headers.length}" class="text-center py-4">${erpEmpty(emptyMsg)}</td></tr></tbody></table></div>`;
    return `<div class="erp-table-responsive"><table class="erp-table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody>
    </table></div>`;
}

// ── PAGINATION ────────────────────────────────────────────────
function renderPagination(current, total, onPage) {
    if (total <= 1) return '';
    let btns = '';
    for (let i = 1; i <= total; i++) {
        btns += `<button class="erp-page-btn ${i === current ? 'active' : ''}" onclick="(${onPage})(${i})">${i}</button>`;
    }
    return `<div class="erp-page-btns">${btns}</div>`;
}
