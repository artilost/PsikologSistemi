"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.calculateDuration = calculateDuration;
exports.isValidEmail = isValidEmail;
exports.isValidTurkishPhone = isValidTurkishPhone;
exports.maskEmail = maskEmail;
exports.maskPhone = maskPhone;
function formatCurrency(amount, currency = 'TRY') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
    }).format(amount);
}
function formatDate(date, format = 'short') {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (format === 'short') {
        return new Intl.DateTimeFormat('tr-TR').format(d);
    }
    return new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(d);
}
function calculateDuration(start, end) {
    const startTime = typeof start === 'string' ? new Date(start) : start;
    const endTime = typeof end === 'string' ? new Date(end) : end;
    return Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidTurkishPhone(phone) {
    const phoneRegex = /^(\+90|0)?5\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}
function maskEmail(email) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
}
function maskPhone(phone) {
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}
//# sourceMappingURL=utils.js.map