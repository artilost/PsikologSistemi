import { UserDto } from './user.dto';

export interface ClientProfileDto {
  id: string;
  userId: string;
  user?: UserDto;
  dateOfBirth?: Date;
  gender?: string;
  occupation?: string;
  emergContact?: string;
  emergPhone?: string;
  address?: string;
  
  // Medical info (encrypted)
  medicalHistory?: string;
  currentMedication?: string;
  allergies?: string;
  referredBy?: string;
  
  // Consent & Legal
  consentSigned: boolean;
  consentSignedAt?: Date;
  recordingConsent: boolean;
  dataProcessConsent: boolean;
  
  // Status
  isActive: boolean;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientProfileDto {
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  occupation?: string;
  emergContact?: string;
  emergPhone?: string;
  address?: string;
  medicalHistory?: string;
  currentMedication?: string;
  allergies?: string;
  referredBy?: string;
  consentSigned?: boolean;
  recordingConsent?: boolean;
  dataProcessConsent?: boolean;
  notes?: string;
}

export interface UpdateClientProfileDto extends Partial<CreateClientProfileDto> {
  isActive?: boolean;
  therapistProfileId?: string | null;
}

export interface ClientWithProfileDto extends UserDto {
  clientProfile?: ClientProfileDto;
}
