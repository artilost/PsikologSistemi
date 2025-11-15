"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleAppointmentSchema = exports.cancelAppointmentSchema = exports.updateAppointmentSchema = exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.createAppointmentSchema = zod_1.z.object({
    therapistId: zod_1.z.string().cuid('Geçersiz terapist ID'),
    clientId: zod_1.z.string().cuid('Geçersiz danışan ID'),
    startTime: zod_1.z.coerce.date().refine((date) => date > new Date(), {
        message: 'Randevu tarihi gelecekte olmalıdır',
    }),
    duration: zod_1.z.number().min(15, 'Süre en az 15 dakika olmalıdır').max(240, 'Süre en fazla 240 dakika olabilir'),
    type: zod_1.z.string().optional(),
    isOnline: zod_1.z.boolean().optional(),
    location: zod_1.z.string().optional(),
    appointmentNotes: zod_1.z.string().max(1000, 'Notlar en fazla 1000 karakter olabilir').optional(),
});
exports.updateAppointmentSchema = zod_1.z.object({
    startTime: zod_1.z.coerce.date().optional(),
    duration: zod_1.z.number().min(15).max(240).optional(),
    status: zod_1.z.nativeEnum(enums_1.AppointmentStatus).optional(),
    type: zod_1.z.string().optional(),
    isOnline: zod_1.z.boolean().optional(),
    meetingLink: zod_1.z.string().url('Geçerli bir URL giriniz').optional(),
    location: zod_1.z.string().optional(),
    appointmentNotes: zod_1.z.string().max(1000).optional(),
});
exports.cancelAppointmentSchema = zod_1.z.object({
    reason: zod_1.z.string().max(500, 'İptal nedeni en fazla 500 karakter olabilir').optional(),
});
exports.rescheduleAppointmentSchema = zod_1.z.object({
    newStartTime: zod_1.z.coerce.date().refine((date) => date > new Date(), {
        message: 'Yeni randevu tarihi gelecekte olmalıdır',
    }),
    reason: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=appointment.schema.js.map