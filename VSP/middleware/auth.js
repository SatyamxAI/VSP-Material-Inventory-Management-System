// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Authorization token required.' });

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const msg = err.name === 'TokenExpiredError' ? 'Session expired. Please login again.' : 'Invalid token.';
        return res.status(401).json({ success: false, message: msg });
    }
};
