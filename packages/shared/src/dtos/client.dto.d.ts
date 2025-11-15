export interface ClientProfileDto {
    id: string;
    userId: string;
    dateOfBirth?: Date;
    gender?: string;
    occupation?: string;
    emergContact?: string;
    emergPhone?: string;
    address?: string;
    referredBy?: string;
    consentSigned: boolean;
    consentSignedAt?: Date;
    recordingConsent: boolean;
    dataProcessConsent: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateClientDto {
    userId?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    occupation?: string;
    emergContact?: string;
    emergPhone?: string;
    address?: string;
    referredBy?: string;
}
export interface UpdateClientDto {
    dateOfBirth?: Date;
    gender?: string;
    occupation?: string;
    emergContact?: string;
    emergPhone?: string;
    address?: string;
    consentSigned?: boolean;
    recordingConsent?: boolean;
    dataProcessConsent?: boolean;
    isActive?: boolean;
}
