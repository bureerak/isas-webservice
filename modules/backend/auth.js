const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_super_secret_key_2024';
const JWT_EXPIRES_IN = '8h'; // หมดอายุใน 8 ชั่วโมง (1 กะทำงาน)

/**
 * สร้าง JWT token จากข้อมูล Staff
 */
const generateToken = (staff) => {
    return jwt.sign(
        { id: staff.id, username: staff.username, role: staff.role, full_name: staff.full_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Middleware: ตรวจสอบว่ามี JWT token ที่ถูกต้องใน Authorization header
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.staff = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

/**
 * Middleware Factory: ตรวจสอบ Role ที่ได้รับอนุญาต
 * Usage: requireRole('manager') or requireRole(['manager', 'receptionist'])
 */
const requireRole = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        if (!req.staff) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }
        if (!roles.includes(req.staff.role)) {
            return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}.` });
        }
        next();
    };
};

module.exports = { generateToken, verifyToken, requireRole };
