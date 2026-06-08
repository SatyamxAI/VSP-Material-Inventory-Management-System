// server.js — Main Application Entry Point
// VSP Material Inventory Management System
// RINL Vizag Steel Plant — Internal ERP
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY MIDDLEWARE ───────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc:  ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            fontSrc:   ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc:    ["'self'", "data:"],
        }
    }
}));
app.use(cors({ origin: `http://localhost:${PORT}`, credentials: true }));

// ── RATE LIMITING ─────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,
    message: { success: false, message: 'Too many login attempts. Please try again later.' }
});
app.use('/api/', limiter);
app.use('/api/auth/login', loginLimiter);

// ── BODY PARSING ─────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── LOGGING ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── STATIC FILES ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API ROUTES ────────────────────────────────────────────────
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

// ── 404 for unknown API routes ────────────────────────────────
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── SPA Fallback (serve index.html for all other routes) ──────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// ── START SERVER ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   VSP Material Inventory Management System v2.0      ║');
    console.log('║   RINL — Vizag Steel Plant Internal ERP               ║');
    console.log(`║   Running on: http://localhost:${PORT}                     ║`);
    console.log(`║   Environment: ${process.env.NODE_ENV || 'development'}                           ║`);
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
