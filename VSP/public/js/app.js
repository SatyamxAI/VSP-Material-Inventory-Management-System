// app.js — Main Application Controller
'use strict';

// ── SIDEBAR NAVIGATION CONFIG ─────────────────────────────────
const NAV_CONFIG = {
    admin: [
        { section: 'Overview' },
        { id: 'dashboard', icon: 'bi-grid-1x2-fill',   label: 'Dashboard' },
        { section: 'Materials' },
        { id: 'materials',  icon: 'bi-box-seam-fill',   label: 'Material Master' },
        { id: 'inventory',  icon: 'bi-archive-fill',    label: 'Inventory Overview' },
        { id: 'stock-adjust', icon: 'bi-sliders',       label: 'Stock Adjustment' },
        { section: 'Requests & Allocation' },
        { id: 'requests',   icon: 'bi-file-earmark-text-fill', label: 'All Requests' },
        { id: 'allocations', icon: 'bi-diagram-3-fill', label: 'Allocations' },
        { id: 'reservations',icon: 'bi-bookmark-fill',  label: 'Reservations' },
        { id: 'transactions',icon: 'bi-arrow-left-right', label: 'Transactions' },
        { section: 'Administration' },
        { id: 'departments', icon: 'bi-building-fill',  label: 'Departments' },
        { id: 'users',       icon: 'bi-people-fill',    label: 'Users' },
        { id: 'alerts',      icon: 'bi-bell-fill',      label: 'Alerts', badge: true },
        { section: 'Reports' },
        { id: 'reports',     icon: 'bi-bar-chart-fill', label: 'Reports & Analytics' },
        { id: 'audit',       icon: 'bi-clock-history',  label: 'Audit Logs' },
    ],
    store_manager: [
        { section: 'Overview' },
        { id: 'dashboard',   icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
        { section: 'Materials' },
        { id: 'materials',   icon: 'bi-box-seam-fill',        label: 'Material Master' },
        { id: 'inventory',   icon: 'bi-archive-fill',         label: 'Inventory Overview' },
        { id: 'stock-adjust',icon: 'bi-sliders',              label: 'Stock Adjustment' },
        { section: 'Work Queue' },
        { id: 'requests',    icon: 'bi-file-earmark-text-fill', label: 'Requests Queue' },
        { id: 'allocations', icon: 'bi-diagram-3-fill',       label: 'Allocations' },
        { id: 'reservations',icon: 'bi-bookmark-fill',        label: 'Reservations' },
        { id: 'transactions',icon: 'bi-arrow-left-right',     label: 'Transactions' },
        { section: 'Tools' },
        { id: 'alerts',      icon: 'bi-bell-fill',            label: 'Alerts', badge: true },
        { id: 'reports',     icon: 'bi-bar-chart-fill',       label: 'Reports' },
    ],
    dept_head: [
        { section: 'Overview' },
        { id: 'dashboard',   icon: 'bi-grid-1x2-fill',        label: 'Department Dashboard' },
        { section: 'Requests' },
        { id: 'requests',    icon: 'bi-file-earmark-text-fill', label: 'My Department Requests' },
        { id: 'new-request', icon: 'bi-plus-circle-fill',     label: 'New Requisition' },
        { section: 'Catalog' },
        { id: 'materials',   icon: 'bi-box-seam-fill',        label: 'Material Catalog' },
        { id: 'inventory',   icon: 'bi-archive-fill',         label: 'Inventory Status' },
        { section: 'Tools' },
        { id: 'alerts',      icon: 'bi-bell-fill',            label: 'Alerts', badge: true },
        { id: 'reports',     icon: 'bi-bar-chart-fill',       label: 'Reports' },
    ],
    dept_user: [
        { section: 'Overview' },
        { id: 'dashboard',   icon: 'bi-grid-1x2-fill',        label: 'My Dashboard' },
        { section: 'Requests' },
        { id: 'requests',    icon: 'bi-file-earmark-text-fill', label: 'My Requests' },
        { id: 'new-request', icon: 'bi-plus-circle-fill',     label: 'New Requisition' },
        { section: 'Catalog' },
        { id: 'materials',   icon: 'bi-box-seam-fill',        label: 'Material Catalog' },
        { id: 'inventory',   icon: 'bi-archive-fill',         label: 'Inventory Status' },
        { section: 'Info' },
        { id: 'alerts',      icon: 'bi-bell-fill',            label: 'My Alerts', badge: true },
    ],
};

// ── CURRENT PAGE ──────────────────────────────────────────────
let currentPage = '';
let alertInterval = null;

// ── NAVIGATION ────────────────────────────────────────────────
function navTo(page, params = {}) {
    currentPage = page;
    setActiveNav(page);
    setBreadcrumb(page);
    const content = document.getElementById('pageContent');
    content.innerHTML = erpLoading();

    const pageMap = {
        'dashboard':    renderDashboard,
        'materials':    renderMaterials,
        'inventory':    renderInventory,
        'stock-adjust': renderStockAdjust,
        'requests':     renderRequests,
        'new-request':  renderNewRequest,
        'allocations':  renderAllocations,
        'reservations': renderReservations,
        'transactions': renderTransactions,
        'departments':  renderDepartments,
        'users':        renderUsers,
        'alerts':       renderAlerts,
        'reports':      renderReports,
        'audit':        renderAuditLogs,
    };

    const fn = pageMap[page];
    if (fn) {
        Promise.resolve(fn(params)).catch(err => {
            console.error(`Page render error [${page}]:`, err);
            content.innerHTML = `<div class="alert alert-danger m-3"><i class="bi bi-exclamation-triangle me-2"></i>Error loading page: ${escapeHTML(err.message)}</div>`;
        });
    } else {
        content.innerHTML = `<div class="erp-empty"><i class="bi bi-question-circle"></i><p>Page not found: ${page}</p></div>`;
    }
}

// ── SIDEBAR BUILDER ───────────────────────────────────────────
function buildSidebar(role) {
    const config = NAV_CONFIG[role] || NAV_CONFIG['dept_user'];
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = config.map(item => {
        if (item.section) return `<li class="sidebar-nav-section">${item.section}</li>`;
        return `<li>
            <a class="sidebar-nav-item" id="nav-${item.id}" onclick="navTo('${item.id}')" href="javascript:void(0)">
                <i class="bi ${item.icon}"></i>
                <span>${item.label}</span>
                ${item.badge ? `<span class="sidebar-nav-badge d-none" id="navBadge-${item.id}">!</span>` : ''}
            </a>
        </li>`;
    }).join('');
}

function setActiveNav(page) {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`nav-${page}`);
    if (el) el.classList.add('active');
}

// ── BREADCRUMB ────────────────────────────────────────────────
const BREADCRUMB_MAP = {
    'dashboard':    'Dashboard',
    'materials':    'Material Master',
    'inventory':    'Inventory Overview',
    'stock-adjust': 'Stock Adjustment',
    'requests':     'Requests',
    'new-request':  'New Requisition',
    'allocations':  'Allocations',
    'reservations': 'Reservations',
    'transactions': 'Transactions',
    'departments':  'Departments',
    'users':        'User Management',
    'alerts':       'Alerts & Notifications',
    'reports':      'Reports & Analytics',
    'audit':        'Audit Logs',
};
function setBreadcrumb(page) {
    const bc = document.getElementById('erpBreadcrumb');
    if (!bc) return;
    bc.innerHTML = `<span><i class="bi bi-house-fill me-1"></i>Home</span><span class="crumb-sep">›</span><span class="crumb-active">${BREADCRUMB_MAP[page] || page}</span>`;
}

// ── INIT APP ──────────────────────────────────────────────────
let sidebarToggleAttached = false;

function initApp(user) {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('appShell').classList.remove('d-none');

    // Header
    document.getElementById('headerUserName').textContent = user.name;
    document.getElementById('headerUserRole').textContent = (user.role || '').replace(/_/g, ' ').toUpperCase();
    document.getElementById('userAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
    document.getElementById('sidebarEmployeeId').textContent = user.employee_id || user.email;

    const deptEl = document.getElementById('sidebarDeptName');
    if (user.dept_name) {
        deptEl.textContent = user.dept_name;
    } else if (user.role === 'admin') {
        deptEl.textContent = 'System Administration';
    } else if (user.role === 'store_manager') {
        deptEl.textContent = 'Central Stores';
    }

    buildSidebar(user.role);
    startClock();
    loadAlertCount();

    // Sidebar toggle — avoid attaching multiple listeners
    if (!sidebarToggleAttached) {
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('erpSidebar').classList.toggle('collapsed');
            });
            sidebarToggleAttached = true;
        }
    }

    navTo('dashboard');

    // Alert count refresh every minute
    if (alertInterval) clearInterval(alertInterval);
    alertInterval = setInterval(loadAlertCount, 60000);
}

// ── ALERT COUNT ───────────────────────────────────────────────
async function loadAlertCount() {
    try {
        const data = await apiFetch('/alerts?status=Active');
        if (!data) return;
        const count = data.total_active || 0;
        const badge = document.getElementById('alertBadge');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('d-none', count === 0);
        }
        const navBadge = document.getElementById('navBadge-alerts');
        if (navBadge) {
            navBadge.textContent = count;
            navBadge.classList.toggle('d-none', count === 0);
        }
    } catch { /* silent */ }
}

// ── AUTO-RESTORE SESSION ──────────────────────────────────────
(function() {
    const token = getToken();
    const user  = getUser();
    if (token && user) {
        // Verify session with server
        apiFetch('/auth/me').then(data => {
            if (data && data.user) {
                setUser(data.user);
                initApp(data.user);
            } else {
                clearSession();
                // Show login page
                document.getElementById('appShell')?.classList.add('d-none');
                document.getElementById('loginPage')?.classList.remove('d-none');
            }
        }).catch(() => {
            // Network error or server down — clear session
            clearSession();
        });
    }
    // If no token/user, login page is already shown by default (d-none on appShell)
})();
