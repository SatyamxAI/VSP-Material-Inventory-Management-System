// materials.js — Material Master Module
'use strict';

let allMaterialsCache = [];
let materialCategories = [];
let matPage = 1; const MAT_PER_PAGE = 30;
let matFilter = { search: '', category: '', status: '', low_stock: '' };

async function renderMaterials() {
    const user = getUser();
    const isStoreOrAdmin = ['admin','store_manager'].includes(user?.role);
    const content = document.getElementById('pageContent');
    const [catsData] = await Promise.all([apiFetch('/materials/categories')]);
    materialCategories = catsData?.categories || [];

    content.innerHTML = `
    <div class="page-title-bar">
        <h1 class="page-title"><i class="bi bi-box-seam-fill"></i>Material Master</h1>
        <div class="page-title-actions">
            ${isStoreOrAdmin ? `<button class="erp-btn erp-btn-primary erp-btn-sm" onclick="showMaterialModal()"><i class="bi bi-plus me-1"></i>Add Material</button>` : ''}
        </div>
    </div>

    <div class="erp-filter-row">
        <div class="filter-group" style="flex:1;min-width:180px;">
            <label class="erp-form-label">Search</label>
            <div class="erp-search-box"><i class="bi bi-search"></i>
                <input type="text" class="form-control erp-form-control" id="matSearch" placeholder="Code, name, category..." oninput="applyMatFilter('search',this.value)" style="padding-left:28px;">
            </div>
        </div>
        <div class="filter-group">
            <label class="erp-form-label">Category</label>
            <select class="form-select erp-form-control" id="matCatFilter" style="height:33px;font-size:.8rem;" onchange="applyMatFilter('category',this.value)">
                <option value="">All Categories</option>
                ${materialCategories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join('')}
            </select>
        </div>
        <div class="filter-group">
            <label class="erp-form-label">Status</label>
            <select class="form-select erp-form-control" style="height:33px;font-size:.8rem;" onchange="applyMatFilter('status',this.value)">
                <option value="">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
            </select>
        </div>
        <div class="filter-group">
            <label class="erp-form-label">Stock</label>
            <select class="form-select erp-form-control" style="height:33px;font-size:.8rem;" onchange="applyMatFilter('low_stock',this.value)">
                <option value="">All</option><option value="true">Low Stock Only</option>
            </select>
        </div>
    </div>

    <div class="erp-table-wrapper">
        <div class="erp-table-toolbar">
            <span class="erp-table-toolbar-title"><i class="bi bi-table me-1"></i>Material Catalog</span>
            <span class="text-muted ms-2" id="matRecordCount" style="font-size:.76rem;"></span>
        </div>
        <div id="matTableContainer">${erpLoading()}</div>
        <div class="erp-pagination" id="matPagination"></div>
    </div>

    <!-- Material Modal -->
    <div class="modal fade" id="materialModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content erp-modal">
                <div class="modal-header erp-modal-header">
                    <h6 class="modal-title" id="matModalTitle"><i class="bi bi-box-seam me-2"></i>Material</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="matId">
                    <div class="row g-3">
                        <div class="col-md-4"><label class="erp-form-label">Material Code *</label>
                            <input type="text" class="form-control erp-form-control" id="matCode" placeholder="BRG-001" required></div>
                        <div class="col-md-8"><label class="erp-form-label">Material Name *</label>
                            <input type="text" class="form-control erp-form-control" id="matName" placeholder="Ball Bearing 6205" required></div>
                        <div class="col-md-6"><label class="erp-form-label">Category *</label>
                            <select class="form-select erp-form-control" id="matCategory" required>
                                <option value="">Select Category</option>
                                ${materialCategories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join('')}
                            </select></div>
                        <div class="col-md-3"><label class="erp-form-label">Unit *</label>
                            <select class="form-select erp-form-control" id="matUnit">
                                ${['Nos','Kg','Liters','Meters','Sets','Pairs','Bags','Rolls','Sqm','Length'].map(u => `<option>${u}</option>`).join('')}
                            </select></div>
                        <div class="col-md-3"><label class="erp-form-label">Storage Location</label>
                            <input type="text" class="form-control erp-form-control" id="matLocation" placeholder="R-A1"></div>
                        <div class="col-md-3"><label class="erp-form-label">Current Stock *</label>
                            <input type="number" class="form-control erp-form-control" id="matStock" min="0" value="0" required></div>
                        <div class="col-md-3"><label class="erp-form-label">Safety Stock *</label>
                            <input type="number" class="form-control erp-form-control" id="matSafety" min="0" value="0" required></div>
                        <div class="col-md-3"><label class="erp-form-label">Reorder Level *</label>
                            <input type="number" class="form-control erp-form-control" id="matReorder" min="0" value="0" required></div>
                        <div class="col-md-3"><label class="erp-form-label">Unit Price (₹)</label>
                            <input type="number" class="form-control erp-form-control" id="matPrice" min="0" step="0.01" value="0"></div>
                        <div class="col-12"><label class="erp-form-label">Description</label>
                            <textarea class="form-control erp-form-control" id="matDesc" rows="2"></textarea></div>
                    </div>
                </div>
                <div class="modal-footer erp-modal-footer">
                    <button class="erp-btn erp-btn-secondary erp-btn-sm" data-bs-dismiss="modal">Cancel</button>
                    <button class="erp-btn erp-btn-primary erp-btn-sm" onclick="saveMaterial()"><i class="bi bi-check me-1"></i>Save Material</button>
                </div>
            </div>
        </div>
    </div>`;

    await loadMaterials();
}

const applyMatFilter = debounce(async (key, val) => { matFilter[key] = val; matPage = 1; await loadMaterials(); }, 300);

async function loadMaterials() {
    const params = new URLSearchParams({ limit: '500' });
    if (matFilter.search)   params.set('search', matFilter.search);
    if (matFilter.category) params.set('category', matFilter.category);
    if (matFilter.status)   params.set('status', matFilter.status);
    if (matFilter.low_stock) params.set('low_stock', matFilter.low_stock);

    const container = document.getElementById('matTableContainer');
    if (container) container.innerHTML = erpLoading();

    const data = await apiFetch(`/materials?${params.toString()}`);
    allMaterialsCache = data?.materials || [];

    const cntEl = document.getElementById('matRecordCount');
    if (cntEl) cntEl.textContent = `${allMaterialsCache.length} records`;

    renderMaterialsTable();
}

function renderMaterialsTable() {
    const user = getUser();
    const isAdmin = ['admin','store_manager'].includes(user?.role);
    const container = document.getElementById('matTableContainer');
    if (!container) return;

    const start = (matPage - 1) * MAT_PER_PAGE;
    const page = allMaterialsCache.slice(start, start + MAT_PER_PAGE);
    const totalPages = Math.ceil(allMaterialsCache.length / MAT_PER_PAGE);

    if (!page.length) { container.innerHTML = erpEmpty(); return; }

    container.innerHTML = `<div class="erp-table-responsive"><table class="erp-table">
        <thead><tr>
            <th>Code</th><th>Material Name</th><th>Category</th><th>Unit</th><th>Location</th>
            <th class="text-end">Current Stock</th><th class="text-end">Reserved</th><th class="text-end">Available</th>
            <th class="text-end">Safety</th><th class="text-end">Reorder</th>
            <th>Health</th>${isAdmin ? '<th>Actions</th>' : ''}
        </tr></thead>
        <tbody>
        ${page.map(m => {
            const health = m.current_stock <= 0 ? 'Zero' : m.current_stock <= m.safety_stock ? 'Critical' : m.current_stock <= m.reorder_level ? 'Low' : 'Adequate';
            return `<tr class="${health === 'Zero' ? 'health-zero' : health === 'Critical' ? 'health-critical' : health === 'Low' ? 'health-low' : ''}">
                <td style="font-family:monospace;font-weight:700;font-size:.75rem;">${m.material_code}</td>
                <td><strong>${m.material_name}</strong></td>
                <td><small>${m.category_name}</small></td>
                <td>${m.unit_of_measure}</td>
                <td><small>${m.storage_location || '—'}</small></td>
                <td class="text-end fw-bold">${formatNumber(m.current_stock)}</td>
                <td class="text-end text-warning">${formatNumber(m.reserved_stock)}</td>
                <td class="text-end fw-bold ${parseFloat(m.available_stock) <= 0 ? 'text-danger' : 'text-success'}">${formatNumber(m.available_stock)}</td>
                <td class="text-end">${formatNumber(m.safety_stock)}</td>
                <td class="text-end">${formatNumber(m.reorder_level)}</td>
                <td>${stockHealthBadge(health)}</td>
                ${isAdmin ? `<td>
                    <button class="btn-action btn-action-blue me-1" onclick='showMaterialModal(${JSON.stringify(m)})'><i class="bi bi-pencil"></i></button>
                    <button class="btn-action btn-action-orange" onclick="showAdjustModal(${m.id},'${m.material_name}',${m.current_stock},'${m.unit_of_measure}')"><i class="bi bi-sliders"></i></button>
                </td>` : ''}
            </tr>`;
        }).join('')}
        </tbody>
    </table></div>`;

    const pagination = document.getElementById('matPagination');
    if (pagination) {
        pagination.innerHTML = `<span>${allMaterialsCache.length} total materials</span>${renderPagination(matPage, totalPages, 'matGoPage')}`;
    }
}

window.matGoPage = (p) => { matPage = p; renderMaterialsTable(); };

function showMaterialModal(mat = null) {
    document.getElementById('matId').value = mat?.id || '';
    document.getElementById('matModalTitle').innerHTML = `<i class="bi bi-box-seam me-2"></i>${mat ? 'Edit Material' : 'Add Material'}`;
    document.getElementById('matCode').value     = mat?.material_code || '';
    document.getElementById('matName').value     = mat?.material_name || '';
    document.getElementById('matCategory').value = mat?.category_id || '';
    document.getElementById('matUnit').value     = mat?.unit_of_measure || 'Nos';
    document.getElementById('matLocation').value = mat?.storage_location || '';
    document.getElementById('matStock').value    = mat?.current_stock || 0;
    document.getElementById('matSafety').value   = mat?.safety_stock || 0;
    document.getElementById('matReorder').value  = mat?.reorder_level || 0;
    document.getElementById('matPrice').value    = mat?.unit_price || 0;
    document.getElementById('matDesc').value     = mat?.description || '';
    document.getElementById('matCode').disabled  = !!mat;
    new bootstrap.Modal(document.getElementById('materialModal')).show();
}

async function saveMaterial() {
    const id = document.getElementById('matId').value;
    const payload = {
        material_code:    document.getElementById('matCode').value.trim(),
        material_name:    document.getElementById('matName').value.trim(),
        category_id:      document.getElementById('matCategory').value,
        unit_of_measure:  document.getElementById('matUnit').value,
        storage_location: document.getElementById('matLocation').value.trim(),
        current_stock:    parseFloat(document.getElementById('matStock').value) || 0,
        safety_stock:     parseFloat(document.getElementById('matSafety').value) || 0,
        reorder_level:    parseFloat(document.getElementById('matReorder').value) || 0,
        unit_price:       parseFloat(document.getElementById('matPrice').value) || 0,
        description:      document.getElementById('matDesc').value.trim(),
    };
    try {
        if (id) await apiFetch(`/materials/${id}`, { method: 'PUT', body: payload });
        else     await apiFetch('/materials', { method: 'POST', body: payload });
        showToast(`Material ${id ? 'updated' : 'created'}.`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('materialModal')).hide();
        loadMaterials();
    } catch (err) { showToast(err.message, 'error'); }
}

async function showAdjustModal(id, name, stock, unit) {
    const type = prompt(`Stock Adjustment for: ${name}\nCurrent Stock: ${stock} ${unit}\n\nType: IN / OUT / RETURN`);
    if (!type) return;
    const adjType = type.toUpperCase();
    if (!['IN','OUT','RETURN'].includes(adjType)) { showToast('Invalid type. Use IN, OUT, or RETURN', 'warning'); return; }
    const qty = parseFloat(prompt(`Quantity (${unit}):`));
    if (!qty || qty <= 0) return;
    const remarks = prompt('Remarks (optional):') || '';
    const typeMap = { IN: 'Adjustment_In', OUT: 'Adjustment_Out', RETURN: 'Return' };
    try {
        const res = await apiFetch(`/materials/${id}/adjust`, { method: 'POST', body: { adjustment_type: typeMap[adjType], quantity: qty, remarks } });
        showToast(`Stock adjusted: ${res.stock_before} → ${res.stock_after} ${unit}`, 'success', 6000);
        loadMaterials();
    } catch (err) { showToast(err.message, 'error'); }
}
