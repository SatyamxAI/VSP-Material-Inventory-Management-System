// database/setup.js — Automated Database Setup Script
// Run: node database/setup.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function setup() {
    console.log('\n🔧 VSP Database Setup Script');
    console.log('═══════════════════════════════════════');

    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST || 'localhost',
        port:     process.env.DB_PORT || 3306,
        user:     process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        multipleStatements: true,
    });

    try {
        // Create database
        console.log(`\n📦 Creating database: ${process.env.DB_NAME}`);
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await conn.query(`USE \`${process.env.DB_NAME}\``);
        console.log('✅ Database ready.');

        // Run schema
        console.log('\n📋 Running schema...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await conn.query(schema);
        console.log('✅ Schema applied.');

        // Run seed
        console.log('\n🌱 Inserting seed data...');
        const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        await conn.query(seed);
        console.log('✅ Seed data inserted.');

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║  Database setup complete!                ║');
        console.log('║                                          ║');
        console.log('║  Now run: npm start                      ║');
        console.log('║  Open:    http://localhost:3000          ║');
        console.log('║                                          ║');
        console.log('║  Login Credentials (Password: VSP@2026): ║');
        console.log('║  Admin:    admin@vsp.com               ║');
        console.log('║  Store:    store@vsp.com               ║');
        console.log('║  Dept Hd:  bf.head@vsp.com            ║');
        console.log('║  Dept Usr: bf.user@vsp.com            ║');
        console.log('╚══════════════════════════════════════════╝\n');
    } catch (err) {
        console.error('\n❌ Setup failed:', err.message);
        console.error('Please check your MySQL credentials in .env');
        process.exit(1);
    } finally {
        await conn.end();
    }
}

setup();
