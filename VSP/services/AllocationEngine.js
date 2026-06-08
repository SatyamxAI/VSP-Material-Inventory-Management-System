// services/AllocationEngine.js
// ============================================================
// VSP Intelligent Material Allocation Engine
// Priority-based allocation: NOT first-come-first-served
// ============================================================

const db = require('../config/db');

class AllocationEngine {

    // ──────────────────────────────────────────────────────────
    // MAIN ENGINE ENTRY POINT
    // ──────────────────────────────────────────────────────────
    async processRequest(requestId, allocatedByUserId) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const request = await this._getRequestWithItems(conn, requestId);
            if (!request) throw new Error('Request not found');

            const results = [];

            for (const item of request.items) {
                const result = await this._allocateItem(conn, request, item, allocatedByUserId);
                results.push(result);
            }

            // Update overall request status
            const allIssued     = results.every(r => r.allocation_type === 'Full');
            const anyPartial    = results.some(r => r.allocation_type === 'Partial');
            const allWaitlisted = results.every(r => r.allocation_type === 'Waitlisted');

            let newStatus = 'Waitlisted';
            if (allIssued)    newStatus = 'Allocated';
            else if (anyPartial || (allIssued || allWaitlisted)) newStatus = 'Partially_Allocated';

            await conn.query(
                `UPDATE material_requests SET status = ?, store_reviewed_at = NOW(), store_reviewed_by = ? WHERE id = ?`,
                [newStatus, allocatedByUserId, requestId]
            );

            await conn.commit();
            return { success: true, request_id: requestId, status: newStatus, items: results };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // ──────────────────────────────────────────────────────────
    // ALLOCATE SINGLE LINE ITEM
    // ──────────────────────────────────────────────────────────
    async _allocateItem(conn, request, item, allocatedByUserId) {
        const material = await this._getMaterialForUpdate(conn, item.material_id);
        const deptPriority = await this._getDeptPriority(conn, request.department_id);
        const requestTypeWeight = parseFloat(request.priority_weight) || 1.0;

        // Compute effective available stock (total - reserved - safety buffer)
        const reservedElsewhere = await this._getOtherReservations(conn, item.material_id, request.id);
        const effectiveAvailable = Math.max(
            0,
            parseFloat(material.current_stock) - parseFloat(reservedElsewhere) - parseFloat(material.safety_stock)
        );

        const requested = parseFloat(item.requested_quantity);

        // Calculate priority score for this request item
        const priorityScore = this._computePriorityScore(
            deptPriority.priority_score,
            requestTypeWeight,
            request.created_at
        );

        let allocationQty = 0;
        let allocationType = 'Waitlisted';
        let shortageQty = requested;

        if (effectiveAvailable <= 0) {
            // No stock — waitlist
            allocationType = 'Waitlisted';
            allocationQty = 0;
        } else if (effectiveAvailable >= requested) {
            // Full allocation
            allocationType = 'Full';
            allocationQty = requested;
            shortageQty = 0;
        } else {
            // Partial allocation — give what's available
            allocationType = 'Partial';
            allocationQty = effectiveAvailable;
            shortageQty = requested - effectiveAvailable;
        }

        // Safety stock breach check — escalate if needed
        const stockAfterAlloc = parseFloat(material.current_stock) - allocationQty;
        const safetyBreach = stockAfterAlloc < parseFloat(material.safety_stock);

        // Insert allocation record
        const [allocResult] = await conn.query(
            `INSERT INTO allocations 
            (request_id, request_item_id, material_id, department_id, requested_quantity, allocated_quantity, 
             shortage_quantity, allocation_type, allocation_reason, priority_score_used, allocated_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending_Issue')`,
            [
                request.id, item.id, item.material_id, request.department_id,
                requested, allocationQty, shortageQty,
                allocationType === 'Full' ? 'Full' : allocationType === 'Partial' ? 'Partial' : 'Waitlisted',
                this._buildAllocationReason(allocationType, deptPriority, requestTypeWeight, effectiveAvailable),
                priorityScore, allocatedByUserId
            ]
        );

        // Update request item status
        const itemStatus = allocationType === 'Full' ? 'Allocated'
                         : allocationType === 'Partial' ? 'Partially_Allocated'
                         : 'Waitlisted';

        await conn.query(
            `UPDATE material_request_items SET item_status = ?, allocated_quantity = ? WHERE id = ?`,
            [itemStatus, allocationQty, item.id]
        );

        // Create/update reservation for allocated quantity
        if (allocationQty > 0) {
            await this._createReservation(conn, {
                request_id:       request.id,
                request_item_id:  item.id,
                material_id:      item.material_id,
                department_id:    request.department_id,
                reserved_quantity: allocationQty,
                reservation_type: 'Approved'
            });

            // Update material reserved_stock
            await conn.query(
                `UPDATE materials SET reserved_stock = reserved_stock + ? WHERE id = ?`,
                [allocationQty, item.material_id]
            );
        }

        // Update request priority_score
        await conn.query(
            `UPDATE material_requests SET priority_score = ? WHERE id = ?`,
            [priorityScore, request.id]
        );

        // Generate alert if safety stock breached
        if (safetyBreach && allocationQty > 0) {
            await this._createSafetyStockAlert(conn, material, stockAfterAlloc);
        }

        // Generate alert if shortage
        if (shortageQty > 0) {
            await this._createShortageAlert(conn, material, request, shortageQty);
        }

        return {
            item_id:           item.id,
            material_id:       item.material_id,
            material_code:     material.material_code,
            material_name:     material.material_name,
            requested_quantity: requested,
            allocated_quantity: allocationQty,
            shortage_quantity:  shortageQty,
            allocation_type:    allocationType,
            priority_score:     priorityScore,
            safety_stock_breach: safetyBreach
        };
    }

    // ──────────────────────────────────────────────────────────
    // PRIORITY SCORE CALCULATION
    // ──────────────────────────────────────────────────────────
    _computePriorityScore(deptScore, requestTypeWeight, createdAt) {
        // Time urgency factor: older requests get slight boost (max 2x over 7 days)
        const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600);
        const ageFactor = Math.min(1 + (ageHours / 168), 2.0); // cap at 2x after 7 days
        return parseFloat((deptScore * requestTypeWeight * ageFactor).toFixed(4));
    }

    _buildAllocationReason(type, deptPriority, reqTypeWeight, available) {
        if (type === 'Full')      return `Full allocation. Dept Priority L${deptPriority.priority_level} (score:${deptPriority.priority_score}), Request weight:${reqTypeWeight}`;
        if (type === 'Partial')   return `Partial allocation. Only ${available} units available after safety stock reserve. Dept Priority L${deptPriority.priority_level}`;
        return `Waitlisted. No stock available after reservations and safety stock. Dept Priority L${deptPriority.priority_level}`;
    }

    // ──────────────────────────────────────────────────────────
    // ISSUE MATERIAL (after allocation)
    // ──────────────────────────────────────────────────────────
    async issueMaterial(requestId, issuedByUserId) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [allocations] = await conn.query(
                `SELECT a.*, m.current_stock, m.reserved_stock, m.material_code, m.material_name, m.unit_price
                 FROM allocations a JOIN materials m ON a.material_id = m.id
                 WHERE a.request_id = ? AND a.status = 'Pending_Issue' AND a.allocated_quantity > 0
                 FOR UPDATE`,
                [requestId]
            );

            if (allocations.length === 0) throw new Error('No pending allocations to issue');

            const txnNums = [];

            for (const alloc of allocations) {
                const stockBefore = parseFloat(alloc.current_stock);
                const qty = parseFloat(alloc.allocated_quantity);
                const stockAfter = stockBefore - qty;

                // Deduct stock
                await conn.query(
                    `UPDATE materials SET current_stock = current_stock - ?, reserved_stock = GREATEST(0, reserved_stock - ?) WHERE id = ?`,
                    [qty, qty, alloc.material_id]
                );

                // Generate transaction number
                const txnNo = `TXN-${Date.now()}-${alloc.material_id}`;
                txnNums.push(txnNo);

                // Insert inventory transaction
                await conn.query(
                    `INSERT INTO inventory_transactions 
                    (transaction_no, transaction_type, material_id, department_id, request_id, allocation_id, 
                     quantity, stock_before, stock_after, unit_price, total_value, performed_by)
                    VALUES (?, 'Issue', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        txnNo, alloc.material_id, alloc.department_id, requestId, alloc.id,
                        qty, stockBefore, stockAfter,
                        alloc.unit_price, (qty * alloc.unit_price).toFixed(2),
                        issuedByUserId
                    ]
                );

                // Update allocation status
                await conn.query(
                    `UPDATE allocations SET status = 'Issued', issued_by = ?, issued_at = NOW() WHERE id = ?`,
                    [issuedByUserId, alloc.id]
                );

                // Update request item issued quantity
                await conn.query(
                    `UPDATE material_request_items SET issued_quantity = allocated_quantity, item_status = 'Issued' WHERE id = ?`,
                    [alloc.request_item_id]
                );

                // Mark reservation consumed
                await conn.query(
                    `UPDATE reservations SET status = 'Consumed' WHERE request_id = ? AND material_id = ? AND status = 'Active'`,
                    [requestId, alloc.material_id]
                );

                // Generate low stock alert if needed
                await this._checkAndGenerateLowStockAlert(conn, alloc.material_id, stockAfter);
            }

            // Close request
            await conn.query(
                `UPDATE material_requests SET status = 'Issued', issued_by = ?, issued_at = NOW() WHERE id = ?`,
                [issuedByUserId, requestId]
            );

            await conn.commit();
            return { success: true, transactions: txnNums };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // ──────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────
    async _getRequestWithItems(conn, requestId) {
        const [[req]] = await conn.query(
            `SELECT mr.*, rt.priority_weight, rt.type_name, d.dept_name
             FROM material_requests mr
             JOIN request_types rt ON mr.request_type_id = rt.id
             JOIN departments d ON mr.department_id = d.id
             WHERE mr.id = ?`, [requestId]
        );
        if (!req) return null;
        const [items] = await conn.query(
            `SELECT mri.*, m.material_code, m.material_name, m.current_stock, m.safety_stock, m.reserved_stock
             FROM material_request_items mri JOIN materials m ON mri.material_id = m.id
             WHERE mri.request_id = ?`, [requestId]
        );
        req.items = items;
        return req;
    }

    async _getMaterialForUpdate(conn, materialId) {
        const [[mat]] = await conn.query(
            `SELECT * FROM materials WHERE id = ? FOR UPDATE`, [materialId]
        );
        return mat;
    }

    async _getDeptPriority(conn, departmentId) {
        const [[dp]] = await conn.query(
            `SELECT * FROM department_priorities WHERE department_id = ?`, [departmentId]
        );
        return dp || { priority_level: 3, priority_score: 1.0 };
    }

    async _getOtherReservations(conn, materialId, excludeRequestId) {
        const [[row]] = await conn.query(
            `SELECT COALESCE(SUM(reserved_quantity), 0) as total
             FROM reservations 
             WHERE material_id = ? AND request_id != ? AND status = 'Active'`,
            [materialId, excludeRequestId]
        );
        return parseFloat(row.total) || 0;
    }

    async _createReservation(conn, data) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
        await conn.query(
            `INSERT INTO reservations (request_id, request_item_id, material_id, department_id, reserved_quantity, reservation_type, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE reserved_quantity = ?, status = 'Active'`,
            [
                data.request_id, data.request_item_id, data.material_id, data.department_id,
                data.reserved_quantity, data.reservation_type, expiresAt,
                data.reserved_quantity
            ]
        );
    }

    async _createSafetyStockAlert(conn, material, stockAfterAlloc) {
        await conn.query(
            `INSERT INTO alerts (alert_type, severity, material_id, alert_message, alert_data)
             VALUES ('Safety_Stock_Breach', 'Critical', ?, ?, ?)
             ON DUPLICATE KEY UPDATE alert_message = VALUES(alert_message), status = 'Active'`,
            [
                material.id,
                `Safety stock breach: ${material.material_name} (${material.material_code}). Stock after allocation: ${stockAfterAlloc} (Safety stock: ${material.safety_stock})`,
                JSON.stringify({ material_id: material.id, stock_after: stockAfterAlloc, safety_stock: material.safety_stock })
            ]
        );
    }

    async _createShortageAlert(conn, material, request, shortageQty) {
        await conn.query(
            `INSERT INTO alerts (alert_type, severity, material_id, department_id, request_id, alert_message, alert_data)
             VALUES ('Shortage', 'Warning', ?, ?, ?, ?, ?)`,
            [
                material.id, request.department_id, request.id,
                `Material shortage: ${shortageQty} units of ${material.material_name} (${material.material_code}) could not be allocated for request ${request.request_no}.`,
                JSON.stringify({ material_id: material.id, shortage: shortageQty, request_no: request.request_no })
            ]
        );
    }

    async _checkAndGenerateLowStockAlert(conn, materialId, currentStock) {
        const [[mat]] = await conn.query(
            `SELECT * FROM materials WHERE id = ?`, [materialId]
        );
        if (!mat) return;

        if (currentStock <= 0) {
            await conn.query(
                `INSERT INTO alerts (alert_type, severity, material_id, alert_message)
                 VALUES ('Critical_Stock', 'Emergency', ?, ?)`,
                [materialId, `ZERO STOCK: ${mat.material_name} (${mat.material_code}) has reached zero stock level!`]
            );
        } else if (currentStock <= mat.safety_stock) {
            await conn.query(
                `INSERT INTO alerts (alert_type, severity, material_id, alert_message)
                 VALUES ('Critical_Stock', 'Critical', ?, ?)`,
                [materialId, `Critical stock: ${mat.material_name} (${mat.material_code}) is below safety stock level. Current: ${currentStock}, Safety: ${mat.safety_stock}`]
            );
        } else if (currentStock <= mat.reorder_level) {
            await conn.query(
                `INSERT INTO alerts (alert_type, severity, material_id, alert_message)
                 VALUES ('Low_Stock', 'Warning', ?, ?)`,
                [materialId, `Low stock: ${mat.material_name} (${mat.material_code}). Current: ${currentStock}, Reorder Level: ${mat.reorder_level}`]
            );
        }
    }

    // ──────────────────────────────────────────────────────────
    // GENERATE SHORTAGE REPORT
    // ──────────────────────────────────────────────────────────
    async generateShortageReport() {
        const [rows] = await db.query(
            `SELECT 
                a.id, mr.request_no, d.dept_name, m.material_code, m.material_name,
                a.requested_quantity, a.allocated_quantity, a.shortage_quantity,
                a.allocation_type, rt.type_name as request_type,
                mr.created_at
             FROM allocations a
             JOIN material_requests mr ON a.request_id = mr.id
             JOIN departments d ON a.department_id = d.id
             JOIN materials m ON a.material_id = m.id
             JOIN request_types rt ON mr.request_type_id = rt.id
             WHERE a.shortage_quantity > 0
             ORDER BY a.allocated_at DESC`
        );
        return rows;
    }


    // ──────────────────────────────────────────────────────────
    // GENERATE ALLOCATION REPORT
    // ──────────────────────────────────────────────────────────
    async generateAllocationReport(fromDate, toDate) {
        const [rows] = await db.query(
            `SELECT 
                d.dept_name, m.material_name, m.material_code,
                SUM(a.allocated_quantity) as total_allocated,
                SUM(a.shortage_quantity) as total_shortage,
                COUNT(a.id) as allocation_count,
                SUM(CASE WHEN a.allocation_type='Full' THEN 1 ELSE 0 END) as full_count,
                SUM(CASE WHEN a.allocation_type='Partial' THEN 1 ELSE 0 END) as partial_count,
                SUM(CASE WHEN a.allocation_type='Waitlisted' THEN 1 ELSE 0 END) as waitlisted_count
             FROM allocations a
             JOIN material_requests mr ON a.request_id = mr.id
             JOIN departments d ON a.department_id = d.id
             JOIN materials m ON a.material_id = m.id
             WHERE a.allocated_at BETWEEN ? AND ?
             GROUP BY d.id, m.id
             ORDER BY d.dept_name, m.material_name`,
            [fromDate || '2000-01-01', toDate || '2099-12-31']
        );
        return rows;
    }
}

module.exports = new AllocationEngine();
