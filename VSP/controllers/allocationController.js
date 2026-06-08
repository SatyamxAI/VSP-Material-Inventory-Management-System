// controllers/allocationController.js
const AllocationEngine = require('../services/AllocationEngine');
const db = require('../config/db');
const AuditService = require('../services/AuditService');

// Run allocation engine on a request
exports.allocate = async (req, res) => {
    try {
        const { id } = req.params;
        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [id]);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
        if (!['Store_Review','Dept_Approved'].includes(request.status))
            return res.status(400).json({ success: false, message: `Request status is '${request.status}'. Must be in Store_Review.` });

        const result = await AllocationEngine.processRequest(parseInt(id), req.user.id);
        await AuditService.log({ user: req.user, action: 'ALLOCATE', module: 'Allocations',
            recordId: id, description: `Allocation run for request ${request.request_no} — Status: ${result.status}`, req });
        res.json({ success: true, message: 'Allocation completed.', result });
    } catch (err) {
        console.error('Allocation error:', err);
        res.status(500).json({ success: false, message: err.message || 'Allocation failed.' });
    }
};

// Issue material (after allocation)
exports.issue = async (req, res) => {
    try {
        const { id } = req.params;
        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [id]);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
        if (!['Allocated','Partially_Allocated'].includes(request.status))
            return res.status(400).json({ success: false, message: `Cannot issue. Status is '${request.status}'.` });

        const result = await AllocationEngine.issueMaterial(parseInt(id), req.user.id);
        await AuditService.log({ user: req.user, action: 'ISSUE', module: 'Allocations',
            recordId: id, description: `Material issued for request ${request.request_no}`, req });
        res.json({ success: true, message: 'Material issued successfully.', result });
    } catch (err) {
        console.error('Issue error:', err);
        res.status(500).json({ success: false, message: err.message || 'Issue failed.' });
    }
};

// Get all allocations
exports.getAll = async (req, res) => {
    try {
        const { status, department_id, from, to, page = 1, limit = 20 } = req.query;
        let sql = `SELECT a.*, m.material_code, m.material_name, m.unit_of_measure,
                          d.dept_name, mr.request_no, rt.type_name,
                          u.name as allocated_by_name
                   FROM allocations a
                   JOIN materials m ON a.material_id = m.id
                   JOIN departments d ON a.department_id = d.id
                   JOIN material_requests mr ON a.request_id = mr.id
                   JOIN request_types rt ON mr.request_type_id = rt.id
                   JOIN users u ON a.allocated_by = u.id WHERE 1=1`;
        const params = [];
        if (status) { sql += ` AND a.status = ?`; params.push(status); }
        if (department_id) { sql += ` AND a.department_id = ?`; params.push(department_id); }
        if (from) { sql += ` AND DATE(a.allocated_at) >= ?`; params.push(from); }
        if (to)   { sql += ` AND DATE(a.allocated_at) <= ?`; params.push(to); }
        sql += ` ORDER BY a.allocated_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
        const [rows] = await db.query(sql, params);
        res.json({ success: true, allocations: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Shortage report
exports.shortageReport = async (req, res) => {
    try {
        const data = await AllocationEngine.generateShortageReport();
        res.json({ success: true, data });
    } catch (err) {
        console.error('Shortage report error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
};


// Allocation report
exports.allocationReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const data = await AllocationEngine.generateAllocationReport(from, to);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
