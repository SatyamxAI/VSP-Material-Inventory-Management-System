-- ============================================================
-- VSP Material Inventory Management System
-- Complete Database Schema
-- Vizag Steel Plant — Internal ERP
-- ============================================================

USE vsp_inventory;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS dashboard_metrics;
DROP TABLE IF EXISTS approval_workflow;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS allocations;
DROP TABLE IF EXISTS material_request_items;
DROP TABLE IF EXISTS material_requests;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS material_categories;
DROP TABLE IF EXISTS department_priorities;
DROP TABLE IF EXISTS request_types;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. ROLES
-- ------------------------------------------------------------
CREATE TABLE roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. DEPARTMENTS
-- ------------------------------------------------------------
CREATE TABLE departments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    dept_code       VARCHAR(20) NOT NULL UNIQUE,
    dept_name       VARCHAR(100) NOT NULL,
    dept_head_name  VARCHAR(100),
    location        VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. DEPARTMENT PRIORITIES (for Allocation Engine)
-- ------------------------------------------------------------
CREATE TABLE department_priorities (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    department_id   INT NOT NULL,
    priority_level  INT NOT NULL DEFAULT 3 COMMENT '1=Critical, 2=High, 3=Normal',
    priority_score  DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    reason          VARCHAR(200),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY uq_dept_priority (department_id)
);

-- ------------------------------------------------------------
-- 4. USERS
-- ------------------------------------------------------------
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role_id         INT NOT NULL,
    department_id   INT,
    phone           VARCHAR(20),
    designation     VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ------------------------------------------------------------
-- 5. MATERIAL CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE material_categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_code   VARCHAR(20) NOT NULL UNIQUE,
    category_name   VARCHAR(100) NOT NULL,
    description     VARCHAR(200),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. MATERIALS (Material Master)
-- ------------------------------------------------------------
CREATE TABLE materials (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    material_code       VARCHAR(30) NOT NULL UNIQUE,
    material_name       VARCHAR(200) NOT NULL,
    category_id         INT NOT NULL,
    unit_of_measure     VARCHAR(20) NOT NULL DEFAULT 'Nos',
    storage_location    VARCHAR(100),
    current_stock       DECIMAL(12,3) NOT NULL DEFAULT 0,
    reserved_stock      DECIMAL(12,3) NOT NULL DEFAULT 0,
    available_stock     DECIMAL(12,3) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    safety_stock        DECIMAL(12,3) NOT NULL DEFAULT 0,
    reorder_level       DECIMAL(12,3) NOT NULL DEFAULT 0,
    unit_price          DECIMAL(12,2) DEFAULT 0,
    material_status     ENUM('Active','Inactive','Obsolete') DEFAULT 'Active',
    description         TEXT,
    specifications      TEXT,
    created_by          INT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES material_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 7. REQUEST TYPES
-- ------------------------------------------------------------
CREATE TABLE request_types (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    type_code       VARCHAR(30) NOT NULL UNIQUE,
    type_name       VARCHAR(100) NOT NULL,
    priority_weight DECIMAL(4,2) NOT NULL DEFAULT 1.00 COMMENT 'Multiplier for allocation scoring',
    sla_hours       INT DEFAULT 72 COMMENT 'Expected resolution time in hours',
    requires_dept_head_approval BOOLEAN DEFAULT TRUE,
    description     VARCHAR(200)
);

-- ------------------------------------------------------------
-- 8. MATERIAL REQUESTS (Header)
-- ------------------------------------------------------------
CREATE TABLE material_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    request_no      VARCHAR(30) NOT NULL UNIQUE,
    department_id   INT NOT NULL,
    request_type_id INT NOT NULL,
    requested_by    INT NOT NULL,
    dept_head_id    INT,
    priority_score  DECIMAL(8,4) DEFAULT 0 COMMENT 'Computed by allocation engine',
    status          ENUM(
                        'Draft','Submitted','Dept_Approved','Dept_Rejected',
                        'Store_Review','Allocated','Partially_Allocated',
                        'Waitlisted','Issued','Completed','Rejected','Cancelled'
                    ) DEFAULT 'Draft',
    justification   TEXT,
    remarks         TEXT,
    dept_approved_by   INT,
    dept_approved_at   DATETIME,
    dept_remarks       VARCHAR(500),
    store_reviewed_by  INT,
    store_reviewed_at  DATETIME,
    store_remarks      VARCHAR(500),
    issued_by          INT,
    issued_at          DATETIME,
    completed_at       DATETIME,
    required_by_date   DATE,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (request_type_id) REFERENCES request_types(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (dept_approved_by) REFERENCES users(id),
    FOREIGN KEY (store_reviewed_by) REFERENCES users(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 9. MATERIAL REQUEST ITEMS (Line Items / Cart)
-- ------------------------------------------------------------
CREATE TABLE material_request_items (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    request_id          INT NOT NULL,
    material_id         INT NOT NULL,
    requested_quantity  DECIMAL(12,3) NOT NULL,
    allocated_quantity  DECIMAL(12,3) DEFAULT 0,
    issued_quantity     DECIMAL(12,3) DEFAULT 0,
    item_status         ENUM('Pending','Allocated','Partially_Allocated','Waitlisted','Issued','Rejected') DEFAULT 'Pending',
    item_remarks        VARCHAR(500),
    FOREIGN KEY (request_id) REFERENCES material_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- ------------------------------------------------------------
-- 10. ALLOCATIONS
-- ------------------------------------------------------------
CREATE TABLE allocations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    request_id          INT NOT NULL,
    request_item_id     INT NOT NULL,
    material_id         INT NOT NULL,
    department_id       INT NOT NULL,
    requested_quantity  DECIMAL(12,3) NOT NULL,
    allocated_quantity  DECIMAL(12,3) NOT NULL,
    shortage_quantity   DECIMAL(12,3) DEFAULT 0,
    allocation_type     ENUM('Full','Partial','Waitlisted') NOT NULL,
    allocation_reason   TEXT,
    priority_score_used DECIMAL(8,4),
    allocated_by        INT NOT NULL,
    allocated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('Pending_Issue','Issued','Cancelled') DEFAULT 'Pending_Issue',
    issued_by           INT,
    issued_at           DATETIME,
    FOREIGN KEY (request_id) REFERENCES material_requests(id),
    FOREIGN KEY (request_item_id) REFERENCES material_request_items(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (allocated_by) REFERENCES users(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 11. RESERVATIONS
-- ------------------------------------------------------------
CREATE TABLE reservations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    request_id      INT NOT NULL,
    request_item_id INT NOT NULL,
    material_id     INT NOT NULL,
    department_id   INT NOT NULL,
    reserved_quantity DECIMAL(12,3) NOT NULL,
    reservation_type  ENUM('Approved','Waitlist') DEFAULT 'Approved',
    status          ENUM('Active','Released','Expired','Consumed') DEFAULT 'Active',
    expires_at      DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at     DATETIME,
    released_by     INT,
    FOREIGN KEY (request_id) REFERENCES material_requests(id),
    FOREIGN KEY (request_item_id) REFERENCES material_request_items(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (released_by) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 12. INVENTORY TRANSACTIONS
-- ------------------------------------------------------------
CREATE TABLE inventory_transactions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    transaction_no      VARCHAR(30) NOT NULL UNIQUE,
    transaction_type    ENUM('Issue','Adjustment_In','Adjustment_Out','Return','Opening_Balance') NOT NULL,
    material_id         INT NOT NULL,
    department_id       INT,
    request_id          INT,
    allocation_id       INT,
    quantity            DECIMAL(12,3) NOT NULL,
    stock_before        DECIMAL(12,3) NOT NULL,
    stock_after         DECIMAL(12,3) NOT NULL,
    unit_price          DECIMAL(12,2) DEFAULT 0,
    total_value         DECIMAL(14,2) DEFAULT 0,
    transaction_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
    performed_by        INT NOT NULL,
    remarks             VARCHAR(500),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (request_id) REFERENCES material_requests(id),
    FOREIGN KEY (allocation_id) REFERENCES allocations(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 13. ALERTS
-- ------------------------------------------------------------
CREATE TABLE alerts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    alert_type      ENUM('Low_Stock','Critical_Stock','Emergency_Request','Waitlist','Safety_Stock_Breach','Shortage') NOT NULL,
    severity        ENUM('Warning','Critical','Emergency') DEFAULT 'Warning',
    material_id     INT,
    department_id   INT,
    request_id      INT,
    alert_message   TEXT NOT NULL,
    alert_data      JSON,
    status          ENUM('Active','Acknowledged','Resolved') DEFAULT 'Active',
    acknowledged_by INT,
    acknowledged_at DATETIME,
    resolved_by     INT,
    resolved_at     DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (request_id) REFERENCES material_requests(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 14. APPROVAL WORKFLOW
-- ------------------------------------------------------------
CREATE TABLE approval_workflow (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    request_id      INT NOT NULL,
    step_order      INT NOT NULL,
    step_name       VARCHAR(100) NOT NULL,
    approver_role   VARCHAR(50) NOT NULL,
    approver_id     INT,
    action          ENUM('Pending','Approved','Rejected','Escalated') DEFAULT 'Pending',
    action_remarks  VARCHAR(500),
    action_at       DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES material_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- 15. AUDIT LOGS
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT,
    user_name       VARCHAR(100),
    user_role       VARCHAR(50),
    action          VARCHAR(100) NOT NULL,
    module          VARCHAR(50) NOT NULL,
    record_id       VARCHAR(50),
    record_type     VARCHAR(50),
    old_values      JSON,
    new_values      JSON,
    description     TEXT,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(300),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 16. DASHBOARD METRICS (Cached Aggregates)
-- ------------------------------------------------------------
CREATE TABLE dashboard_metrics (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    metric_name     VARCHAR(100) NOT NULL UNIQUE,
    metric_value    DECIMAL(14,2) DEFAULT 0,
    metric_data     JSON,
    last_updated    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_materials_status ON materials(material_status);
CREATE INDEX idx_materials_stock ON materials(current_stock, reorder_level);
CREATE INDEX idx_requests_status ON material_requests(status);
CREATE INDEX idx_requests_dept ON material_requests(department_id);
CREATE INDEX idx_requests_type ON material_requests(request_type_id);
CREATE INDEX idx_allocations_request ON allocations(request_id);
CREATE INDEX idx_inventory_material ON inventory_transactions(material_id);
CREATE INDEX idx_inventory_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_alerts_status ON alerts(status, severity);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_module ON audit_logs(module, action);
