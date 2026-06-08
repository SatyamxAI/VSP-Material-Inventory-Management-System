// db.js - Database configuration with connection pool
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT || '3306'),
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASS     || '',
    database:           process.env.DB_NAME     || 'vsp_inventory',
    waitForConnections: true,
    connectionLimit:    20,
    queueLimit:         0,
    timezone:           '+05:30',
    dateStrings:        false,
    supportBigNumbers:  true,
    bigNumberStrings:   false,
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL connected — database:', process.env.DB_NAME || 'vsp_inventory');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed:', err.message);
    });

module.exports = pool;
