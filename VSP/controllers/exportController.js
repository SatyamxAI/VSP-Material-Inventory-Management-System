// controllers/exportController.js
// Handles PDF and Excel exports for VSP reports
const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────────
// Helper: Add VSP header to PDF
// ─────────────────────────────────────────────────
function addPdfHeader(doc, title) {
    doc.fontSize(16).font('Helvetica-Bold')
       .text('RINL - Vizag Steel Plant', { align: 'center' });
    doc.fontSize(12).font('Helvetica')
       .text('Material Inventory Management System', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold')
       .text(title, { align: 'center' });
    doc.fontSize(9).font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);
    // horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
}

// ─────────────────────────────────────────────────
// Helper: Style Excel workbook header row
// ─────────────────────────────────────────────────
function styleHeaderRow(worksheet, cols) {
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A6B' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    });
    headerRow.height = 25;
}

// ─────────────────────────────────────────────────
// Export Stock Status
// ─────────────────────────────────────────────────
async function getStockData() {
    const [rows] = await db.query(`
        SELECT m.material_code, m.material_name, mc.category_name,
               m.unit_of_measure, m.current_stock, m.reserved_stock, m.available_stock,
               m.safety_stock, m.reorder_level, m.unit_price,
               (m.current_stock * m.unit_price) as stock_value,
               CASE
                   WHEN m.current_stock <= 0 THEN 'Zero'
                   WHEN m.current_stock <= m.safety_stock THEN 'Critical'
                   WHEN m.current_stock <= m.reorder_level THEN 'Low'
                   ELSE 'OK'
               END as stock_status
        FROM materials m
        JOIN material_categories mc ON m.category_id = mc.id
        WHERE m.material_status = 'Active'
        ORDER BY FIELD(
            CASE WHEN m.current_stock <= 0 THEN 'Zero'
                 WHEN m.current_stock <= m.safety_stock THEN 'Critical'
                 WHEN m.current_stock <= m.reorder_level THEN 'Low'
                 ELSE 'OK' END, 'Zero','Critical','Low','OK'
        ), m.material_code
    `);
    return rows;
}

// Export stock status to Excel
exports.exportStockExcel = async (req, res) => {
    try {
        const rows = await getStockData();

        const wb = new ExcelJS.Workbook();
        wb.creator = 'VSP ERP';
        wb.created = new Date();

        const ws = wb.addWorksheet('Stock Status');

        // Add title rows
        ws.mergeCells('A1:K1');
        ws.getCell('A1').value = 'RINL - Vizag Steel Plant | Stock Status Report';
        ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1B3A6B' } };
        ws.getCell('A1').alignment = { horizontal: 'center' };

        ws.mergeCells('A2:K2');
        ws.getCell('A2').value = `Generated: ${new Date().toLocaleString('en-IN')}`;
        ws.getCell('A2').alignment = { horizontal: 'center' };
        ws.getCell('A2').font = { size: 9 };

        ws.addRow([]); // blank row

        // Column headers
        ws.columns = [
            { key: 'material_code',  header: 'Material Code',  width: 16 },
            { key: 'material_name',  header: 'Material Name',  width: 30 },
            { key: 'category_name',  header: 'Category',       width: 18 },
            { key: 'unit_of_measure',header: 'UOM',            width: 8  },
            { key: 'current_stock',  header: 'Current Stock',  width: 14 },
            { key: 'reserved_stock', header: 'Reserved',       width: 12 },
            { key: 'available_stock',header: 'Available',      width: 12 },
            { key: 'safety_stock',   header: 'Safety Stock',   width: 14 },
            { key: 'reorder_level',  header: 'Reorder Level',  width: 14 },
            { key: 'stock_value',    header: 'Stock Value (₹)', width: 16 },
            { key: 'stock_status',   header: 'Status',         width: 12 },
        ];

        // Add header row at row 4
        const hRow = ws.insertRow(4, [
            'Material Code','Material Name','Category','UOM',
            'Current Stock','Reserved','Available','Safety Stock','Reorder Level',
            'Stock Value (₹)','Status'
        ]);
        styleHeaderRow(ws, ws.columns);

        // Add data rows
        rows.forEach(row => {
            const dataRow = ws.addRow({
                material_code:  row.material_code,
                material_name:  row.material_name,
                category_name:  row.category_name,
                unit_of_measure:row.unit_of_measure,
                current_stock:  parseFloat(row.current_stock),
                reserved_stock: parseFloat(row.reserved_stock),
                available_stock:parseFloat(row.available_stock),
                safety_stock:   parseFloat(row.safety_stock),
                reorder_level:  parseFloat(row.reorder_level),
                stock_value:    parseFloat(row.stock_value || 0),
                stock_status:   row.stock_status
            });

            // Color-code by status
            const statusColors = { Zero: 'FFFF0000', Critical: 'FFFF4500', Low: 'FFFFA500', OK: 'FF008000' };
            const statusCell = dataRow.getCell(11);
            statusCell.font = { bold: true, color: { argb: statusColors[row.stock_status] || 'FF000000' } };

            // Format currency
            dataRow.getCell(10).numFmt = '₹#,##0.00';
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_StockStatus.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Stock Excel export error:', err);
        res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
    }
};

// Export stock status to PDF
exports.exportStockPdf = async (req, res) => {
    try {
        const rows = await getStockData();

        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_StockStatus.pdf"');
        doc.pipe(res);

        addPdfHeader(doc, 'Stock Status Report');

        // Table headers
        const cols = [
            { label: 'Code',       x: 40,  w: 65  },
            { label: 'Material',   x: 105, w: 160 },
            { label: 'Category',   x: 265, w: 95  },
            { label: 'UOM',        x: 360, w: 35  },
            { label: 'Curr.Stock', x: 395, w: 65  },
            { label: 'Available',  x: 460, w: 60  },
            { label: 'Reorder',    x: 520, w: 55  },
            { label: 'Status',     x: 575, w: 60  },
        ];

        const rowH = 18;
        let y = doc.y;

        // Draw header background
        doc.rect(40, y, 595, rowH).fill('#1B3A6B');
        doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold');
        cols.forEach(c => {
            doc.text(c.label, c.x, y + 4, { width: c.w, align: 'left' });
        });
        y += rowH;
        doc.fillColor('black').font('Helvetica').fontSize(8);

        // Data rows
        rows.forEach((row, i) => {
            if (y > 510) { // new page
                doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
                y = 40;
            }
            const bgColor = i % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
            doc.rect(40, y, 595, rowH).fill(bgColor);

            const statusColors = { Zero: '#CC0000', Critical: '#CC4400', Low: '#BB6600', OK: '#006600' };
            doc.fillColor('#333333');
            doc.text(row.material_code,       cols[0].x, y + 4, { width: cols[0].w });
            doc.text((row.material_name || '').substring(0, 30), cols[1].x, y + 4, { width: cols[1].w });
            doc.text(row.category_name,       cols[2].x, y + 4, { width: cols[2].w });
            doc.text(row.unit_of_measure,     cols[3].x, y + 4, { width: cols[3].w });
            doc.text(parseFloat(row.current_stock).toFixed(0), cols[4].x, y + 4, { width: cols[4].w });
            doc.text(parseFloat(row.available_stock).toFixed(0), cols[5].x, y + 4, { width: cols[5].w });
            doc.text(parseFloat(row.reorder_level).toFixed(0),  cols[6].x, y + 4, { width: cols[6].w });
            doc.fillColor(statusColors[row.stock_status] || '#333333').font('Helvetica-Bold')
               .text(row.stock_status, cols[7].x, y + 4, { width: cols[7].w });
            doc.fillColor('#333333').font('Helvetica');
            y += rowH;
        });

        // Summary
        doc.moveDown(1);
        const total = rows.reduce((s, r) => s + parseFloat(r.stock_value || 0), 0);
        doc.font('Helvetica-Bold').fontSize(10)
           .text(`Total Stock Value: ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40);
        doc.text(`Total Materials: ${rows.length}`, 40);

        doc.end();
    } catch (err) {
        console.error('Stock PDF export error:', err);
        res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
    }
};

// ─────────────────────────────────────────────────
// Export Department Consumption Report
// ─────────────────────────────────────────────────
async function getDeptConsumptionData(from, to) {
    let where = "WHERE it.transaction_type = 'Issue'";
    const params = [];
    if (from && to) { where += ' AND DATE(it.transaction_date) BETWEEN ? AND ?'; params.push(from, to); }
    else if (from)  { where += ' AND DATE(it.transaction_date) >= ?'; params.push(from); }
    else if (to)    { where += ' AND DATE(it.transaction_date) <= ?'; params.push(to); }

    const [rows] = await db.query(`
        SELECT d.dept_name, d.dept_code,
               SUM(it.quantity) as total_qty,
               SUM(it.total_value) as total_value,
               COUNT(DISTINCT it.material_id) as material_types,
               COUNT(*) as transactions
        FROM inventory_transactions it
        JOIN departments d ON it.department_id = d.id
        ${where}
        GROUP BY it.department_id, d.dept_name, d.dept_code
        ORDER BY total_value DESC
    `, params);
    return rows;
}

exports.exportDeptConsumptionExcel = async (req, res) => {
    try {
        const { from, to } = req.query;
        const rows = await getDeptConsumptionData(from, to);

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Dept Consumption');

        ws.mergeCells('A1:F1');
        ws.getCell('A1').value = 'RINL VSP - Department Consumption Report';
        ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1B3A6B' } };
        ws.getCell('A1').alignment = { horizontal: 'center' };
        ws.mergeCells('A2:F2');
        ws.getCell('A2').value = `Period: ${from || 'All'} to ${to || 'All'}   |   Generated: ${new Date().toLocaleString('en-IN')}`;
        ws.getCell('A2').alignment = { horizontal: 'center' };
        ws.getCell('A2').font = { size: 9 };
        ws.addRow([]);

        ws.columns = [
            { key: 'dept_code',       header: 'Dept Code',    width: 12 },
            { key: 'dept_name',       header: 'Department',   width: 28 },
            { key: 'total_qty',       header: 'Total Qty',    width: 14 },
            { key: 'total_value',     header: 'Total Value (₹)', width: 18 },
            { key: 'material_types',  header: 'Material Types', width: 16 },
            { key: 'transactions',    header: 'Transactions',  width: 14 },
        ];

        const hRow = ws.insertRow(4, ['Dept Code','Department','Total Qty','Total Value (₹)','Material Types','Transactions']);
        styleHeaderRow(ws, ws.columns);

        let totalValue = 0;
        rows.forEach(row => {
            ws.addRow({
                dept_code:      row.dept_code,
                dept_name:      row.dept_name,
                total_qty:      parseFloat(row.total_qty),
                total_value:    parseFloat(row.total_value),
                material_types: parseInt(row.material_types),
                transactions:   parseInt(row.transactions),
            });
            totalValue += parseFloat(row.total_value || 0);
        });

        // Total row
        const totalRow = ws.addRow(['', 'TOTAL', null, totalValue, null, null]);
        totalRow.getCell(1).font = { bold: true };
        totalRow.getCell(2).font = { bold: true };
        totalRow.getCell(4).font = { bold: true };
        totalRow.getCell(4).numFmt = '₹#,##0.00';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_DeptConsumption.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Dept consumption Excel error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

exports.exportDeptConsumptionPdf = async (req, res) => {
    try {
        const { from, to } = req.query;
        const rows = await getDeptConsumptionData(from, to);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_DeptConsumption.pdf"');
        doc.pipe(res);

        addPdfHeader(doc, 'Department Consumption Report');
        if (from || to) {
            doc.fontSize(10).text(`Period: ${from || 'All'} to ${to || 'All'}`, { align: 'center' });
            doc.moveDown(0.5);
        }

        const cols = [
            { label: 'Dept Code',    x: 50,  w: 70  },
            { label: 'Department',   x: 120, w: 160 },
            { label: 'Total Qty',    x: 280, w: 70  },
            { label: 'Total Value',  x: 350, w: 100 },
            { label: 'Materials',    x: 450, w: 55  },
            { label: 'Trans.',       x: 505, w: 50  },
        ];

        const rowH = 20;
        let y = doc.y;
        doc.rect(50, y, 495, rowH).fill('#1B3A6B');
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
        cols.forEach(c => doc.text(c.label, c.x, y + 5, { width: c.w }));
        y += rowH;

        let totalValue = 0;
        rows.forEach((row, i) => {
            doc.fillColor(i % 2 === 0 ? '#F5F5F5' : '#FFFFFF').rect(50, y, 495, rowH).fill();
            doc.fillColor('#333').font('Helvetica').fontSize(9);
            doc.text(row.dept_code,   cols[0].x, y + 5, { width: cols[0].w });
            doc.text(row.dept_name,   cols[1].x, y + 5, { width: cols[1].w });
            doc.text(parseFloat(row.total_qty).toFixed(0),   cols[2].x, y + 5, { width: cols[2].w, align: 'right' });
            doc.text('₹' + parseFloat(row.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2 }), cols[3].x, y + 5, { width: cols[3].w, align: 'right' });
            doc.text(row.material_types.toString(), cols[4].x, y + 5, { width: cols[4].w, align: 'center' });
            doc.text(row.transactions.toString(),   cols[5].x, y + 5, { width: cols[5].w, align: 'center' });
            totalValue += parseFloat(row.total_value || 0);
            y += rowH;
        });

        // Total row
        doc.rect(50, y, 495, rowH).fill('#E8EDF5');
        doc.fillColor('#1B3A6B').font('Helvetica-Bold').fontSize(9);
        doc.text('TOTAL', cols[1].x, y + 5, { width: cols[1].w });
        doc.text('₹' + totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }), cols[3].x, y + 5, { width: cols[3].w, align: 'right' });

        doc.end();
    } catch (err) {
        console.error('Dept consumption PDF error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

// ─────────────────────────────────────────────────
// Export Monthly Trend Report (Excel only)
// ─────────────────────────────────────────────────
exports.exportMonthlyTrendExcel = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month_key,
                   DATE_FORMAT(transaction_date, '%b %Y') as month_label,
                   SUM(quantity) as total_qty,
                   SUM(total_value) as total_value,
                   COUNT(*) as transactions
            FROM inventory_transactions
            WHERE transaction_type = 'Issue'
            AND transaction_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month_key, month_label
            ORDER BY month_key
        `);

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Monthly Trend');

        ws.mergeCells('A1:E1');
        ws.getCell('A1').value = 'RINL VSP - Monthly Consumption Trend';
        ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1B3A6B' } };
        ws.getCell('A1').alignment = { horizontal: 'center' };
        ws.addRow([]);

        ws.columns = [
            { key: 'month_label', header: 'Month',          width: 16 },
            { key: 'total_qty',   header: 'Total Qty',      width: 14 },
            { key: 'total_value', header: 'Total Value (₹)', width: 18 },
            { key: 'transactions',header: 'Transactions',   width: 14 },
        ];

        ws.insertRow(3, ['Month', 'Total Qty', 'Total Value (₹)', 'Transactions']);
        styleHeaderRow(ws, ws.columns);

        rows.forEach(row => {
            ws.addRow({
                month_label:  row.month_label,
                total_qty:    parseFloat(row.total_qty),
                total_value:  parseFloat(row.total_value),
                transactions: parseInt(row.transactions),
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_MonthlyTrend.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Monthly trend Excel error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

// ─────────────────────────────────────────────────
// Export Allocation Report (Excel)
// ─────────────────────────────────────────────────
exports.exportAllocationExcel = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.id, mr.request_no, d.dept_name, m.material_code, m.material_name,
                   a.requested_quantity, a.allocated_quantity, a.shortage_quantity,
                   a.allocation_type, a.allocation_reason,
                   DATE_FORMAT(a.allocated_at, '%d-%b-%Y') as alloc_date, a.status
            FROM allocations a
            JOIN material_requests mr ON a.request_id = mr.id
            JOIN departments d ON a.department_id = d.id
            JOIN materials m ON a.material_id = m.id
            ORDER BY a.allocated_at DESC
            LIMIT 500
        `);

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Allocations');

        ws.mergeCells('A1:L1');
        ws.getCell('A1').value = 'RINL VSP - Allocation Report';
        ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1B3A6B' } };
        ws.getCell('A1').alignment = { horizontal: 'center' };
        ws.addRow([]);

        ws.columns = [
            { key: 'id',                 header: '#',                width: 6  },
            { key: 'request_no',         header: 'Request No',       width: 16 },
            { key: 'dept_name',          header: 'Department',       width: 24 },
            { key: 'material_code',      header: 'Mat. Code',        width: 14 },
            { key: 'material_name',      header: 'Material',         width: 28 },
            { key: 'requested_quantity', header: 'Requested',        width: 12 },
            { key: 'allocated_quantity', header: 'Allocated',        width: 12 },
            { key: 'shortage_quantity',  header: 'Shortage',         width: 12 },
            { key: 'allocation_type',    header: 'Type',             width: 12 },
            { key: 'alloc_date',         header: 'Date',             width: 14 },
            { key: 'status',             header: 'Status',           width: 16 },
        ];

        ws.insertRow(3, ['#','Request No','Department','Mat. Code','Material','Requested','Allocated','Shortage','Type','Date','Status']);
        styleHeaderRow(ws, ws.columns);

        rows.forEach(row => {
            ws.addRow({
                id: row.id, request_no: row.request_no, dept_name: row.dept_name,
                material_code: row.material_code, material_name: row.material_name,
                requested_quantity: parseFloat(row.requested_quantity),
                allocated_quantity: parseFloat(row.allocated_quantity),
                shortage_quantity:  parseFloat(row.shortage_quantity),
                allocation_type: row.allocation_type,
                alloc_date: row.alloc_date, status: row.status,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_Allocations.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Allocation Excel error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

// ─────────────────────────────────────────────────
// Export Material Consumption Report (Excel)
// ─────────────────────────────────────────────────
exports.exportMaterialConsumptionExcel = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        let where = "WHERE it.transaction_type = 'Issue'";
        if (from && to) { where += ' AND DATE(it.transaction_date) BETWEEN ? AND ?'; params.push(from, to); }
        else if (from)  { where += ' AND DATE(it.transaction_date) >= ?'; params.push(from); }
        else if (to)    { where += ' AND DATE(it.transaction_date) <= ?'; params.push(to); }

        const [rows] = await db.query(`
            SELECT m.material_code, m.material_name, mc.category_name,
                   SUM(it.quantity) as total_qty, SUM(it.total_value) as total_value,
                   COUNT(*) as transactions, m.unit_of_measure
            FROM inventory_transactions it
            JOIN materials m ON it.material_id = m.id
            JOIN material_categories mc ON m.category_id = mc.id
            ${where}
            GROUP BY it.material_id, m.material_code, m.material_name, mc.category_name, m.unit_of_measure
            ORDER BY total_value DESC
            LIMIT 100
        `, params);

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Material Consumption');

        ws.mergeCells('A1:G1');
        ws.getCell('A1').value = 'RINL VSP - Material Consumption Report';
        ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1B3A6B' } };
        ws.getCell('A1').alignment = { horizontal: 'center' };
        ws.mergeCells('A2:G2');
        ws.getCell('A2').value = `Period: ${from || 'All'} to ${to || 'All'}   |   Generated: ${new Date().toLocaleString('en-IN')}`;
        ws.getCell('A2').alignment = { horizontal: 'center' };
        ws.getCell('A2').font = { size: 9 };
        ws.addRow([]);

        ws.columns = [
            { key: 'material_code',  header: 'Mat. Code',     width: 14 },
            { key: 'material_name',  header: 'Material Name', width: 32 },
            { key: 'category_name',  header: 'Category',      width: 18 },
            { key: 'unit_of_measure',header: 'UOM',           width: 8  },
            { key: 'total_qty',      header: 'Total Qty',     width: 12 },
            { key: 'total_value',    header: 'Total Value (₹)',width: 18 },
            { key: 'transactions',   header: 'Transactions',  width: 14 },
        ];

        ws.insertRow(4, ['Mat. Code','Material Name','Category','UOM','Total Qty','Total Value (₹)','Transactions']);
        styleHeaderRow(ws, ws.columns);

        rows.forEach(row => {
            ws.addRow({
                material_code: row.material_code,
                material_name: row.material_name,
                category_name: row.category_name,
                unit_of_measure: row.unit_of_measure,
                total_qty:    parseFloat(row.total_qty),
                total_value:  parseFloat(row.total_value),
                transactions: parseInt(row.transactions),
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="VSP_MaterialConsumption.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Material consumption Excel error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};
