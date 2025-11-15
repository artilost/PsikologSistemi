"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientSchema = exports.createClientSchema = void 0;
const zod_1 = require("zod");
exports.createClientSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçerli bir e-posta adresi giriniz').optional(),
    phone: zod_1.z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
    firstName: zod_1.z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
    lastName: zod_1.z.string().min(2, 'Soyad en az 2 karakter olmalıdır').optional(),
    dateOfBirth: zod_1.z.coerce.date().optional(),
    gender: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    emergContact: zod_1.z.string().optional(),
    emergPhone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    referredBy: zod_1.z.string().optional(),
});
exports.updateClientSchema = zod_1.z.object({
    dateOfBirth: zod_1.z.coerce.date().optional(),
    gender: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    emergContact: zod_1.z.string().optional(),
    emergPhone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    consentSigned: zod_1.z.boolean().optional(),
    recordingConsent: zod_1.z.boolean().optional(),
    dataProcessConsent: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=client.schema.js.map