"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionNotesSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.createSessionSchema = zod_1.z.object({
    appointmentId: zod_1.z.string().cuid('Geçersiz randevu ID'),
    actualStart: zod_1.z.coerce.date().optional(),
    actualEnd: zod_1.z.coerce.date().optional(),
});
exports.updateSessionNotesSchema = zod_1.z.object({
    clinicalNotes: zod_1.z.string().max(5000, 'Klinik notlar en fazla 5000 karakter olabilir').optional(),
    treatmentPlan: zod_1.z.string().max(5000, 'Tedavi planı en fazla 5000 karakter olabilir').optional(),
    progressNotes: zod_1.z.string().max(5000, 'İlerleme notları en fazla 5000 karakter olabilir').optional(),
    diagnosis: zod_1.z.string().max(1000, 'Tanı en fazla 1000 karakter olabilir').optional(),
    interventions: zod_1.z.array(zod_1.z.string()).optional(),
    homework: zod_1.z.string().max(2000, 'Ödev en fazla 2000 karakter olabilir').optional(),
    riskAssessment: zod_1.z.string().max(2000, 'Risk değerlendirmesi en fazla 2000 karakter olabilir').optional(),
    noteStatus: zod_1.z.nativeEnum(enums_1.SessionNoteStatus).optional(),
});
//# sourceMappingURL=session.schema.js.map