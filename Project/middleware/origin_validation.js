const { AUTH_COOKIE_NAME } = require('./auth_cookie');

const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const permittedOrigins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

const isAllowedOrigin = (origin) => permittedOrigins.includes(origin);

const validateCookieRequestOrigin = (req, res, next) => {
    const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    if (!stateChanging || !req.cookies[AUTH_COOKIE_NAME]) {
        return next();
    }

    if (!isAllowedOrigin(req.get('Origin'))) {
        return res.status(403).json({
            success: false,
            message: 'Invalid request origin'
        });
    }

    next();
};

module.exports = {
    permittedOrigins,
    isAllowedOrigin,
    validateCookieRequestOrigin
};
