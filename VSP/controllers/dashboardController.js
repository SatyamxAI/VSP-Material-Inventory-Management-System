// controllers/dashboardController.js
const db = require('../config/db');

exports.getAdminDashboard = async (req, res) => {
    try {
        const [[totals]] = await db.query(`
            SELECT
                COUNT(*) as total_materials,
                SUM(current_stock * unit_price) as inventory_value,
                SUM(CASE WHEN current_stock <= reorder_level THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN current_stock <= safety_stock THEN 1 ELSE 0 END) as critical_stock_count,
                SUM(reserved_stock) as total_reserved
            FROM materials WHERE material_status = 'Active'`);

        const [[reqCounts]] = await db.query(`
            SELECT
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as pending_requests,
                SUM(CASE WHEN status = 'Store_Review' THEN 1 ELSE 0 END) as store_review,
                SUM(CASE WHEN status = 'Partially_Allocated' THEN 1 ELSE 0 END) as partially_allocated,
                SUM(CASE WHEN status = 'Waitlisted' THEN 1 ELSE 0 END) as waitlisted
            FROM material_requests`);

        const [[{emergency_count}]] = await db.query(`
            SELECT COUNT(*) as emergency_count FROM material_requests mr
            JOIN request_types rt ON mr.request_type_id = rt.id
            WHERE rt.type_code = 'EMER' AND mr.status NOT IN ('Completed','Rejected','Cancelled')`);

        const [[{dept_count}]] = await db.query(`SELECT COUNT(*) as dept_count FROM departments WHERE is_active = 1`);

        const [[{alert_count}]] = await db.query(`SELECT COUNT(*) as alert_count FROM alerts WHERE status = 'Active'`);

        // Monthly consumption trend (last 6 months)
        const [monthlyTrend] = await db.query(`
            SELECT DATE_FORMAT(transaction_date, '%b %Y') as month,
                   MONTH(transaction_date) as month_num,
                   YEAR(transaction_date) as year_num,
                   COUNT(*) as transactions,
                   SUM(quantity) as total_qty,
                   SUM(total_value) as total_value
            FROM inventory_transactions
            WHERE transaction_type = 'Issue' AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY YEAR(transaction_date), MONTH(transaction_date), DATE_FORMAT(transaction_date, '%b %Y')
            ORDER BY year_num, month_num`);

        // Top 10 consumed materials
        const [topMaterials] = await db.query(`
            SELECT m.material_code, m.material_name, mc.category_name,
                   SUM(it.quantity) as total_consumed, SUM(it.total_value) as total_value
            FROM inventory_transactions it
            JOIN materials m ON it.material_id = m.id
            JOIN material_categories mc ON m.category_id = mc.id
            WHERE it.transaction_type = 'Issue'
            GROUP BY it.material_id ORDER BY total_consumed DESC LIMIT 10`);

        // Department-wise consumption
        const [deptConsumption] = await db.query(`
            SELECT d.dept_name, d.dept_code,
                   SUM(it.quantity) as total_qty, SUM(it.total_value) as total_value,
                   COUNT(*) as txn_count
            FROM inventory_transactions it
            JOIN departments d ON it.department_id = d.id
            WHERE it.transaction_type = 'Issue'
            GROUP BY it.department_id ORDER BY total_qty DESC`);

        // Recent requests
        const [recentRequests] = await db.query(`
            SELECT mr.request_no, mr.status, d.dept_name, rt.type_name, mr.created_at
            FROM material_requests mr
            JOIN departments d ON mr.department_id = d.id
            JOIN request_types rt ON mr.request_type_id = rt.id
            ORDER BY mr.created_at DESC LIMIT 10`);

        res.json({
            success: true,
            stats: {
                total_materials: totals.total_materials || 0,
                inventory_value: parseFloat(totals.inventory_value || 0).toFixed(2),
                low_stock_count: totals.low_stock_count || 0,
                critical_stock_count: totals.critical_stock_count || 0,
                total_reserved: totals.total_reserved || 0,
                total_departments: dept_count,
                active_alerts: alert_count,
                ...reqCounts,
                emergency_count
            },
            monthly_trend: monthlyTrend,
            top_materials: topMaterials,
            dept_consumption: deptConsumption,
            recent_requests: recentRequests
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ success: false, message: 'Error loading dashboard.' });
    }
};

exports.getStoreDashboard = async (req, res) => {
    try {
        const [[pending]] = await db.query(`
            SELECT
                SUM(CASE WHEN status = 'Dept_Approved' THEN 1 ELSE 0 END) as pending_allocation,
                SUM(CASE WHEN status = 'Store_Review' THEN 1 ELSE 0 END) as in_store_review,
                SUM(CASE WHEN status = 'Allocated' THEN 1 ELSE 0 END) as pending_issue,
                SUM(CASE WHEN status = 'Partially_Allocated' THEN 1 ELSE 0 END) as partially_allocated,
                SUM(CASE WHEN status = 'Waitlisted' THEN 1 ELSE 0 END) as waitlisted
            FROM material_requests WHERE status NOT IN ('Completed','Rejected','Cancelled','Draft')`);

        const [[{emergency}]] = await db.query(`
            SELECT COUNT(*) as emergency FROM material_requests mr JOIN request_types rt ON mr.request_type_id = rt.id
            WHERE rt.type_code = 'EMER' AND mr.status NOT IN ('Issued','Completed','Rejected','Cancelled')`);

        const [[{low_stock}]] = await db.query(
            `SELECT COUNT(*) as low_stock FROM materials WHERE current_stock <= reorder_level AND material_status = 'Active'`);

        const [[{critical_stock}]] = await db.query(
            `SELECT COUNT(*) as critical_stock FROM materials WHERE current_stock <= safety_stock AND material_status = 'Active'`);

        const [pendingRequests] = await db.query(`
            SELECT mr.*, d.dept_name, rt.type_name, u.name as requested_by_name
            FROM material_requests mr JOIN departments d ON mr.department_id = d.id
            JOIN request_types rt ON mr.request_type_id = rt.id JOIN users u ON mr.requested_by = u.id
            WHERE mr.status IN ('Dept_Approved','Store_Review')
            ORDER BY rt.priority_weight DESC, mr.created_at ASC LIMIT 15`);

        const [lowStockItems] = await db.query(`
            SELECT m.*, mc.category_name FROM materials m JOIN material_categories mc ON m.category_id = mc.id
            WHERE m.current_stock <= m.reorder_level AND m.material_status = 'Active'
            ORDER BY (m.current_stock / NULLIF(m.reorder_level,0)) ASC LIMIT 10`);

        res.json({ success: true, stats: { ...pending, emergency, low_stock, critical_stock },
                   pending_requests: pendingRequests, low_stock_items: lowStockItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getDeptDashboard = async (req, res) => {
    try {
        const deptId = req.user.department_id;
        const userId = req.user.id;
        const isHead = req.user.role === 'dept_head';

        const whereUser = isHead ? `mr.department_id = ${deptId}` : `mr.requested_by = ${userId}`;

        const [[stats]] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
                SUM(CASE WHEN status = 'Dept_Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'Allocated' THEN 1 ELSE 0 END) as allocated,
                SUM(CASE WHEN status = 'Partially_Allocated' THEN 1 ELSE 0 END) as partially_allocated,
                SUM(CASE WHEN status = 'Issued' THEN 1 ELSE 0 END) as issued,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
            FROM material_requests mr WHERE ${whereUser}`);

        const [recentRequests] = await db.query(`
            SELECT mr.*, rt.type_name, u.name as requested_by_name
            FROM material_requests mr JOIN request_types rt ON mr.request_type_id = rt.id
            JOIN users u ON mr.requested_by = u.id
            WHERE ${whereUser} ORDER BY mr.created_at DESC LIMIT 10`);

        // Pending approvals for dept head
        let pendingApprovals = [];
        if (isHead) {
            [pendingApprovals] = await db.query(`
                SELECT mr.*, rt.type_name, u.name as requested_by_name
                FROM material_requests mr JOIN request_types rt ON mr.request_type_id = rt.id
                JOIN users u ON mr.requested_by = u.id
                WHERE mr.department_id = ? AND mr.status = 'Submitted'
                ORDER BY rt.priority_weight DESC`, [deptId]);
        }

        res.json({ success: true, stats, recent_requests: recentRequests, pending_approvals: pendingApprovals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
