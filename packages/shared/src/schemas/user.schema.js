"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçerli bir e-posta adresi giriniz'),
    phone: zod_1.z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
    password: zod_1.z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    firstName: zod_1.z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: zod_1.z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    role: zod_1.z.nativeEnum(enums_1.UserRole).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçerli bir e-posta adresi giriniz').optional(),
    phone: zod_1.z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
    firstName: zod_1.z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
    lastName: zod_1.z.string().min(2, 'Soyad en az 2 karakter olmalıdır').optional(),
    avatar: zod_1.z.string().url('Geçerli bir URL giriniz').optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: zod_1.z.string().min(1, 'Şifre zorunludur'),
});
//# sourceMappingURL=user.schema.js.map