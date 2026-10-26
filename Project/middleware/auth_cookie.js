const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const AUTH_COOKIE_NAME = 'auth_token';

const authCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_DAY_MS
};

const clearAuthCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
};

module.exports = {
    AUTH_COOKIE_NAME,
    authCookieOptions,
    clearAuthCookieOptions
};
