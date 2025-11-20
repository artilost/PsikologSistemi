import { PaymentStatus, PaymentMethod } from '../enums';
export interface PaymentDto {
    id: string;
    sessionId?: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    paidAt?: Date;
    paidAmount?: number;
    remainingAmount?: number;
    invoiceUrl?: string;
    receiptUrl?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreatePaymentDto {
    sessionId?: string;
    userId: string;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    notes?: string;
}
export interface UpdatePaymentDto {
    status?: PaymentStatus;
    paidAmount?: number;
    method?: PaymentMethod;
    notes?: string;
}
export interface ProcessPaymentDto {
    paymentId: string;
    amount: number;
    method: PaymentMethod;
    paymentDetails?: Record<string, unknown>;
}
