// Workaround for Node 22+ / 25+ localStorage issue with Jest
// "SecurityError: Cannot initialize local storage without a --localstorage-file path"

try {
    if (typeof global.localStorage !== 'undefined') {
        Object.defineProperty(global, 'localStorage', { value: undefined, writable: true });
    }
    if (typeof global.sessionStorage !== 'undefined') {
        Object.defineProperty(global, 'sessionStorage', { value: undefined, writable: true });
    }
} catch (e) {
    console.warn('Failed to patch localStorage/sessionStorage:', e);
}

// Set test environment variables if not already set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/psikolog_sistemi_test';
}

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_purposes_only_32chars';
}

if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_for_testing_purposes_32chars';
}

if (!process.env.JWT_EXPIRES_IN) {
    process.env.JWT_EXPIRES_IN = '7d';
}

if (!process.env.JWT_REFRESH_EXPIRES_IN) {
    process.env.JWT_REFRESH_EXPIRES_IN = '30d';
}

if (!process.env.PORT) {
    process.env.PORT = '3001';
}

if (!process.env.API_PREFIX) {
    process.env.API_PREFIX = 'api/v1';
}

if (!process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
}

if (!process.env.REDIS_HOST) {
    process.env.REDIS_HOST = 'localhost';
}

if (!process.env.REDIS_PORT) {
    process.env.REDIS_PORT = '6379';
}

if (!process.env.REDIS_DB) {
    process.env.REDIS_DB = '1';
}

if (!process.env.THROTTLE_TTL) {
    process.env.THROTTLE_TTL = '60';
}

if (!process.env.THROTTLE_LIMIT) {
    process.env.THROTTLE_LIMIT = '100';
}

if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = 'error';
}