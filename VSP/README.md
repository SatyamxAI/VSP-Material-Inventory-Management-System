# VSP Material Inventory Management System v2.0
## RINL — Rashtriya Ispat Nigam Limited | Vizag Steel Plant

> Production-grade enterprise ERP for internal material inventory management, intelligent allocation, stock monitoring, and department-wise consumption tracking.

---

## Quick Start

### Step 1: Configure Database
Edit `.env` and set your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=vsp_inventory
```

### Step 2: Setup Database
```bash
npm run db:setup
```
This creates the database, applies the 16-table schema, and inserts all seed data.

### Step 3: Start the Application
```bash
npm start
```

### Step 4: Open in Browser
```
http://localhost:3000
```

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vsp.com | VSP@2024 |
| Store Manager | store@vsp.com | VSP@2024 |
| Dept. Head (BF) | bf.head@vsp.com | VSP@2024 |
| Dept. Head (SMS) | sms.head@vsp.com | VSP@2024 |
| Dept. User (BF) | bf.user@vsp.com | VSP@2024 |
| Dept. User (SMS) | sms.user@vsp.com | VSP@2024 |

---

## System Architecture

```
Frontend:  Vanilla HTML/CSS/JS — Industrial ERP Theme (Navy/Grey)
Backend:   Node.js + Express.js (MVC + Service Layer)
Database:  MySQL (16 normalized tables)
Auth:      JWT + bcryptjs + Role-Based Access Control
Engine:    Intelligent Material Allocation Engine
```

## Modules

| Module | Description |
|--------|-------------|
| Material Master | Complete material catalog with 40+ seed items |
| Material Requisition Cart | Multi-item cart-based requisition system |
| Approval Workflow | Department Head → Store Manager pipeline |
| Allocation Engine | Priority-based intelligent allocation (NOT FCFS) |
| Reservation Engine | Real-time stock reservation tracking |
| Inventory Transactions | Full audit trail of all stock movements |
| Alerts System | Auto-generated low/critical/emergency stock alerts |
| Reports & Analytics | 5 report types with charts |
| Audit Logs | Who did what, when, from where |
| User Management | 4-role RBAC with department binding |

## Intelligent Allocation Engine

The allocation engine uses a **multi-factor priority scoring** algorithm:

```
Priority Score = Department Score × Request Type Weight × Age Factor

Department Priorities:
  P1 (Score 10): Blast Furnace, Steel Melting Shop, Power Plant
  P2 (Score 5-6): Rolling Mill, Mechanical, Electrical Maintenance
  P3 (Score 2-4): Utilities, Quality Control, Administration

Request Type Weights:
  Emergency Breakdown:    5.0x
  Production Critical:    4.0x
  Preventive Maintenance: 3.0x
  Routine Maintenance:    2.0x
  General Usage:          1.0x

Age Factor: Older requests get up to 2x boost after 7 days
```

**Allocation Decisions:**
- **Full Allocation**: Stock >= Requested Quantity
- **Partial Allocation**: Stock < Requested (gives what's available)
- **Waitlist**: No stock available after safety stock reservation

## Request Workflow

```
Department User → Create Cart → Submit
  ↓
Department Head → Review → Approve/Reject
  ↓
Store Manager → Review → Run Allocation Engine
  ↓
Allocation Engine → Full / Partial / Waitlist
  ↓
Store Manager → Issue Material
  ↓
Inventory Updated + Transactions Recorded
```

## Database Schema (16 Tables)

| Table | Purpose |
|-------|---------|
| roles | System roles |
| departments | 10 VSP departments |
| department_priorities | Allocation priority scores |
| users | All system users |
| material_categories | 15 material categories |
| materials | 40+ materials with stock tracking |
| request_types | 5 request types with priority weights |
| material_requests | Request headers (cart) |
| material_request_items | Line items per request |
| allocations | Allocation decisions with scores |
| reservations | Active stock reservations |
| inventory_transactions | All stock movements |
| alerts | Stock alerts and notifications |
| approval_workflow | Step-by-step approval trail |
| audit_logs | Complete activity audit trail |
| dashboard_metrics | Cached aggregates |

## Folder Structure

```
VSP/
├── config/
│   └── db.js                    # MySQL connection pool
├── controllers/
│   ├── authController.js        # Login, logout, me
│   ├── materialController.js    # Material CRUD + stock adjustment
│   ├── requestController.js     # Full request workflow
│   ├── allocationController.js  # Run allocation engine, issue
│   ├── dashboardController.js   # Role-aware dashboards
│   ├── departmentController.js  # Department listing
│   ├── userController.js        # User CRUD
│   ├── alertController.js       # Alert management
│   ├── inventoryController.js   # Transactions, reservations
│   └── reportController.js      # All report queries
├── database/
│   ├── schema.sql               # 16-table normalized schema
│   ├── seed.sql                 # Complete seed data
│   └── setup.js                 # Auto setup script
├── middleware/
│   ├── auth.js                  # JWT verification
│   └── roleAuth.js              # RBAC middleware
├── routes/
│   └── index.js                 # Master router
├── services/
│   ├── AllocationEngine.js      # Intelligent allocation engine
│   ├── AlertEngine.js           # Stock alert engine
│   └── AuditService.js          # Audit logging service
├── public/
│   ├── index.html               # Single page application shell
│   ├── css/
│   │   └── erp.css              # Industrial ERP theme
│   └── js/
│       ├── utils.js             # Shared utilities
│       ├── auth.js              # Login/logout
│       ├── app.js               # App controller + routing
│       ├── dashboard.js         # All 3 dashboard views
│       ├── materials.js         # Material master
│       ├── requests.js          # Requisition cart + workflow
│       ├── allocations.js       # Allocation management
│       ├── inventory.js         # Inventory health + transactions
│       ├── departments.js       # Departments page
│       ├── users.js             # User management
│       ├── alerts.js            # Alerts & notifications
│       └── reports.js           # Reports + audit logs
├── .env                         # Environment config
├── package.json
├── server.js                    # Main Express server
└── README.md
```
