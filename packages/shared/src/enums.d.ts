export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    THERAPIST = "THERAPIST",
    ASSISTANT = "ASSISTANT",
    CLIENT = "CLIENT"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
}
export declare enum AppointmentStatus {
    SCHEDULED = "SCHEDULED",
    CONFIRMED = "CONFIRMED",
    CHECKED_IN = "CHECKED_IN",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW",
    RESCHEDULED = "RESCHEDULED"
}
export declare enum SessionNoteStatus {
    DRAFT = "DRAFT",
    COMPLETED = "COMPLETED",
    REVIEWED = "REVIEWED",
    ARCHIVED = "ARCHIVED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    REFUNDED = "REFUNDED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    CREDIT_CARD = "CREDIT_CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    ONLINE = "ONLINE",
    INSURANCE = "INSURANCE"
}
export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    WHATSAPP = "WHATSAPP",
    PUSH = "PUSH",
    IN_APP = "IN_APP"
}
