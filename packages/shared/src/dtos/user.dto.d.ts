import { UserRole, UserStatus } from '../enums';
export interface UserDto {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    mfaEnabled: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserDto {
    email: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}
export interface UpdateUserDto {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface LoginResponseDto {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
