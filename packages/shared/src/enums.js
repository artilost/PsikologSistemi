"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.PaymentMethod = exports.PaymentStatus = exports.SessionNoteStatus = exports.AppointmentStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["THERAPIST"] = "THERAPIST";
    UserRole["ASSISTANT"] = "ASSISTANT";
    UserRole["CLIENT"] = "CLIENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "SCHEDULED";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["CHECKED_IN"] = "CHECKED_IN";
    AppointmentStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
    AppointmentStatus["RESCHEDULED"] = "RESCHEDULED";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var SessionNoteStatus;
(function (SessionNoteStatus) {
    SessionNoteStatus["DRAFT"] = "DRAFT";
    SessionNoteStatus["COMPLETED"] = "COMPLETED";
    SessionNoteStatus["REVIEWED"] = "REVIEWED";
    SessionNoteStatus["ARCHIVED"] = "ARCHIVED";
})(SessionNoteStatus || (exports.SessionNoteStatus = SessionNoteStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["ONLINE"] = "ONLINE";
    PaymentMethod["INSURANCE"] = "INSURANCE";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["WHATSAPP"] = "WHATSAPP";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["IN_APP"] = "IN_APP";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=enums.js.map