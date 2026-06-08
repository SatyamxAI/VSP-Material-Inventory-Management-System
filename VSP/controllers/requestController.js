// controllers/requestController.js
const db = require('../config/db');
const AuditService = require('../services/AuditService');

const generateRequestNo = async () => {
    const year = new Date().getFullYear();
    const [[{cnt}]] = await db.query(
        `SELECT COUNT(*) as cnt FROM material_requests WHERE YEAR(created_at) = ?`, [year]
    );
    return `REQ-${year}-${String(cnt + 1).padStart(4, '0')}`;
};

// GET all requests (role-filtered)
exports.getAll = async (req, res) => {
    try {
        const { status, department_id, type, page = 1, limit = 20 } = req.query;
        const user = req.user;
        let sql = `SELECT mr.*, d.dept_name, d.dept_code, rt.type_name, rt.type_code,
                          u.name as requested_by_name, u.employee_id as requested_by_emp,
                          (SELECT COUNT(*) FROM material_request_items WHERE request_id = mr.id) as item_count
                   FROM material_requests mr
                   JOIN departments d ON mr.department_id = d.id
                   JOIN request_types rt ON mr.request_type_id = rt.id
                   JOIN users u ON mr.requested_by = u.id WHERE 1=1`;
        const params = [];

        // Role filtering
        if (user.role === 'dept_user') {
            sql += ` AND mr.requested_by = ?`; params.push(user.id);
        } else if (user.role === 'dept_head') {
            sql += ` AND mr.department_id = ?`; params.push(user.department_id);
        }

        if (status) { sql += ` AND mr.status = ?`; params.push(status); }
        if (department_id) { sql += ` AND mr.department_id = ?`; params.push(department_id); }
        if (type) { sql += ` AND mr.request_type_id = ?`; params.push(type); }

        sql += ` ORDER BY 
                 FIELD(mr.status,'Submitted','Dept_Approved','Store_Review','Allocated','Partially_Allocated','Waitlisted','Draft','Issued','Completed','Rejected','Cancelled'),
                 mr.created_at DESC
                 LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));

        const [rows] = await db.query(sql, params);
        res.json({ success: true, requests: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching requests.' });
    }
};

// GET single request with items
exports.getById = async (req, res) => {
    try {
        const [[request]] = await db.query(
            `SELECT mr.*, d.dept_name, d.dept_code, rt.type_name, rt.type_code, rt.priority_weight,
                    u.name as requested_by_name, u.employee_id,
                    dh.name as dept_head_name,
                    sm.name as store_reviewer_name,
                    iss.name as issued_by_name
             FROM material_requests mr
             JOIN departments d ON mr.department_id = d.id
             JOIN request_types rt ON mr.request_type_id = rt.id
             JOIN users u ON mr.requested_by = u.id
             LEFT JOIN users dh ON mr.dept_approved_by = dh.id
             LEFT JOIN users sm ON mr.store_reviewed_by = sm.id
             LEFT JOIN users iss ON mr.issued_by = iss.id
             WHERE mr.id = ?`, [req.params.id]
        );
        if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

        // Role check
        const user = req.user;
        if (user.role === 'dept_user' && request.requested_by !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const [items] = await db.query(
            `SELECT mri.*, m.material_code, m.material_name, m.unit_of_measure, m.current_stock,
                    m.available_stock, mc.category_name
             FROM material_request_items mri
             JOIN materials m ON mri.material_id = m.id
             JOIN material_categories mc ON m.category_id = mc.id
             WHERE mri.request_id = ?`, [req.params.id]
        );

        const [workflow] = await db.query(
            `SELECT aw.*, u.name as approver_name FROM approval_workflow aw
             LEFT JOIN users u ON aw.approver_id = u.id
             WHERE aw.request_id = ? ORDER BY aw.step_order`, [req.params.id]
        );

        res.json({ success: true, request, items, workflow });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// CREATE request (cart submission)
exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { request_type_id, justification, required_by_date, items } = req.body;
        if (!request_type_id || !items || !items.length) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Request type and at least one item are required.' });
        }

        const [[reqType]] = await conn.query(`SELECT * FROM request_types WHERE id = ?`, [request_type_id]);
        if (!reqType) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Invalid request type.' });
        }

        const requestNo = await generateRequestNo();
        const status = reqType.type_code === 'EMER' ? 'Submitted' : 'Draft';

        const [result] = await conn.query(
            `INSERT INTO material_requests (request_no, department_id, request_type_id, requested_by, status, justification, required_by_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [requestNo, req.user.department_id, request_type_id, req.user.id, status, justification || '', required_by_date || null]
        );
        const requestId = result.insertId;

        for (const item of items) {
            if (!item.material_id || !item.requested_quantity || item.requested_quantity <= 0) continue;
            await conn.query(
                `INSERT INTO material_request_items (request_id, material_id, requested_quantity, item_remarks)
                 VALUES (?, ?, ?, ?)`,
                [requestId, item.material_id, item.requested_quantity, item.remarks || '']
            );
        }

        // Workflow — dept head step
        await conn.query(
            `INSERT INTO approval_workflow (request_id, step_order, step_name, approver_role) VALUES (?, 1, 'Department Head Approval', 'dept_head')`,
            [requestId]
        );
        await conn.query(
            `INSERT INTO approval_workflow (request_id, step_order, step_name, approver_role) VALUES (?, 2, 'Store Manager Review', 'store_manager')`,
            [requestId]
        );

        await conn.commit();

        await AuditService.log({ user: req.user, action: 'CREATE', module: 'Requests',
            recordId: requestId, description: `Created request ${requestNo}`, req });

        res.status(201).json({ success: true, message: `Request ${requestNo} created.`, request_id: requestId, request_no: requestNo });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating request.' });
    } finally {
        conn.release();
    }
};

// SUBMIT draft request
exports.submit = async (req, res) => {
    try {
        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [req.params.id]);
        if (!request) return res.status(404).json({ success: false, message: 'Not found.' });
        if (request.requested_by !== req.user.id)
            return res.status(403).json({ success: false, message: 'Access denied.' });
        if (request.status !== 'Draft')
            return res.status(400).json({ success: false, message: 'Only draft requests can be submitted.' });

        await db.query(`UPDATE material_requests SET status = 'Submitted' WHERE id = ?`, [req.params.id]);
        await AuditService.log({ user: req.user, action: 'SUBMIT', module: 'Requests',
            recordId: req.params.id, description: `Submitted request ${request.request_no}`, req });
        res.json({ success: true, message: 'Request submitted for department head approval.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// DEPT HEAD APPROVAL
exports.deptApprove = async (req, res) => {
    try {
        const { action, remarks } = req.body;
        if (!['approve','reject'].includes(action))
            return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });

        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [req.params.id]);
        if (!request) return res.status(404).json({ success: false, message: 'Not found.' });
        if (request.status !== 'Submitted')
            return res.status(400).json({ success: false, message: 'Request is not in Submitted status.' });
        if (req.user.department_id !== request.department_id)
            return res.status(403).json({ success: false, message: 'You can only approve your department requests.' });

        const newStatus = action === 'approve' ? 'Dept_Approved' : 'Dept_Rejected';
        await db.query(
            `UPDATE material_requests SET status = ?, dept_approved_by = ?, dept_approved_at = NOW(), dept_remarks = ? WHERE id = ?`,
            [newStatus, req.user.id, remarks || '', req.params.id]
        );
        await db.query(
            `UPDATE approval_workflow SET action = ?, approver_id = ?, action_remarks = ?, action_at = NOW()
             WHERE request_id = ? AND step_order = 1`,
            [action === 'approve' ? 'Approved' : 'Rejected', req.user.id, remarks || '', req.params.id]
        );
        await AuditService.log({ user: req.user, action: `DEPT_${action.toUpperCase()}`, module: 'Requests',
            recordId: req.params.id, description: `Dept head ${action}d request ${request.request_no}`, req });
        res.json({ success: true, message: `Request ${action}d by department head.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// STORE MANAGER — Send to Review
exports.sendToStoreReview = async (req, res) => {
    try {
        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [req.params.id]);
        if (!request) return res.status(404).json({ success: false, message: 'Not found.' });
        if (request.status !== 'Dept_Approved')
            return res.status(400).json({ success: false, message: 'Request must be department approved first.' });
        await db.query(`UPDATE material_requests SET status = 'Store_Review' WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Request sent to store review.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// REJECT by store
exports.storeReject = async (req, res) => {
    try {
        const { remarks } = req.body;
        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [req.params.id]);
        if (!request) return res.status(404).json({ success: false, message: 'Not found.' });
        await db.query(
            `UPDATE material_requests SET status = 'Rejected', store_reviewed_by = ?, store_reviewed_at = NOW(), store_remarks = ? WHERE id = ?`,
            [req.user.id, remarks || '', req.params.id]
        );
        await AuditService.log({ user: req.user, action: 'STORE_REJECT', module: 'Requests',
            recordId: req.params.id, description: `Store rejected request ${request.request_no}`, req });
        res.json({ success: true, message: 'Request rejected.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// CANCEL
exports.cancel = async (req, res) => {
    try {
        const [[request]] = await db.query(`SELECT * FROM material_requests WHERE id = ?`, [req.params.id]);
        if (!request) return res.status(404).json({ success: false, message: 'Not found.' });
        if (['Issued','Completed','Cancelled'].includes(request.status))
            return res.status(400).json({ success: false, message: 'Cannot cancel this request.' });
        if (req.user.role === 'dept_user' && request.requested_by !== req.user.id)
            return res.status(403).json({ success: false, message: 'Access denied.' });
        await db.query(`UPDATE material_requests SET status = 'Cancelled' WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Request cancelled.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getRequestTypes = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM request_types ORDER BY priority_weight DESC`);
        res.json({ success: true, types: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
