-- ============================================================
-- VSP Material Inventory Management System
-- Seed Data — 6 months of realistic historical data
-- Vizag Steel Plant, Visakhapatnam
-- Period: January 2026 to June 2026
-- ============================================================

USE vsp_inventory;

-- ============================================================
-- ROLES
-- ============================================================
INSERT IGNORE INTO roles (role_name, description) VALUES
('admin',         'System Administrator - full access'),
('store_manager', 'Store Manager - manages inventory'),
('dept_head',     'Department Head - approves requests'),
('dept_user',     'Department User - raises requests');

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT IGNORE INTO departments (id, dept_code, dept_name, dept_head_name, location) VALUES
(1,  'BF',    'Blast Furnace',           'Shri R.K. Sharma',     'Zone-A, Hot Metal Area'),
(2,  'SMS',   'Steel Melting Shop',      'Shri P.K. Mishra',     'Zone-B, Steel Making'),
(3,  'RM',    'Rolling Mill',            'Shri A.K. Patel',      'Zone-C, Rolling Area'),
(4,  'PP',    'Power Plant',             'Shri S.N. Das',        'Zone-D, Power House'),
(5,  'MECH',  'Mechanical Maintenance',  'Shri V.K. Reddy',      'Zone-E, Workshop'),
(6,  'ELEC',  'Electrical Maintenance',  'Shri D.S. Rao',        'Zone-F, E&I Workshop'),
(7,  'INST',  'Instrumentation',         'Shri T.R. Kumar',      'Zone-F, Control Room'),
(8,  'QC',    'Quality Control',         'Shri B.C. Nair',       'Zone-H, Lab Complex'),
(9,  'UTIL',  'Utilities',               'Shri H.N. Singh',      'Zone-G, Utilities Area'),
(10, 'ADMIN', 'Administration',          'Shri M.S. Verma',      'Main Administrative Block');

-- ============================================================
-- DEPARTMENT PRIORITIES
-- ============================================================
INSERT IGNORE INTO department_priorities (department_id, priority_level, priority_score, reason) VALUES
(1, 1, 10.0, 'Blast Furnace - most critical production unit'),
(2, 1, 10.0, 'Steel Melting Shop - core production'),
(3, 2,  6.0, 'Rolling Mill - high priority production'),
(4, 2,  7.0, 'Power Plant - utilities for entire plant'),
(5, 2,  5.0, 'Mechanical Maintenance - plant upkeep'),
(6, 2,  5.0, 'Electrical Maintenance - plant upkeep'),
(7, 3,  3.0, 'Instrumentation - monitoring systems'),
(8, 3,  2.5, 'Quality Control - testing and lab'),
(9, 3,  3.0, 'Utilities - water, compressed air'),
(10,3,  1.0, 'Administration - office functions');

-- ============================================================
-- REQUEST TYPES
-- ============================================================
INSERT IGNORE INTO request_types (id, type_code, type_name, priority_weight, sla_hours, requires_dept_head_approval) VALUES
(1, 'EMER',  'Emergency Breakdown',    5.0,   4,  FALSE),
(2, 'PROD',  'Production Critical',    4.0,   8,  TRUE),
(3, 'PREV',  'Preventive Maintenance', 3.0,  24,  TRUE),
(4, 'PROJ',  'Project Work',           2.0,  72,  TRUE),
(5, 'GEN',   'General Usage',          1.0, 120,  TRUE);

-- ============================================================
-- MATERIAL CATEGORIES
-- ============================================================
INSERT IGNORE INTO material_categories (id, category_code, category_name) VALUES
(1,  'BRG',   'Bearings'),
(2,  'BELT',  'Conveyor Belts & V-Belts'),
(3,  'LUB',   'Lubricants & Greases'),
(4,  'FAST',  'Fasteners & Hardware'),
(5,  'ELEC',  'Electrical Items'),
(6,  'PIPE',  'Pipes & Fittings'),
(7,  'SEAL',  'Seals & Gaskets'),
(8,  'SAFE',  'Safety Equipment'),
(9,  'WELD',  'Welding Consumables'),
(10, 'HYDR',  'Hydraulic & Pneumatic'),
(11, 'PAINT', 'Paints & Chemicals'),
(12, 'MISC',  'Miscellaneous');

-- ============================================================
-- MATERIALS
-- ============================================================
INSERT IGNORE INTO materials (id, material_code, material_name, category_id, unit_of_measure, storage_location, current_stock, reserved_stock, safety_stock, reorder_level, unit_price) VALUES
-- Bearings
(1,  'BRG-001', 'Ball Bearing 6205 (25x52x15)',       1, 'Nos', 'R-A1',  180,  20, 50, 100,  350.00),
(2,  'BRG-002', 'Ball Bearing 6207 (35x72x17)',       1, 'Nos', 'R-A1',  140,  10, 40,  80,  420.00),
(3,  'BRG-003', 'Roller Bearing 32208 (40x80x23)',    1, 'Nos', 'R-A2',   85,   5, 30,  60,  780.00),
(4,  'BRG-004', 'Self-Aligning Bearing 1207',         1, 'Nos', 'R-A2',   60,   0, 20,  40,  520.00),
(5,  'BRG-005', 'Thrust Bearing 51205',               1, 'Nos', 'R-A3',   45,   5, 15,  30,  640.00),
-- Belts
(6,  'BELT-001','V-Belt A-42 (Standard)',             2, 'Nos', 'R-B1',  220,  30, 60, 100,   85.00),
(7,  'BELT-002','V-Belt B-65 (Heavy)',                2, 'Nos', 'R-B1',  160,  20, 50,  90,  120.00),
(8,  'BELT-003','Conveyor Belt 600mm x 50m',          2, 'Mtrs','R-B2',   12,   0,  5,  10, 4800.00),
-- Lubricants
(9,  'LUB-001', 'Mobil DTE 24 Hydraulic Oil 20L',    3, 'Ltrs', 'R-C1', 480,   0, 100,200,  180.00),
(10, 'LUB-002', 'Castrol Hyspin 46 Hydraulic Oil',   3, 'Ltrs', 'R-C1', 320,   0,  80,160,  165.00),
(11, 'LUB-003', 'Servo Gear Oil EP 220 (Drum)',       3, 'Ltrs', 'R-C2', 580,   0, 100,200,   95.00),
(12, 'LUB-004', 'Shell Alvania Grease EP-2 (Tin)',   3, 'Kg',   'R-C3', 180,   0,  40, 80,  340.00),
(13, 'LUB-005', 'Molykote Paste (Anti-seize 500g)',  3, 'Nos',  'R-C3',  45,   0,  10, 20,  890.00),
-- Fasteners
(14, 'FAST-001','M12 Hex Bolt & Nut (Box of 50)',    4, 'Box',  'R-D1',  95,   5, 20,  40,  185.00),
(15, 'FAST-002','M16 Hex Bolt & Nut (Box of 25)',    4, 'Box',  'R-D1',  75,   5, 15,  30,  265.00),
(16, 'FAST-003','M20 Foundation Bolt 300mm',         4, 'Nos',  'R-D2', 380,  20, 80, 150,   45.00),
(17, 'FAST-004','M8 Allen Bolt DIN 912 (Box 100)',   4, 'Box',  'R-D2',  55,   5, 12,  25,  145.00),
(18, 'FAST-005','Spring Washer M16 (Box 200)',       4, 'Box',  'R-D3',  40,   0, 10,  20,   65.00),
-- Electrical
(19, 'ELEC-001','Cable 3.5Cx4 sq mm Aluminium (Mtr)',5, 'Mtrs', 'R-E1', 620,  50,100, 200,   72.00),
(20, 'ELEC-002','MCCB 3P 100A Schneider',            5, 'Nos',  'R-E2',  28,   2, 10,  15, 3800.00),
(21, 'ELEC-003','Contactor LC1-D25 (25A)',           5, 'Nos',  'R-E2',  42,   5, 15,  25, 1250.00),
(22, 'ELEC-004','Relay Omron MY4 (24V DC)',          5, 'Nos',  'R-E3',  65,  10, 20,  35,  480.00),
(23, 'ELEC-005','Fuse 63A HRC (Box of 10)',          5, 'Box',  'R-E3',  38,   0, 10,  20,  320.00),
(24, 'ELEC-006','Push Button NC/NO Set (Red/Green)', 5, 'Nos',  'R-E4', 110,  10, 25,  50,  195.00),
-- Pipes & Fittings
(25, 'PIPE-001','MS Pipe 2" NB Schedule 40 (6m)',    6, 'Nos',  'R-F1',  55,  10, 15,  30,  890.00),
(26, 'PIPE-002','GI Pipe 1.5" NB Medium (6m)',       6, 'Nos',  'R-F1',  40,   5, 10,  20,  680.00),
(27, 'PIPE-003','SS Pipe 1" NB (6m)',                6, 'Nos',  'R-F2',  22,   0,  8,  15, 1450.00),
(28, 'PIPE-004','CS Elbow 2" 90 Degree SW',         6, 'Nos',  'R-F3', 120,  10, 30,  60,   95.00),
(29, 'PIPE-005','Gate Valve 2" PN 16',               6, 'Nos',  'R-F3',  35,   5, 10,  20,  780.00),
-- Seals & Gaskets
(30, 'SEAL-001','Oil Seal 40x62x10 NBR',            7, 'Nos',  'R-G1',  95,  10, 25,  50,  125.00),
(31, 'SEAL-002','O-Ring 50x3 NBR (Pack 10)',        7, 'Pack', 'R-G1',  75,   0, 20,  40,   85.00),
(32, 'SEAL-003','Spiral Wound Gasket 2" 150# SS',   7, 'Nos',  'R-G2',  60,   5, 15,  30,  420.00),
(33, 'SEAL-004','Mechanical Seal Type-A 30mm',       7, 'Nos',  'R-G2',  25,   0,  8,  15, 1800.00),
-- Safety Equipment
(34, 'SAFE-001','Safety Helmet (ISI Mark)',          8, 'Nos',  'R-H1', 145,  15, 40,  80,  280.00),
(35, 'SAFE-002','Safety Goggles (Anti-Fog)',         8, 'Nos',  'R-H1',  90,  10, 25,  50,  145.00),
(36, 'SAFE-003','Safety Gloves Leather (Pair)',      8, 'Pair', 'R-H2', 210,  20, 60, 120,   85.00),
(37, 'SAFE-004','Safety Shoes (Size 8)',             8, 'Pair', 'R-H2',  35,   0, 10,  20,  780.00),
(38, 'SAFE-005','Ear Muffs (Industrial Grade)',      8, 'Nos',  'R-H3',  55,   5, 15,  30,  320.00),
-- Welding
(39, 'WELD-001','Welding Electrode E-6013 3.15mm',  9, 'Kg',   'R-I1', 480,  30, 100,200,   95.00),
(40, 'WELD-002','Welding Electrode E-7018 4mm',     9, 'Kg',   'R-I1', 320,  20,  80,160,  115.00),
(41, 'WELD-003','MIG Wire ER70S-6 1.2mm (15Kg)',   9, 'Reel', 'R-I2',  28,   5,  8,  15, 2800.00),
(42, 'WELD-004','Argon Gas Cylinder (7m3)',         9, 'Nos',  'R-I3',  12,   2,  4,   8, 4500.00),
-- Hydraulic
(43, 'HYDR-001','Hydraulic Cylinder 100mm Bore',    10,'Nos',  'R-J1',  18,   2,  5,  10,12500.00),
(44, 'HYDR-002','Hydraulic Hose 1/2" x 1.5m',     10,'Nos',  'R-J2',  55,   5, 15,  30,  485.00),
(45, 'HYDR-003','Pneumatic Cylinder 63mm Bore',    10,'Nos',  'R-J1',  22,   0,  6,  12, 8500.00),
-- Paint & Chemicals
(46, 'PAINT-01','Red Oxide Primer 20L',            11,'Ltrs', 'R-K1', 280,  20,  60,120,   85.00),
(47, 'PAINT-02','Enamel Paint Black 20L',          11,'Ltrs', 'R-K1', 220,  10,  50,100,   95.00),
(48, 'PAINT-03','Anti-Corrosion Paint (Marine)',   11,'Ltrs', 'R-K2', 180,   0,  40, 80,  185.00),
-- Misc
(49, 'MISC-001','Cotton Waste (Rags) 5Kg Bale',   12,'Nos',  'R-L1', 320,  20,  80,150,   45.00),
(50, 'MISC-002','Teflon Tape 12mm x 12m (Box 50)',12,'Box',  'R-L2',  88,   5,  20, 40,  125.00),
-- Heavy Machinery & High-Value Spares (VSP specific)
(51, 'HV-001', 'ABB 5000kW Main Mill AC Motor',        5, 'Nos',  'WH-H1',   3,   0,   1,   1, 12500000.00),
(52, 'HV-002', 'Siemens 11kV/433V 5MVA Transformer',   5, 'Nos',  'WH-H1',   4,   0,   1,   2,  4800000.00),
(53, 'HV-003', 'SMS Converter Drive Gearbox Assy',     12,'Nos',  'WH-H2',   2,   0,   1,   1, 18500000.00),
(54, 'HV-004', 'Blast Furnace Bell-Less Top Chute',    12,'Nos',  'WH-H2',   5,   1,   2,   2,  4200000.00),
(55, 'HV-005', 'Steel Cord Conveyor Belt ST-2000',     2, 'Mtrs', 'WH-H3', 5000,  0, 1000,2000,   18500.00),
(56, 'HV-006', 'Main Blower Turbine Rotor (BF)',       12,'Nos',  'WH-H3',   2,   0,   1,   1, 22000000.00),
(57, 'HV-007', 'Ladle Transfer Car Wheel Assembly',    12,'Nos',  'WH-H4',  24,   4,   8,  12,   850000.00),
(58, 'HV-008', 'Continuous Caster Copper Mould',       12,'Nos',  'WH-H4',  16,   2,   4,   8,  3200000.00),
(59, 'HV-009', 'Roll Mill Backup Roll (Forged Steel)', 12,'Nos',  'WH-H5',  12,   0,   4,   6,  5500000.00),
(60, 'HV-010', 'High Pressure Descaling Pump Unit',    10,'Nos',  'WH-H5',   4,   0,   1,   2,  7500000.00),
-- Refractories (Massive bulk quantities)
(61, 'REF-001', 'Magnesia Carbon Bricks (SMS Ladle)',  12,'Tons', 'WH-R1', 850,  50, 200, 400, 185000.00),
(62, 'REF-002', 'High Alumina Bricks (BF Stove)',      12,'Tons', 'WH-R1',1200,   0, 300, 500,  95000.00),
(63, 'REF-003', 'Silica Bricks (Coke Oven)',           12,'Tons', 'WH-R2', 650,   0, 150, 300, 125000.00),
(64, 'REF-004', 'Castable Refractory (Low Cement)',    12,'Tons', 'WH-R2', 450,  20, 100, 200,  85000.00),
-- Bulk Raw/Consumables
(65, 'RAW-001', 'Ferro Manganese (High Carbon)',       12,'Tons', 'WH-B1',2500, 100, 500,1000,  82000.00),
(66, 'RAW-002', 'Ferro Silicon (70% Si)',              12,'Tons', 'WH-B1',1800,   0, 400, 800, 115000.00),
(67, 'RAW-003', 'Silico Manganese',                    12,'Tons', 'WH-B2',3200,   0, 600,1200,  78000.00),
(68, 'RAW-004', 'Calcined Petroleum Coke (CPC)',       12,'Tons', 'WH-B2',1500,   0, 300, 600,  45000.00),
(69, 'RAW-005', 'Aluminum Notch Bar (99% Purity)',     12,'Tons', 'WH-B3', 450,  10, 100, 200, 210000.00),
(70, 'RAW-006', 'Fluorspar (CaF2 > 85%)',              12,'Tons', 'WH-B3', 800,   0, 200, 400,  35000.00),
-- Huge Bearings & Mechanics
(71, 'HV-011', 'Four-Row Cylindrical Roller Bearing',  1, 'Nos',  'WH-H6',  18,   2,   4,   8, 1250000.00),
(72, 'HV-012', 'Spherical Roller Bearing (Large)',     1, 'Nos',  'WH-H6',  35,   0,  10,  15,  450000.00),
(73, 'HV-013', 'Main Mill Universal Joint Spindle',    12,'Nos',  'WH-H7',   6,   0,   2,   3, 4800000.00),
(74, 'HV-014', 'Overhead Crane Hoist Wire Rope (32mm)',12,'Mtrs', 'WH-H7',3000,   0, 500,1000,    4500.00),
(75, 'HV-015', 'Sinter Plant Exhauster Fan Impeller',  12,'Nos',  'WH-H8',   3,   0,   1,   1, 8500000.00),
-- Massive Electricals
(76, 'ELEC-103','33kV VCB Panel Board',                5, 'Nos',  'WH-E1',  12,   0,   2,   4, 1800000.00),
(77, 'ELEC-104','HT Power Cable 3Cx300 sqmm 33kV',     5, 'Mtrs', 'WH-E2',8000,   0,1000,2000,   12500.00),
(78, 'ELEC-105','Variable Frequency Drive 1000kW',     5, 'Nos',  'WH-E3',   8,   1,   2,   4, 3200000.00),
(79, 'ELEC-106','Slip Ring Motor 2500kW',              5, 'Nos',  'WH-E3',   5,   0,   1,   2, 6500000.00),
-- Piping & Valves
(80, 'PIPE-101','CS Seamless Pipe 24" SCH 80',         6, 'Mtrs', 'WH-P1', 600,   0, 100, 200,   45000.00),
(81, 'PIPE-102','SS 316L Pipe 12" SCH 40',             6, 'Mtrs', 'WH-P2', 400,  20,  50, 100,   68000.00),
(82, 'PIPE-103','Motorized Gate Valve 24" 300#',       6, 'Nos',  'WH-P3',  15,   0,   3,   5, 1450000.00),
(83, 'PIPE-104','Butterfly Valve 48" Pneumatic',       6, 'Nos',  'WH-P4',  10,   0,   2,   3, 2100000.00),
-- Hydraulic & Pneumatic
(84, 'HYDR-101','Hydraulic Power Pack Unit 500L',      10,'Nos',  'WH-J1',   8,   0,   2,   4, 1650000.00),
(85, 'HYDR-102','Proportional Directional Valve',      10,'Nos',  'WH-J2',  45,   5,  10,  20,  280000.00),
(86, 'HYDR-103','High Pressure Accumulator 50L',       10,'Nos',  'WH-J2',  30,   0,   5,  10,  450000.00),
(87, 'HYDR-104','Servo Valve (Moog) High Response',    10,'Nos',  'WH-J3',  25,   2,   5,  10,  620000.00),
-- Consumables (Large scale)
(88, 'LUB-101', 'Hydraulic Oil VG-68 (Bulk Tank)',     3, 'Ltrs', 'WH-L1',45000,  0,10000,20000,   175.00),
(89, 'LUB-102', 'Turbine Oil ISO VG-46 (Bulk)',        3, 'Ltrs', 'WH-L1',25000,  0, 5000,10000,   220.00),
(90, 'LUB-103', 'Heavy Duty Grease EP-2 (Barrel 180kg)',3,'Drum', 'WH-L2', 400,  10,  50, 100,  45000.00),
(91, 'WELD-101','Submerged Arc Welding Flux',          9, 'Kg',   'WH-W1',15000,  0, 2000,5000,    125.00),
(92, 'WELD-102','Flux Cored Wire 1.6mm (15kg spool)',  9, 'Reel', 'WH-W1',1200,  50, 200, 400,   3500.00),
(93, 'SAFE-101','FR Coveralls (Fire Retardant)',       8, 'Nos',  'WH-S1',3500, 100, 500,1000,   2800.00),
(94, 'SAFE-102','SCBA Sets (Breathing Apparatus)',     8, 'Nos',  'WH-S2', 150,   5,  20,  40,  45000.00),
(95, 'PAINT-101','Epoxy Coating (Part A+B) 200L Drum', 11,'Drum', 'WH-C1', 250,   0,  40,  80,  65000.00),
(96, 'PAINT-102','Polyurethane Finish Coat 200L',      11,'Drum', 'WH-C1', 180,   0,  30,  60,  85000.00),
(97, 'FAST-101','Hardeox Wear Plates 20mm',            4, 'Nos',  'WH-D1', 450,  20, 100, 200,  35000.00),
(98, 'FAST-102','Structural Steel Bolts M36 (Box 50)', 4, 'Box',  'WH-D2', 800,   0, 150, 300,   8500.00),
(99, 'MISC-101','Graphite Electrodes (UHP) 600mm',     12,'Nos',  'WH-M1', 250,  10,  50, 100, 850000.00),
(100,'MISC-102','Copper Tuyeres for Blast Furnace',    12,'Nos',  'WH-M2', 120,   5,  20,  40, 320000.00);

-- ============================================================
-- USERS
-- ============================================================
INSERT IGNORE INTO users (id, employee_id, name, email, password_hash, role_id, department_id, designation) VALUES
-- Admin & Store
(1,  'EMP-0001','Admin User',          'admin@vsp.com',      'VSP@2026', 1, NULL, 'System Administrator'),
(2,  'EMP-0002','Suresh Kumar',        'store@vsp.com',      'VSP@2026', 2, NULL, 'Central Store Manager'),
-- Blast Furnace
(3,  'EMP-1001','K. Narayana Rao',     'bf.head@vsp.com',    'VSP@2026', 3, 1,   'Sr. Manager - Blast Furnace'),
(4,  'EMP-1002','M. Balaji',           'bf.user@vsp.com',    'VSP@2026', 4, 1,   'Engineer - Blast Furnace'),
(5,  'EMP-1003','S. Ravi Kumar',       'bf.user2@vsp.com',   'VSP@2026', 4, 1,   'Junior Engineer - BF'),
-- SMS
(6,  'EMP-2001','P.V. Ramana',         'sms.head@vsp.com',   'VSP@2026', 3, 2,   'Sr. Manager - Steel Melting'),
(7,  'EMP-2002','G. Srinivas',         'sms.user@vsp.com',   'VSP@2026', 4, 2,   'Engineer - SMS'),
-- Rolling Mill
(8,  'EMP-3001','R. Kondal Rao',       'rm.head@vsp.com',    'VSP@2026', 3, 3,   'Sr. Manager - Rolling Mill'),
(9,  'EMP-3002','T. Venkata Rao',      'rm.user@vsp.com',    'VSP@2026', 4, 3,   'Engineer - Rolling Mill'),
-- Power Plant
(10, 'EMP-4001','B.K. Misra',          'pp.head@vsp.com',    'VSP@2026', 3, 4,   'DGM - Power Plant'),
(11, 'EMP-4002','C. Naresh',           'pp.user@vsp.com',    'VSP@2026', 4, 4,   'Engineer - Power Plant'),
-- Mechanical
(12, 'EMP-5001','A. Venkat Reddy',     'mech.head@vsp.com',  'VSP@2026', 3, 5,   'Manager - Mechanical Maintenance'),
(13, 'EMP-5002','D. Subrahmanyam',     'mech.user@vsp.com',  'VSP@2026', 4, 5,   'Supervisor - Mechanical'),
-- Electrical
(14, 'EMP-6001','N. Satyanarayana',    'elec.head@vsp.com',  'VSP@2026', 3, 6,   'Manager - Electrical Maintenance'),
(15, 'EMP-6002','O. Prasad',           'elec.user@vsp.com',  'VSP@2026', 4, 6,   'Electrician Grade-I'),
-- Instrumentation
(16, 'EMP-7001','F. Raju',             'inst.head@vsp.com',  'VSP@2026', 3, 7,   'Manager - Instrumentation'),
(17, 'EMP-7002','H. Mohan',            'inst.user@vsp.com',  'VSP@2026', 4, 7,   'Instrument Technician'),
-- QC
(18, 'EMP-8001','L. Anjaneyulu',       'qc.head@vsp.com',    'VSP@2026', 3, 8,   'Manager - Quality Control'),
(19, 'EMP-8002','Q. Nair',             'qc.user@vsp.com',    'VSP@2026', 4, 8,   'Lab Technician'),
-- Utilities
(20, 'EMP-9001','U. Siva Prasad',      'util.head@vsp.com',  'VSP@2026', 3, 9,   'Manager - Utilities'),
(21, 'EMP-9002','W. Madhava Rao',      'util.user@vsp.com',  'VSP@2026', 4, 9,   'Operator - Utilities');

-- ============================================================
-- MATERIAL REQUESTS — 6 months of historical data
-- Jan to Jun 2026
-- ============================================================
INSERT IGNORE INTO material_requests
  (id, request_no, department_id, request_type_id, requested_by, status,
   justification, dept_approved_by, dept_approved_at, store_reviewed_by, store_reviewed_at,
   issued_by, issued_at, completed_at, required_by_date, created_at)
VALUES
-- January 2026 - Completed requests
(1,  'REQ-2026-001', 1, 1, 4,  'Completed', 'BF #2 blower bearing failure - production stopped.',
     3,  '2026-01-05 09:30:00', 2, '2026-01-05 11:00:00', 2, '2026-01-05 14:00:00', '2026-01-05 14:30:00', '2026-01-06', '2026-01-05 08:00:00'),
(2,  'REQ-2026-002', 2, 3, 7,  'Completed', 'Scheduled PM of SMS Converter drive systems.',
     6,  '2026-01-08 10:00:00', 2, '2026-01-09 09:00:00', 2, '2026-01-10 11:00:00', '2026-01-10 11:30:00', '2026-01-12', '2026-01-07 16:00:00'),
(3,  'REQ-2026-003', 5, 5, 13, 'Completed', 'Monthly maintenance consumables for workshop.',
     12, '2026-01-10 11:00:00', 2, '2026-01-12 14:00:00', 2, '2026-01-13 16:00:00', '2026-01-13 16:30:00', '2026-01-15', '2026-01-09 10:00:00'),
(4,  'REQ-2026-004', 3, 2, 9,  'Completed', 'RM No.3 stand roll bearing replacement.',
     8,  '2026-01-15 09:00:00', 2, '2026-01-16 10:00:00', 2, '2026-01-17 14:00:00', '2026-01-17 14:30:00', '2026-01-18', '2026-01-14 17:00:00'),
(5,  'REQ-2026-005', 6, 3, 15, 'Completed', 'Electrical PM consumables for substation.',
     14, '2026-01-20 10:00:00', 2, '2026-01-21 11:00:00', 2, '2026-01-22 15:00:00', '2026-01-22 15:30:00', '2026-01-24', '2026-01-19 14:00:00'),

-- February 2026
(6,  'REQ-2026-006', 4, 1, 11, 'Completed', 'PP turbine bearing emergency - unit shutdown.',
     10, '2026-02-03 06:00:00', 2, '2026-02-03 07:00:00', 2, '2026-02-03 10:00:00', '2026-02-03 10:30:00', '2026-02-04', '2026-02-03 05:30:00'),
(7,  'REQ-2026-007', 1, 2, 5,  'Completed', 'BF tuyere cooling pipe replacement.',
     3,  '2026-02-07 10:00:00', 2, '2026-02-08 14:00:00', 2, '2026-02-09 11:00:00', '2026-02-09 11:30:00', '2026-02-11', '2026-02-06 16:00:00'),
(8,  'REQ-2026-008', 2, 3, 7,  'Completed', 'SMS Monthly PM - lubrication and seals.',
     6,  '2026-02-12 11:00:00', 2, '2026-02-13 10:00:00', 2, '2026-02-14 14:00:00', '2026-02-14 14:30:00', '2026-02-16', '2026-02-11 15:00:00'),
(9,  'REQ-2026-009', 9, 5, 21, 'Completed', 'Utilities water pump seal replacement.',
     20, '2026-02-17 10:00:00', 2, '2026-02-18 11:00:00', 2, '2026-02-19 15:00:00', '2026-02-19 15:30:00', '2026-02-21', '2026-02-16 14:00:00'),
(10, 'REQ-2026-010', 5, 3, 13, 'Completed', 'Workshop monthly consumables.',
     12, '2026-02-20 09:00:00', 2, '2026-02-21 10:00:00', 2, '2026-02-22 14:00:00', '2026-02-22 14:30:00', '2026-02-24', '2026-02-19 16:00:00'),

-- March 2026
(11, 'REQ-2026-011', 3, 1, 9,  'Completed', 'RM coiler mandrel bearing seized - urgent.',
     8,  '2026-03-02 08:00:00', 2, '2026-03-02 09:00:00', 2, '2026-03-02 13:00:00', '2026-03-02 13:30:00', '2026-03-03', '2026-03-02 07:30:00'),
(12, 'REQ-2026-012', 6, 3, 15, 'Completed', 'Quarterly electrical PM for main substation.',
     14, '2026-03-05 10:00:00', 2, '2026-03-06 11:00:00', 2, '2026-03-08 14:00:00', '2026-03-08 14:30:00', '2026-03-10', '2026-03-04 16:00:00'),
(13, 'REQ-2026-013', 7, 5, 17, 'Completed', 'Instrument calibration - spare parts.',
     16, '2026-03-10 11:00:00', 2, '2026-03-12 10:00:00', 2, '2026-03-13 15:00:00', '2026-03-13 15:30:00', '2026-03-15', '2026-03-09 14:00:00'),
(14, 'REQ-2026-014', 1, 2, 5,  'Completed', 'BF stove valves maintenance.',
     3,  '2026-03-15 09:00:00', 2, '2026-03-16 10:00:00', 2, '2026-03-17 14:00:00', '2026-03-17 14:30:00', '2026-03-20', '2026-03-14 17:00:00'),
(15, 'REQ-2026-015', 2, 2, 7,  'Completed', 'SMS tundish repair - refractory work.',
     6,  '2026-03-20 10:00:00', 2, '2026-03-21 11:00:00', 2, '2026-03-22 14:00:00', '2026-03-22 14:30:00', '2026-03-25', '2026-03-19 15:00:00'),
(16, 'REQ-2026-016', 4, 1, 11, 'Completed', 'Power house cooling tower pump failure.',
     10, '2026-03-25 07:00:00', 2, '2026-03-25 08:00:00', 2, '2026-03-25 12:00:00', '2026-03-25 12:30:00', '2026-03-26', '2026-03-25 06:30:00'),

-- April 2026
(17, 'REQ-2026-017', 5, 3, 13, 'Completed', 'Monthly workshop maintenance items.',
     12, '2026-04-02 10:00:00', 2, '2026-04-03 11:00:00', 2, '2026-04-05 14:00:00', '2026-04-05 14:30:00', '2026-04-07', '2026-04-01 16:00:00'),
(18, 'REQ-2026-018', 3, 2, 9,  'Completed', 'RM conveyor belt replacement.',
     8,  '2026-04-07 09:00:00', 2, '2026-04-08 10:00:00', 2, '2026-04-09 14:00:00', '2026-04-09 14:30:00', '2026-04-11', '2026-04-06 17:00:00'),
(19, 'REQ-2026-019', 1, 3, 5,  'Completed', 'BF coke oven machines quarterly PM.',
     3,  '2026-04-10 10:00:00', 2, '2026-04-11 11:00:00', 2, '2026-04-12 14:00:00', '2026-04-12 14:30:00', '2026-04-15', '2026-04-09 16:00:00'),
(20, 'REQ-2026-020', 9, 5, 21, 'Completed', 'Utilities cooling water system maintenance.',
     20, '2026-04-14 11:00:00', 2, '2026-04-15 10:00:00', 2, '2026-04-16 15:00:00', '2026-04-16 15:30:00', '2026-04-18', '2026-04-13 15:00:00'),
(21, 'REQ-2026-021', 2, 1, 7,  'Completed', 'SMS electric arc furnace electrode holder failure.',
     6,  '2026-04-18 05:00:00', 2, '2026-04-18 06:00:00', 2, '2026-04-18 09:00:00', '2026-04-18 09:30:00', '2026-04-19', '2026-04-18 04:30:00'),
(22, 'REQ-2026-022', 6, 3, 15, 'Completed', 'Electrical panel maintenance consumables.',
     14, '2026-04-22 10:00:00', 2, '2026-04-23 11:00:00', 2, '2026-04-24 15:00:00', '2026-04-24 15:30:00', '2026-04-26', '2026-04-21 16:00:00'),

-- May 2026
(23, 'REQ-2026-023', 1, 2, 5,  'Completed', 'BF No.1 repair during planned shutdown.',
     3,  '2026-05-02 09:00:00', 2, '2026-05-03 10:00:00', 2, '2026-05-05 14:00:00', '2026-05-05 14:30:00', '2026-05-07', '2026-05-01 17:00:00'),
(24, 'REQ-2026-024', 3, 1, 9,  'Completed', 'RM stand #4 motor bearing failure.',
     8,  '2026-05-08 07:30:00', 2, '2026-05-08 08:30:00', 2, '2026-05-08 12:00:00', '2026-05-08 12:30:00', '2026-05-09', '2026-05-08 07:00:00'),
(25, 'REQ-2026-025', 5, 3, 13, 'Completed', 'Workshop monthly consumables - May.',
     12, '2026-05-10 10:00:00', 2, '2026-05-11 11:00:00', 2, '2026-05-13 14:00:00', '2026-05-13 14:30:00', '2026-05-15', '2026-05-09 16:00:00'),
(26, 'REQ-2026-026', 4, 2, 11, 'Completed', 'PP boiler feedpump overhaul.',
     10, '2026-05-14 10:00:00', 2, '2026-05-15 11:00:00', 2, '2026-05-17 14:00:00', '2026-05-17 14:30:00', '2026-05-20', '2026-05-13 17:00:00'),
(27, 'REQ-2026-027', 2, 3, 7,  'Completed', 'SMS May planned maintenance.',
     6,  '2026-05-18 10:00:00', 2, '2026-05-19 11:00:00', 2, '2026-05-21 14:00:00', '2026-05-21 14:30:00', '2026-05-23', '2026-05-17 16:00:00'),
(28, 'REQ-2026-028', 7, 5, 17, 'Completed', 'Instrumentation quarterly spares replenishment.',
     16, '2026-05-22 11:00:00', 2, '2026-05-23 10:00:00', 2, '2026-05-26 15:00:00', '2026-05-26 15:30:00', '2026-05-28', '2026-05-21 15:00:00'),

-- June 2026 - Mix of statuses (recent/ongoing)
(29, 'REQ-2026-029', 1, 1, 5,  'Issued',    'BF #3 blower motor bearing damaged - urgent restart needed.',
     3,  '2026-06-01 07:00:00', 2, '2026-06-01 08:30:00', 2, '2026-06-01 11:00:00', NULL, '2026-06-02', '2026-06-01 06:30:00'),
(30, 'REQ-2026-030', 3, 2, 9,  'Allocated', 'RM rolling stand #2 routine overhaul.',
     8,  '2026-06-02 10:00:00', 2, '2026-06-02 12:00:00', NULL, NULL, NULL, '2026-06-05', '2026-06-01 17:00:00'),
(31, 'REQ-2026-031', 5, 3, 13, 'Partially_Allocated', 'Workshop June maintenance consumables.',
     12, '2026-06-03 10:00:00', 2, '2026-06-03 11:30:00', NULL, NULL, NULL, '2026-06-07', '2026-06-02 16:00:00'),
(32, 'REQ-2026-032', 2, 2, 7,  'Store_Review',       'SMS converter shell repair materials.',
     6,  '2026-06-04 10:00:00', NULL, NULL, NULL, NULL, NULL, '2026-06-10', '2026-06-03 15:00:00'),
(33, 'REQ-2026-033', 4, 1, 11, 'Dept_Approved',      'PP steam turbine seal failure - production impact.',
     10, '2026-06-04 09:00:00', NULL, NULL, NULL, NULL, NULL, '2026-06-05', '2026-06-04 08:00:00'),
(34, 'REQ-2026-034', 6, 3, 15, 'Submitted',          'Electrical substation quarterly PM consumables.',
     NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-12', '2026-06-04 14:00:00'),
(35, 'REQ-2026-035', 9, 5, 21, 'Waitlisted',         'Utilities cooling tower pump overhaul.',
     20, '2026-06-03 11:00:00', 2, '2026-06-03 13:00:00', NULL, NULL, NULL, '2026-06-15', '2026-06-02 17:00:00'),
(36, 'REQ-2026-036', 8, 5, 19, 'Submitted',          'QC lab instruments calibration spares.',
     NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-20', '2026-06-04 11:00:00');

-- ============================================================
-- MATERIAL REQUEST ITEMS
-- ============================================================
INSERT IGNORE INTO material_request_items
  (id, request_id, material_id, requested_quantity, allocated_quantity, issued_quantity, item_status)
VALUES
-- REQ-001 BF emergency bearing (Jan)
(1,  1,  1, 10, 10, 10, 'Issued'), (2,  1, 30,  5,  5,  5, 'Issued'),
-- REQ-002 SMS PM (Jan)
(3,  2,  9, 60,  60, 60, 'Issued'), (4,  2, 12, 10,  10, 10, 'Issued'), (5, 2, 31, 20, 20, 20, 'Issued'),
-- REQ-003 Workshop consumables (Jan)
(6,  3, 36, 30, 30, 30, 'Issued'), (7,  3, 49, 10, 10, 10, 'Issued'), (8, 3, 14,  5,  5,  5, 'Issued'),
-- REQ-004 RM bearing (Jan)
(9,  4,  3,  6,  6,  6, 'Issued'), (10, 4, 30,  8,  8,  8, 'Issued'),
-- REQ-005 Electrical PM (Jan)
(11, 5, 22, 15, 15, 15, 'Issued'), (12, 5, 23,  5,  5,  5, 'Issued'), (13, 5, 24, 10, 10, 10, 'Issued'),
-- REQ-006 PP emergency bearing (Feb)
(14, 6,  2,  8,  8,  8, 'Issued'), (15, 6,  5,  4,  4,  4, 'Issued'),
-- REQ-007 BF pipe replacement (Feb)
(16, 7, 25,  8,  8,  8, 'Issued'), (17, 7, 28, 20, 20, 20, 'Issued'), (18, 7, 29,  5,  5,  5, 'Issued'),
-- REQ-008 SMS PM Feb
(19, 8,  9, 40, 40, 40, 'Issued'), (20, 8, 12,  8,  8,  8, 'Issued'), (21, 8, 31, 15, 15, 15, 'Issued'),
-- REQ-009 Utilities seal (Feb)
(22, 9, 33,  3,  3,  3, 'Issued'), (23, 9, 31, 10, 10, 10, 'Issued'),
-- REQ-010 Workshop Feb
(24,10, 36, 25, 25, 25, 'Issued'), (25,10, 49,  8,  8,  8, 'Issued'), (26,10, 50,  3,  3,  3, 'Issued'),
-- REQ-011 RM coiler (Mar emergency)
(27,11,  1,  6,  6,  6, 'Issued'), (28,11,  2,  4,  4,  4, 'Issued'),
-- REQ-012 Electrical quarterly PM (Mar)
(29,12, 21, 10, 10, 10, 'Issued'), (30,12, 22, 12, 12, 12, 'Issued'), (31,12, 24, 20, 20, 20, 'Issued'),
-- REQ-013 Instrumentation (Mar)
(32,13, 22,  8,  8,  8, 'Issued'), (33,13, 31,  5,  5,  5, 'Issued'),
-- REQ-014 BF stove valves (Mar)
(34,14, 29,  8,  8,  8, 'Issued'), (35,14, 32, 10, 10, 10, 'Issued'), (36,14, 28, 30, 30, 30, 'Issued'),
-- REQ-015 SMS tundish repair (Mar)
(37,15, 39, 80, 80, 80, 'Issued'), (38,15, 40, 50, 50, 50, 'Issued'), (39,15, 46,100,100,100, 'Issued'),
-- REQ-016 PP cooling tower (Mar emergency)
(40,16,  1,  4,  4,  4, 'Issued'), (41,16,  9, 40, 40, 40, 'Issued'),
-- REQ-017 Workshop Apr
(42,17, 36, 30, 30, 30, 'Issued'), (43,17, 49, 10, 10, 10, 'Issued'), (44,17, 14,  5,  5,  5, 'Issued'),
-- REQ-018 RM conveyor belt (Apr)
(45,18,  8,  3,  3,  3, 'Issued'), (46,18,  6, 20, 20, 20, 'Issued'), (47,18,  7, 15, 15, 15, 'Issued'),
-- REQ-019 BF quarterly PM (Apr)
(48,19,  9, 80, 80, 80, 'Issued'), (49,19, 11,100,100,100, 'Issued'), (50,19, 12, 20, 20, 20, 'Issued'),
-- REQ-020 Utilities cooling (Apr)
(51,20, 33,  2,  2,  2, 'Issued'), (52,20, 44,  8,  8,  8, 'Issued'),
-- REQ-021 SMS EAF emergency (Apr)
(53,21, 39, 50, 50, 50, 'Issued'), (54,21, 40, 30, 30, 30, 'Issued'), (55,21, 41,  5,  5,  5, 'Issued'),
-- REQ-022 Electrical panel (Apr)
(56,22, 21,  8,  8,  8, 'Issued'), (57,22, 23,  4,  4,  4, 'Issued'), (58,22, 22, 10, 10, 10, 'Issued'),
-- REQ-023 BF planned shutdown (May)
(59,23,  3, 10, 10, 10, 'Issued'), (60,23,  4,  6,  6,  6, 'Issued'), (61,23, 46,120,120,120, 'Issued'),
-- REQ-024 RM stand motor (May emergency)
(62,24,  2,  6,  6,  6, 'Issued'), (63,24, 30,  6,  6,  6, 'Issued'),
-- REQ-025 Workshop May
(64,25, 36, 25, 25, 25, 'Issued'), (65,25, 49,  8,  8,  8, 'Issued'), (66,25, 14,  4,  4,  4, 'Issued'),
-- REQ-026 PP boiler feedpump (May)
(67,26,  4,  4,  4,  4, 'Issued'), (68,26, 44,  6,  6,  6, 'Issued'), (69,26, 32, 12, 12, 12, 'Issued'),
-- REQ-027 SMS May PM
(70,27,  9, 50, 50, 50, 'Issued'), (71,27, 12, 10, 10, 10, 'Issued'), (72,27, 31, 20, 20, 20, 'Issued'),
-- REQ-028 Instrumentation quarterly (May)
(73,28, 22, 10, 10, 10, 'Issued'), (74,28, 24, 15, 15, 15, 'Issued'), (75,28, 31,  8,  8,  8, 'Issued'),
-- REQ-029 BF emergency June (Issued status)
(76,29,  1, 12, 12, 12, 'Issued'), (77,29, 30,  6,  6,  6, 'Issued'),
-- REQ-030 RM overhaul Jun (Allocated)
(78,30,  3,  8,  8,  0, 'Allocated'), (79,30,  6, 25, 25,  0, 'Allocated'), (80,30, 12, 10, 10,  0, 'Allocated'),
-- REQ-031 Workshop Jun (Partial)
(81,31, 36, 40, 30,  0, 'Partially_Allocated'), (82,31, 49, 15, 15,  0, 'Allocated'), (83,31, 14, 10,  5,  0, 'Partially_Allocated'),
-- REQ-032 SMS Store Review
(84,32, 39,100,  0,  0, 'Pending'), (85,32, 40, 60,  0,  0, 'Pending'), (86,32, 46,200,  0,  0, 'Pending'),
-- REQ-033 PP Dept Approved
(87,33,  5,  6,  0,  0, 'Pending'), (88,33, 33,  4,  0,  0, 'Pending'),
-- REQ-034 Electrical Submitted
(89,34, 21, 12,  0,  0, 'Pending'), (90,34, 22, 15,  0,  0, 'Pending'), (91,34, 24, 20,  0,  0, 'Pending'),
-- REQ-035 Utilities Waitlisted
(92,35, 44, 12,  5,  0, 'Partially_Allocated'), (93,35, 33,  4,  0,  0, 'Waitlisted'),
-- REQ-036 QC Submitted
(94,36, 22,  8,  0,  0, 'Pending'), (95,36, 31, 10,  0,  0, 'Pending');

-- ============================================================
-- ALLOCATIONS — including Full, Partial, Waitlisted scenarios
-- ============================================================
INSERT IGNORE INTO allocations
  (id, request_id, request_item_id, material_id, department_id, requested_quantity,
   allocated_quantity, shortage_quantity, allocation_type, allocation_reason, allocated_by, allocated_at, status, issued_by, issued_at)
VALUES
-- Jan allocations (all Issued)
(1,  1,  1,  1, 1, 10, 10, 0, 'Full',    'Stock available',              2, '2026-01-05 11:30:00', 'Issued', 2, '2026-01-05 14:00:00'),
(2,  1,  2, 30, 1,  5,  5, 0, 'Full',    'Stock available',              2, '2026-01-05 11:30:00', 'Issued', 2, '2026-01-05 14:00:00'),
(3,  2,  3,  9, 2, 60, 60, 0, 'Full',    'Stock available',              2, '2026-01-09 09:30:00', 'Issued', 2, '2026-01-10 11:00:00'),
(4,  2,  4, 12, 2, 10, 10, 0, 'Full',    'Stock available',              2, '2026-01-09 09:30:00', 'Issued', 2, '2026-01-10 11:00:00'),
(5,  2,  5, 31, 2, 20, 20, 0, 'Full',    'Stock available',              2, '2026-01-09 09:30:00', 'Issued', 2, '2026-01-10 11:00:00'),
(6,  3,  6, 36, 5, 30, 30, 0, 'Full',    'Stock available',              2, '2026-01-12 14:30:00', 'Issued', 2, '2026-01-13 16:00:00'),
(7,  3,  7, 49, 5, 10, 10, 0, 'Full',    'Stock available',              2, '2026-01-12 14:30:00', 'Issued', 2, '2026-01-13 16:00:00'),
(8,  3,  8, 14, 5,  5,  5, 0, 'Full',    'Stock available',              2, '2026-01-12 14:30:00', 'Issued', 2, '2026-01-13 16:00:00'),
(9,  4,  9,  3, 3,  6,  6, 0, 'Full',    'Stock available',              2, '2026-01-16 10:30:00', 'Issued', 2, '2026-01-17 14:00:00'),
(10, 4, 10, 30, 3,  8,  8, 0, 'Full',    'Stock available',              2, '2026-01-16 10:30:00', 'Issued', 2, '2026-01-17 14:00:00'),
(11, 5, 11, 22, 6, 15, 15, 0, 'Full',    'Stock available',              2, '2026-01-21 11:30:00', 'Issued', 2, '2026-01-22 15:00:00'),
(12, 5, 12, 23, 6,  5,  5, 0, 'Full',    'Stock available',              2, '2026-01-21 11:30:00', 'Issued', 2, '2026-01-22 15:00:00'),
(13, 5, 13, 24, 6, 10, 10, 0, 'Full',    'Stock available',              2, '2026-01-21 11:30:00', 'Issued', 2, '2026-01-22 15:00:00'),
-- Feb allocations (all Issued)
(14, 6, 14,  2, 4,  8,  8, 0, 'Full',    'Emergency - full allocation',  2, '2026-02-03 07:30:00', 'Issued', 2, '2026-02-03 10:00:00'),
(15, 6, 15,  5, 4,  4,  4, 0, 'Full',    'Emergency - full allocation',  2, '2026-02-03 07:30:00', 'Issued', 2, '2026-02-03 10:00:00'),
(16, 7, 16, 25, 1,  8,  8, 0, 'Full',    'Stock available',              2, '2026-02-08 14:30:00', 'Issued', 2, '2026-02-09 11:00:00'),
(17, 7, 17, 28, 1, 20, 20, 0, 'Full',    'Stock available',              2, '2026-02-08 14:30:00', 'Issued', 2, '2026-02-09 11:00:00'),
(18, 7, 18, 29, 1,  5,  5, 0, 'Full',    'Stock available',              2, '2026-02-08 14:30:00', 'Issued', 2, '2026-02-09 11:00:00'),
(19, 8, 19,  9, 2, 40, 40, 0, 'Full',    'Stock available',              2, '2026-02-13 10:30:00', 'Issued', 2, '2026-02-14 14:00:00'),
(20, 8, 20, 12, 2,  8,  8, 0, 'Full',    'Stock available',              2, '2026-02-13 10:30:00', 'Issued', 2, '2026-02-14 14:00:00'),
(21, 8, 21, 31, 2, 15, 15, 0, 'Full',    'Stock available',              2, '2026-02-13 10:30:00', 'Issued', 2, '2026-02-14 14:00:00'),
(22, 9, 22, 33, 9,  3,  3, 0, 'Full',    'Stock available',              2, '2026-02-18 11:30:00', 'Issued', 2, '2026-02-19 15:00:00'),
(23, 9, 23, 31, 9, 10, 10, 0, 'Full',    'Stock available',              2, '2026-02-18 11:30:00', 'Issued', 2, '2026-02-19 15:00:00'),
-- Mar allocations (Issued)
(24,11, 27,  1, 3,  6,  6, 0, 'Full',    'Emergency - full allocation',  2, '2026-03-02 09:30:00', 'Issued', 2, '2026-03-02 13:00:00'),
(25,11, 28,  2, 3,  4,  4, 0, 'Full',    'Emergency - full allocation',  2, '2026-03-02 09:30:00', 'Issued', 2, '2026-03-02 13:00:00'),
(26,12, 29, 21, 6, 10, 10, 0, 'Full',    'Stock available',              2, '2026-03-06 11:30:00', 'Issued', 2, '2026-03-08 14:00:00'),
(27,12, 30, 22, 6, 12, 12, 0, 'Full',    'Stock available',              2, '2026-03-06 11:30:00', 'Issued', 2, '2026-03-08 14:00:00'),
(28,14, 34, 29, 1,  8,  8, 0, 'Full',    'Stock available',              2, '2026-03-16 10:30:00', 'Issued', 2, '2026-03-17 14:00:00'),
(29,15, 37, 39, 2, 80, 80, 0, 'Full',    'Stock available',              2, '2026-03-21 11:30:00', 'Issued', 2, '2026-03-22 14:00:00'),
(30,15, 38, 40, 2, 50, 50, 0, 'Full',    'Stock available',              2, '2026-03-21 11:30:00', 'Issued', 2, '2026-03-22 14:00:00'),
-- Apr allocations (Issued)
(31,18, 45,  8, 3,  3,  3, 0, 'Full',    'Stock available',              2, '2026-04-08 10:30:00', 'Issued', 2, '2026-04-09 14:00:00'),
(32,18, 46,  6, 3, 20, 20, 0, 'Full',    'Stock available',              2, '2026-04-08 10:30:00', 'Issued', 2, '2026-04-09 14:00:00'),
(33,21, 53, 39, 2, 50, 50, 0, 'Full',    'Emergency override',           2, '2026-04-18 06:30:00', 'Issued', 2, '2026-04-18 09:00:00'),
(34,21, 54, 40, 2, 30, 30, 0, 'Full',    'Emergency override',           2, '2026-04-18 06:30:00', 'Issued', 2, '2026-04-18 09:00:00'),
(35,21, 55, 41, 2,  5,  5, 0, 'Full',    'Emergency override',           2, '2026-04-18 06:30:00', 'Issued', 2, '2026-04-18 09:00:00'),
-- May allocations (Issued)
(36,24, 62,  2, 3,  6,  6, 0, 'Full',    'Emergency - full allocation',  2, '2026-05-08 08:30:00', 'Issued', 2, '2026-05-08 12:00:00'),
(37,24, 63, 30, 3,  6,  6, 0, 'Full',    'Stock available',              2, '2026-05-08 08:30:00', 'Issued', 2, '2026-05-08 12:00:00'),
(38,26, 67,  4, 4,  4,  4, 0, 'Full',    'Stock available',              2, '2026-05-15 11:30:00', 'Issued', 2, '2026-05-17 14:00:00'),
(39,26, 68, 44, 4,  6,  6, 0, 'Full',    'Stock available',              2, '2026-05-15 11:30:00', 'Issued', 2, '2026-05-17 14:00:00'),
-- June allocations (current/recent)
(40,29, 76,  1, 1, 12, 12, 0, 'Full',    'Emergency - full allocation',  2, '2026-06-01 09:00:00', 'Pending_Issue', NULL, NULL),
(41,29, 77, 30, 1,  6,  6, 0, 'Full',    'Stock available',              2, '2026-06-01 09:00:00', 'Pending_Issue', NULL, NULL),
(42,30, 78,  3, 3,  8,  8, 0, 'Full',    'Stock available',              2, '2026-06-02 12:30:00', 'Pending_Issue', NULL, NULL),
(43,30, 79,  6, 3, 25, 25, 0, 'Full',    'Stock available',              2, '2026-06-02 12:30:00', 'Pending_Issue', NULL, NULL),
(44,30, 80, 12, 3, 10, 10, 0, 'Full',    'Stock available',              2, '2026-06-02 12:30:00', 'Pending_Issue', NULL, NULL),
-- Partial allocation - safety stock restriction
(45,31, 81, 36, 5, 40, 30, 10,'Partial', 'Safety stock limit reached',   2, '2026-06-03 12:00:00', 'Pending_Issue', NULL, NULL),
(46,31, 82, 49, 5, 15, 15,  0,'Full',    'Stock available',              2, '2026-06-03 12:00:00', 'Pending_Issue', NULL, NULL),
(47,31, 83, 14, 5, 10,  5,  5,'Partial', 'Reorder level breach - partial',2,'2026-06-03 12:00:00', 'Pending_Issue', NULL, NULL),
-- Waitlisted - insufficient stock
(48,35, 92, 44, 9, 12,  5,  7,'Partial', 'Low stock - partial allocated',2, '2026-06-03 13:30:00', 'Pending_Issue', NULL, NULL),
(49,35, 93, 33, 9,  4,  0,  4,'Waitlisted','Zero available stock',       2, '2026-06-03 13:30:00', 'Pending_Issue', NULL, NULL);

-- ============================================================
-- RESERVATIONS (Active stock reservations)
-- ============================================================
INSERT IGNORE INTO reservations
  (id, request_id, request_item_id, material_id, department_id, reserved_quantity, reservation_type, status, expires_at)
VALUES
(1, 29, 76,  1, 1, 12, 'Approved', 'Active', '2026-06-08 23:59:59'),
(2, 29, 77, 30, 1,  6, 'Approved', 'Active', '2026-06-08 23:59:59'),
(3, 30, 78,  3, 3,  8, 'Approved', 'Active', '2026-06-12 23:59:59'),
(4, 30, 79,  6, 3, 25, 'Approved', 'Active', '2026-06-12 23:59:59'),
(5, 30, 80, 12, 3, 10, 'Approved', 'Active', '2026-06-12 23:59:59'),
(6, 31, 81, 36, 5, 30, 'Approved', 'Active', '2026-06-10 23:59:59'),
(7, 31, 82, 49, 5, 15, 'Approved', 'Active', '2026-06-10 23:59:59'),
(8, 35, 92, 44, 9,  5, 'Approved', 'Active', '2026-06-15 23:59:59'),
(9, 35, 93, 33, 9,  0, 'Waitlist', 'Active', '2026-06-15 23:59:59');

-- ============================================================
-- INVENTORY TRANSACTIONS — 6 months (Jan to Jun)
-- ============================================================
INSERT IGNORE INTO inventory_transactions
  (id, transaction_no, transaction_type, material_id, department_id, request_id, allocation_id,
   quantity, stock_before, stock_after, unit_price, total_value, transaction_date, performed_by, remarks)
VALUES
-- ===== JANUARY 2026 =====
(1,  'TXN-2026-001','Issue', 1, 1, 1,  1, 10, 200, 190, 350.00, 3500.00, '2026-01-05 14:00:00', 2, 'BF blower bearing replacement'),
(2,  'TXN-2026-002','Issue',30, 1, 1,  2,  5, 110, 105, 125.00,  625.00, '2026-01-05 14:05:00', 2, 'Oil seal for BF blower'),
(3,  'TXN-2026-003','Issue', 9, 2, 2,  3, 60, 600, 540, 180.00,10800.00, '2026-01-10 11:00:00', 2, 'SMS PM hydraulic oil'),
(4,  'TXN-2026-004','Issue',12, 2, 2,  4, 10, 200, 190, 340.00, 3400.00, '2026-01-10 11:05:00', 2, 'SMS PM grease'),
(5,  'TXN-2026-005','Issue',31, 2, 2,  5, 20,  90,  70,  85.00, 1700.00, '2026-01-10 11:10:00', 2, 'SMS PM o-rings'),
(6,  'TXN-2026-006','Issue',36, 5, 3,  6, 30, 280, 250,  85.00, 2550.00, '2026-01-13 16:00:00', 2, 'Workshop safety gloves'),
(7,  'TXN-2026-007','Issue',49, 5, 3,  7, 10, 360, 350,  45.00,  450.00, '2026-01-13 16:05:00', 2, 'Workshop cotton waste'),
(8,  'TXN-2026-008','Issue',14, 5, 3,  8,  5, 100,  95, 185.00,  925.00, '2026-01-13 16:10:00', 2, 'Workshop bolts'),
(9,  'TXN-2026-009','Issue', 3, 3, 4,  9,  6, 100,  94, 780.00, 4680.00, '2026-01-17 14:00:00', 2, 'RM stand roller bearing'),
(10, 'TXN-2026-010','Issue',30, 3, 4, 10,  8, 105,  97, 125.00, 1000.00, '2026-01-17 14:05:00', 2, 'RM stand oil seals'),
(11, 'TXN-2026-011','Issue',22, 6, 5, 11, 15,  80,  65, 480.00, 7200.00, '2026-01-22 15:00:00', 2, 'Electrical relays for substation'),
(12, 'TXN-2026-012','Issue',23, 6, 5, 12,  5,  50,  45, 320.00, 1600.00, '2026-01-22 15:05:00', 2, 'Fuses for MCC panel'),
(13, 'TXN-2026-013','Issue',24, 6, 5, 13, 10, 130, 120, 195.00, 1950.00, '2026-01-22 15:10:00', 2, 'Push buttons for panel'),
-- Stock adjustment - received new stock
(14, 'TXN-2026-014','Adjustment_In', 1, NULL,NULL,NULL,100, 190, 290, 350.00,35000.00,'2026-01-25 10:00:00', 2, 'PO-2026-BRG-01: Bearing stock replenishment'),
(15, 'TXN-2026-015','Adjustment_In', 9, NULL,NULL,NULL,200, 540, 740, 180.00,36000.00,'2026-01-26 11:00:00', 2, 'PO-2026-LUB-01: Hydraulic oil received'),
(16, 'TXN-2026-016','Adjustment_In',36, NULL,NULL,NULL,100, 250, 350, 85.00, 8500.00,'2026-01-28 14:00:00', 2, 'Safety equipment stock received'),

-- ===== FEBRUARY 2026 =====
(17, 'TXN-2026-017','Issue', 2, 4, 6, 14,  8, 170, 162, 420.00, 3360.00, '2026-02-03 10:00:00', 2, 'PP turbine bearing emergency'),
(18, 'TXN-2026-018','Issue', 5, 4, 6, 15,  4,  55,  51, 640.00, 2560.00, '2026-02-03 10:05:00', 2, 'PP thrust bearing'),
(19, 'TXN-2026-019','Issue',25, 1, 7, 16,  8,  65,  57, 890.00, 7120.00, '2026-02-09 11:00:00', 2, 'BF tuyere cooling pipes'),
(20, 'TXN-2026-020','Issue',28, 1, 7, 17, 20, 150, 130,  95.00, 1900.00, '2026-02-09 11:05:00', 2, 'BF pipe elbows'),
(21, 'TXN-2026-021','Issue',29, 1, 7, 18,  5,  42,  37, 780.00, 3900.00, '2026-02-09 11:10:00', 2, 'BF gate valves'),
(22, 'TXN-2026-022','Issue', 9, 2, 8, 19, 40, 740, 700, 180.00, 7200.00, '2026-02-14 14:00:00', 2, 'SMS Feb PM hydraulic oil'),
(23, 'TXN-2026-023','Issue',12, 2, 8, 20,  8, 190, 182, 340.00, 2720.00, '2026-02-14 14:05:00', 2, 'SMS Feb PM grease'),
(24, 'TXN-2026-024','Issue',31, 2, 8, 21, 15,  70,  55,  85.00, 1275.00, '2026-02-14 14:10:00', 2, 'SMS Feb PM o-rings'),
(25, 'TXN-2026-025','Issue',33, 9, 9, 22,  3,  28,  25,1800.00, 5400.00, '2026-02-19 15:00:00', 2, 'Utilities water pump mechanical seal'),
(26, 'TXN-2026-026','Issue',31, 9, 9, 23, 10,  55,  45,  85.00,  850.00, '2026-02-19 15:05:00', 2, 'Pump o-rings'),
(27, 'TXN-2026-027','Adjustment_In', 2, NULL,NULL,NULL, 50, 162, 212, 420.00,21000.00,'2026-02-20 11:00:00', 2, 'Ball bearing stock received PO-2026-BRG-02'),
(28, 'TXN-2026-028','Adjustment_In',36, NULL,NULL,NULL, 80, 350, 430, 85.00, 6800.00,'2026-02-22 10:00:00', 2, 'Safety equipment replenishment'),
(29, 'TXN-2026-029','Adjustment_In',22, NULL,NULL,NULL, 40,  65, 105, 480.00,19200.00,'2026-02-24 14:00:00', 2, 'Relay replenishment from vendor'),
(30, 'TXN-2026-030','Issue',36, 5,10, NULL, 25, 430, 405,  85.00, 2125.00,'2026-02-22 14:30:00', 2, 'Workshop safety gloves Feb'),
(31, 'TXN-2026-031','Issue',49, 5,10, NULL,  8, 350, 342,  45.00,  360.00,'2026-02-22 14:35:00', 2, 'Workshop cotton waste Feb'),
(32, 'TXN-2026-032','Issue',50, 5,10, NULL,  3,  95,  92, 125.00,  375.00,'2026-02-22 14:40:00', 2, 'Teflon tape Feb'),

-- ===== MARCH 2026 =====
(33, 'TXN-2026-033','Issue', 1, 3,11, 24,  6, 290, 284, 350.00, 2100.00, '2026-03-02 13:00:00', 2, 'RM coiler mandrel bearing emergency'),
(34, 'TXN-2026-034','Issue', 2, 3,11, 25,  4, 212, 208, 420.00, 1680.00, '2026-03-02 13:05:00', 2, 'RM coiler bearing 6207'),
(35, 'TXN-2026-035','Issue',21, 6,12, 26, 10, 105,  95,1250.00,12500.00, '2026-03-08 14:00:00', 2, 'Electrical quarterly PM contactor'),
(36, 'TXN-2026-036','Issue',22, 6,12, 27, 12, 105,  93, 480.00, 5760.00, '2026-03-08 14:05:00', 2, 'Electrical quarterly PM relay'),
(37, 'TXN-2026-037','Issue',29, 1,14, 28,  8,  37,  29, 780.00, 6240.00, '2026-03-17 14:00:00', 2, 'BF stove gate valves'),
(38, 'TXN-2026-038','Issue',39, 2,15, 29, 80, 580, 500,  95.00, 7600.00, '2026-03-22 14:00:00', 2, 'SMS welding electrodes E-6013'),
(39, 'TXN-2026-039','Issue',40, 2,15, 30, 50, 380, 330, 115.00, 5750.00, '2026-03-22 14:05:00', 2, 'SMS welding electrodes E-7018'),
(40, 'TXN-2026-040','Issue', 1, 4,16, 40,  4, 284, 280, 350.00, 1400.00, '2026-03-25 12:00:00', 2, 'PP cooling tower pump bearing'),
(41, 'TXN-2026-041','Issue', 9, 4,16, NULL,40, 700, 660, 180.00, 7200.00, '2026-03-25 12:05:00', 2, 'PP hydraulic oil top-up'),
(42, 'TXN-2026-042','Adjustment_In', 3, NULL,NULL,NULL, 60,  94, 154, 780.00,46800.00,'2026-03-15 11:00:00', 2, 'Roller bearing stock received'),
(43, 'TXN-2026-043','Adjustment_In', 9, NULL,NULL,NULL,200, 660, 860, 180.00,36000.00,'2026-03-28 14:00:00', 2, 'Hydraulic oil PO-2026-LUB-02'),
(44, 'TXN-2026-044','Adjustment_In',39, NULL,NULL,NULL,200, 500, 700,  95.00,19000.00,'2026-03-29 10:00:00', 2, 'Welding electrode stock received'),
(45, 'TXN-2026-045','Return',14, 5, 3, NULL, 2,  93,  95, 185.00,  370.00,'2026-03-31 16:00:00', 2, 'Excess bolts returned from workshop'),

-- ===== APRIL 2026 =====
(46, 'TXN-2026-046','Issue', 8, 3,18, 31,  3,  15,  12,4800.00,14400.00,'2026-04-09 14:00:00', 2, 'RM conveyor belt replacement'),
(47, 'TXN-2026-047','Issue', 6, 3,18, 32, 20, 280, 260,  85.00, 1700.00,'2026-04-09 14:05:00', 2, 'RM V-belts for drive'),
(48, 'TXN-2026-048','Issue', 7, 3,18, NULL,15, 200, 185, 120.00, 1800.00,'2026-04-09 14:10:00', 2, 'RM heavy V-belts'),
(49, 'TXN-2026-049','Issue', 9, 1,19, NULL,80, 860, 780, 180.00,14400.00,'2026-04-12 14:00:00', 2, 'BF quarterly PM hydraulic oil'),
(50, 'TXN-2026-050','Issue',11, 1,19,NULL,100, 720, 620,  95.00, 9500.00,'2026-04-12 14:05:00', 2, 'BF quarterly PM gear oil'),
(51, 'TXN-2026-051','Issue',12, 1,19, NULL,20, 182, 162, 340.00, 6800.00,'2026-04-12 14:10:00', 2, 'BF quarterly PM grease'),
(52, 'TXN-2026-052','Issue',33, 9,20, NULL, 2,  25,  23,1800.00, 3600.00,'2026-04-16 15:00:00', 2, 'Utilities cooling mechanical seals'),
(53, 'TXN-2026-053','Issue',44, 9,20, NULL, 8,  65,  57, 485.00, 3880.00,'2026-04-16 15:05:00', 2, 'Hydraulic hoses for pump'),
(54, 'TXN-2026-054','Issue',39, 2,21, 33, 50, 700, 650,  95.00, 4750.00,'2026-04-18 09:00:00', 2, 'SMS EAF emergency welding electrodes'),
(55, 'TXN-2026-055','Issue',40, 2,21, 34, 30, 330, 300, 115.00, 3450.00,'2026-04-18 09:05:00', 2, 'SMS EAF emergency electrodes E-7018'),
(56, 'TXN-2026-056','Issue',41, 2,21, 35,  5,  33,  28,2800.00,14000.00,'2026-04-18 09:10:00', 2, 'MIG wire for EAF repair'),
(57, 'TXN-2026-057','Issue',21, 6,22, 26,  8, 95,  87, 1250.00,10000.00,'2026-04-24 15:00:00', 2, 'Electrical panel contactor'),
(58, 'TXN-2026-058','Issue',23, 6,22, NULL, 4,  45,  41, 320.00, 1280.00,'2026-04-24 15:05:00', 2, 'Fuses for panel'),
(59, 'TXN-2026-059','Issue',22, 6,22, NULL,10,  93,  83, 480.00, 4800.00,'2026-04-24 15:10:00', 2, 'Relays for panel'),
(60, 'TXN-2026-060','Adjustment_In', 6, NULL,NULL,NULL,100, 260, 360,  85.00, 8500.00,'2026-04-20 11:00:00', 2, 'V-belt stock received'),
(61, 'TXN-2026-061','Adjustment_In',22, NULL,NULL,NULL, 50,  83, 133, 480.00,24000.00,'2026-04-25 14:00:00', 2, 'Relay replenishment'),
(62, 'TXN-2026-062','Adjustment_In',36, NULL,NULL,NULL, 80, 405, 485,  85.00, 6800.00,'2026-04-26 10:00:00', 2, 'Safety gloves restocking'),
(63, 'TXN-2026-063','Issue',36, 5,17,NULL, 30, 485, 455, 85.00,  2550.00,'2026-04-05 14:00:00', 2, 'Workshop monthly safety gloves'),
(64, 'TXN-2026-064','Issue',49, 5,17,NULL, 10, 342, 332, 45.00,   450.00,'2026-04-05 14:05:00', 2, 'Workshop cotton waste'),

-- ===== MAY 2026 =====
(65, 'TXN-2026-065','Issue', 3, 1,23, NULL,10, 154, 144, 780.00, 7800.00,'2026-05-05 14:00:00', 2, 'BF planned shutdown bearings'),
(66, 'TXN-2026-066','Issue', 4, 1,23, NULL, 6,  60,  54, 520.00, 3120.00,'2026-05-05 14:05:00', 2, 'BF self-aligning bearings'),
(67, 'TXN-2026-067','Issue',46, 1,23, NULL,120, 280, 160,  85.00,10200.00,'2026-05-05 14:10:00', 2, 'BF red oxide primer for repair'),
(68, 'TXN-2026-068','Issue', 2, 3,24, 36,  6, 208, 202, 420.00, 2520.00,'2026-05-08 12:00:00', 2, 'RM stand motor bearing emergency'),
(69, 'TXN-2026-069','Issue',30, 3,24, 37,  6,  97,  91, 125.00,  750.00,'2026-05-08 12:05:00', 2, 'RM oil seals'),
(70, 'TXN-2026-070','Issue',36, 5,25, NULL,25, 455, 430,  85.00, 2125.00,'2026-05-13 14:00:00', 2, 'Workshop May safety gloves'),
(71, 'TXN-2026-071','Issue',49, 5,25, NULL, 8, 332, 324,  45.00,  360.00,'2026-05-13 14:05:00', 2, 'Workshop cotton waste May'),
(72, 'TXN-2026-072','Issue', 4, 4,26, 38,  4,  54,  50, 520.00, 2080.00,'2026-05-17 14:00:00', 2, 'PP feedpump thrust bearing'),
(73, 'TXN-2026-073','Issue',44, 4,26, 39,  6,  57,  51, 485.00, 2910.00,'2026-05-17 14:05:00', 2, 'PP hydraulic hose replacement'),
(74, 'TXN-2026-074','Issue', 9, 2,27, NULL,50, 860, 810, 180.00, 9000.00,'2026-05-21 14:00:00', 2, 'SMS May PM hydraulic oil'),
(75, 'TXN-2026-075','Issue',12, 2,27, NULL,10, 162, 152, 340.00, 3400.00,'2026-05-21 14:05:00', 2, 'SMS May PM grease'),
(76, 'TXN-2026-076','Issue',31, 2,27, NULL,20,  45,  25,  85.00, 1700.00,'2026-05-21 14:10:00', 2, 'SMS May PM o-rings'),
(77, 'TXN-2026-077','Issue',22, 7,28, NULL,10, 133, 123, 480.00, 4800.00,'2026-05-26 15:00:00', 2, 'Instrumentation relays'),
(78, 'TXN-2026-078','Issue',24, 7,28, NULL,15, 120, 105, 195.00, 2925.00,'2026-05-26 15:05:00', 2, 'Instrumentation push buttons'),
(79, 'TXN-2026-079','Issue',31, 7,28, NULL, 8,  25,  17,  85.00,  680.00,'2026-05-26 15:10:00', 2, 'Instrumentation o-rings'),
(80, 'TXN-2026-080','Adjustment_In', 1, NULL,NULL,NULL,100, 280, 380, 350.00,35000.00,'2026-05-10 11:00:00', 2, 'Ball bearing stock top-up'),
(81, 'TXN-2026-081','Adjustment_In',40, NULL,NULL,NULL,100, 300, 400, 115.00,11500.00,'2026-05-12 14:00:00', 2, 'Welding electrode E-7018 stock'),
(82, 'TXN-2026-082','Adjustment_In',46, NULL,NULL,NULL,200, 160, 360,  85.00,17000.00,'2026-05-20 10:00:00', 2, 'Red oxide primer replenishment'),
(83, 'TXN-2026-083','Adjustment_In',31, NULL,NULL,NULL, 80,  17,  97,  85.00, 6800.00,'2026-05-25 11:00:00', 2, 'O-ring stock received'),
(84, 'TXN-2026-084','Adjustment_In',12, NULL,NULL,NULL, 50, 152, 202, 340.00,17000.00,'2026-05-28 14:00:00', 2, 'Grease stock replenishment'),

-- ===== JUNE 2026 =====
(85, 'TXN-2026-085','Issue', 1, 1,29, 40, 12, 380, 368, 350.00, 4200.00,'2026-06-01 11:00:00', 2, 'BF No.3 blower bearing emergency'),
(86, 'TXN-2026-086','Issue',30, 1,29, 41,  6,  91,  85, 125.00,  750.00,'2026-06-01 11:05:00', 2, 'BF oil seal'),
(87, 'TXN-2026-087','Adjustment_In', 6, NULL,NULL,NULL,100, 360, 460, 85.00, 8500.00,'2026-06-02 10:00:00', 2, 'V-belt stock Jun replenishment'),
(88, 'TXN-2026-088','Adjustment_In',36, NULL,NULL,NULL, 60, 430, 490, 85.00, 5100.00,'2026-06-02 11:00:00', 2, 'Safety gloves Jun stock'),
(89, 'TXN-2026-089','Return', 6, 3, 18,NULL,  2, 460, 462, 85.00,  170.00,'2026-06-03 09:00:00', 2, 'Excess V-belts returned from RM');

-- ============================================================
-- ALERTS — realistic low stock / emergency alerts
-- ============================================================
INSERT IGNORE INTO alerts (id, alert_type, severity, material_id, department_id, request_id, alert_message, status, created_at) VALUES
(1,  'Low_Stock',      'Warning',   6,  NULL, NULL, 'V-Belt A-42: Current stock 220 is approaching reorder level (100). Recommend ordering.', 'Resolved', '2026-01-20 09:00:00'),
(2,  'Low_Stock',      'Critical',  3,  NULL, NULL, 'Roller Bearing 32208: Stock at 94, below safety stock (30). Urgent reorder needed.', 'Resolved', '2026-02-10 10:00:00'),
(3,  'Emergency_Request',  'Emergency', NULL, 4, 6,  'Emergency request REQ-2026-006 from Power Plant for turbine bearing. Production impacted.', 'Resolved', '2026-02-03 05:45:00'),
(4,  'Low_Stock',      'Warning',   22, NULL, NULL, 'Relay Omron MY4: Stock at 65, nearing reorder level (35). Order suggested.', 'Resolved', '2026-02-28 09:00:00'),
(5,  'Emergency_Request',  'Emergency', NULL, 3, 11, 'Emergency request REQ-2026-011 from Rolling Mill. Coiler mandrel seized.', 'Resolved', '2026-03-02 07:45:00'),
(6,  'Low_Stock',      'Critical',  31, NULL, NULL, 'O-Ring 50x3: Stock critically low at 17. Below safety stock (20). Reorder immediately.', 'Resolved', '2026-03-22 09:00:00'),
(7,  'Emergency_Request',  'Emergency', NULL, 2, 21, 'Emergency request REQ-2026-021 from SMS. EAF electrode holder failure.', 'Resolved', '2026-04-18 04:45:00'),
(8,  'Low_Stock',      'Warning',   41, NULL, NULL, 'MIG Wire ER70S-6: Stock at 28 reels approaching minimum. Reorder recommended.', 'Resolved', '2026-04-15 09:00:00'),
(9,  'Low_Stock',      'Critical',  8,  NULL, NULL, 'Conveyor Belt 600mm: Only 12 metres remaining. Below safety stock (5m). Order now.', 'Active', '2026-05-25 09:00:00'),
(10, 'Safety_Stock_Breach','Critical',36, NULL,NULL, 'Safety Gloves: Allocation for REQ-031 capped at 30 (safety stock limit). Stock at 430.', 'Active', '2026-06-03 12:15:00'),
(11, 'Shortage',       'Warning',   33, NULL, 35,   'Mechanical Seal 30mm: Zero available. REQ-2026-035 waitlisted. Current stock fully reserved.', 'Active', '2026-06-03 13:45:00'),
(12, 'Low_Stock',      'Warning',   44, NULL, NULL, 'Hydraulic Hose 1/2": Stock at 51, approaching reorder level (30). Consider ordering.', 'Active', '2026-06-03 09:00:00'),
(13, 'Emergency_Request',  'Emergency', NULL, 1, 29, 'Emergency request REQ-2026-029 from Blast Furnace. BF No.3 blower bearing damaged.', 'Acknowledged', '2026-06-01 06:45:00'),
(14, 'Low_Stock',      'Critical',  42, NULL, NULL, 'Argon Gas Cylinder: Only 12 cylinders. Below safety stock (4). Reorder immediately.', 'Active', '2026-06-04 09:00:00'),
(15, 'Waitlist',       'Warning',   NULL,9,  35,   'REQ-2026-035 Utilities: 2 items waitlisted due to low stock. Department notified.', 'Active', '2026-06-03 14:00:00');

-- ============================================================
-- UPDATE MATERIAL RESERVED STOCK based on active reservations
-- ============================================================
UPDATE materials SET reserved_stock = 12 WHERE id = 1;  -- BRG-001 (REQ-029)
UPDATE materials SET reserved_stock = 6  WHERE id = 30; -- SEAL-001 (REQ-029)
UPDATE materials SET reserved_stock = 8  WHERE id = 3;  -- BRG-003 (REQ-030)
UPDATE materials SET reserved_stock = 25 WHERE id = 6;  -- BELT-001 (REQ-030)
UPDATE materials SET reserved_stock = 10 WHERE id = 12; -- LUB-004 (REQ-030)
UPDATE materials SET reserved_stock = 30 WHERE id = 36; -- SAFE-003 (REQ-031)
UPDATE materials SET reserved_stock = 15 WHERE id = 49; -- MISC-001 (REQ-031)
UPDATE materials SET reserved_stock = 5  WHERE id = 44; -- HYDR-002 (REQ-035)

-- ============================================================
UPDATE materials SET current_stock = 368  WHERE id = 1;   -- BRG-001
UPDATE materials SET current_stock = 202  WHERE id = 2;   -- BRG-002
UPDATE materials SET current_stock = 144  WHERE id = 3;   -- BRG-003
UPDATE materials SET current_stock =  50  WHERE id = 4;   -- BRG-004
UPDATE materials SET current_stock =  51  WHERE id = 5;   -- BRG-005
UPDATE materials SET current_stock = 462  WHERE id = 6;   -- BELT-001 (incl. return)
UPDATE materials SET current_stock = 185  WHERE id = 7;   -- BELT-002
UPDATE materials SET current_stock =  12  WHERE id = 8;   -- BELT-003 (near safety stock)
UPDATE materials SET current_stock = 810  WHERE id = 9;   -- LUB-001
UPDATE materials SET current_stock = 320  WHERE id = 10;  -- LUB-002
UPDATE materials SET current_stock = 620  WHERE id = 11;  -- LUB-003
UPDATE materials SET current_stock = 202  WHERE id = 12;  -- LUB-004
UPDATE materials SET current_stock =  45  WHERE id = 13;  -- LUB-005
UPDATE materials SET current_stock =  95  WHERE id = 14;  -- FAST-001
UPDATE materials SET current_stock =  75  WHERE id = 15;  -- FAST-002
UPDATE materials SET current_stock = 380  WHERE id = 16;  -- FAST-003
UPDATE materials SET current_stock =  55  WHERE id = 17;  -- FAST-004
UPDATE materials SET current_stock =  40  WHERE id = 18;  -- FAST-005
UPDATE materials SET current_stock = 620  WHERE id = 19;  -- ELEC-001
UPDATE materials SET current_stock =  28  WHERE id = 20;  -- ELEC-002
UPDATE materials SET current_stock =  87  WHERE id = 21;  -- ELEC-003
UPDATE materials SET current_stock = 123  WHERE id = 22;  -- ELEC-004
UPDATE materials SET current_stock =  41  WHERE id = 23;  -- ELEC-005
UPDATE materials SET current_stock = 105  WHERE id = 24;  -- ELEC-006
UPDATE materials SET current_stock =  57  WHERE id = 25;  -- PIPE-001
UPDATE materials SET current_stock =  40  WHERE id = 26;  -- PIPE-002
UPDATE materials SET current_stock =  22  WHERE id = 27;  -- PIPE-003
UPDATE materials SET current_stock = 130  WHERE id = 28;  -- PIPE-004
UPDATE materials SET current_stock =  29  WHERE id = 29;  -- PIPE-005
UPDATE materials SET current_stock =  85  WHERE id = 30;  -- SEAL-001
UPDATE materials SET current_stock =  97  WHERE id = 31;  -- SEAL-002
UPDATE materials SET current_stock =  60  WHERE id = 32;  -- SEAL-003
UPDATE materials SET current_stock =  23  WHERE id = 33;  -- SEAL-004 (low)
UPDATE materials SET current_stock = 145  WHERE id = 34;  -- SAFE-001
UPDATE materials SET current_stock =  90  WHERE id = 35;  -- SAFE-002
UPDATE materials SET current_stock = 490  WHERE id = 36;  -- SAFE-003 (incl. Jun restock)
UPDATE materials SET current_stock =  35  WHERE id = 37;  -- SAFE-004
UPDATE materials SET current_stock =  55  WHERE id = 38;  -- SAFE-005
UPDATE materials SET current_stock = 650  WHERE id = 39;  -- WELD-001
UPDATE materials SET current_stock = 400  WHERE id = 40;  -- WELD-002
UPDATE materials SET current_stock =  28  WHERE id = 41;  -- WELD-003
UPDATE materials SET current_stock =  12  WHERE id = 42;  -- WELD-004 (critical)
UPDATE materials SET current_stock =  18  WHERE id = 43;  -- HYDR-001
UPDATE materials SET current_stock =  51  WHERE id = 44;  -- HYDR-002
UPDATE materials SET current_stock =  22  WHERE id = 45;  -- HYDR-003
UPDATE materials SET current_stock = 360  WHERE id = 46;  -- PAINT-01
UPDATE materials SET current_stock = 220  WHERE id = 47;  -- PAINT-02
UPDATE materials SET current_stock = 180  WHERE id = 48;  -- PAINT-03
UPDATE materials SET current_stock = 324  WHERE id = 49;  -- MISC-001
UPDATE materials SET current_stock =  88  WHERE id = 50;  -- MISC-002

-- ============================================================
-- APPROVAL WORKFLOW entries
-- ============================================================
INSERT IGNORE INTO approval_workflow (request_id, step_order, step_name, approver_role, approver_id, action, action_remarks, action_at) VALUES
(1,  1, 'Emergency - Bypass Dept Head', 'dept_head',    3,  'Approved', 'Emergency - auto approved',        '2026-01-05 08:30:00'),
(1,  2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Bearing available, issuing now',   '2026-01-05 11:00:00'),
(2,  1, 'Department Head Approval',     'dept_head',    6,  'Approved', 'PM schedule confirmed',            '2026-01-08 10:00:00'),
(2,  2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Approved for PM',                  '2026-01-09 09:00:00'),
(6,  1, 'Emergency - Bypass Dept Head', 'dept_head',    10, 'Approved', 'Emergency bypass',                '2026-02-03 06:00:00'),
(6,  2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Critical - issuing immediately',   '2026-02-03 07:00:00'),
(11, 1, 'Emergency - Bypass Dept Head', 'dept_head',    8,  'Approved', 'Emergency - production down',     '2026-03-02 08:00:00'),
(11, 2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Allocating emergency stock',       '2026-03-02 09:00:00'),
(21, 1, 'Emergency - Bypass Dept Head', 'dept_head',    6,  'Approved', 'EAF down - critical emergency',   '2026-04-18 05:00:00'),
(21, 2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Emergency overriding waitlist',    '2026-04-18 06:00:00'),
(29, 1, 'Emergency - Bypass Dept Head', 'dept_head',    3,  'Approved', 'BF No.3 down - urgent',           '2026-06-01 07:00:00'),
(29, 2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Allocated from reserve stock',     '2026-06-01 08:30:00'),
(32, 1, 'Department Head Approval',     'dept_head',    6,  'Approved', 'SMS converter repair needed',      '2026-06-04 10:00:00'),
(33, 1, 'Department Head Approval',     'dept_head',    10, 'Approved', 'Seal failure confirmed by PP',     '2026-06-04 09:00:00'),
(34, 1, 'Department Head Approval',     'dept_head',    14, 'Pending',  NULL, NULL),
(35, 1, 'Department Head Approval',     'dept_head',    20, 'Approved', 'Cooling tower needs attention',    '2026-06-03 11:00:00'),
(35, 2, 'Store Manager Review',         'store_manager', 2, 'Approved', 'Partial alloc - low stock',        '2026-06-03 13:00:00');
