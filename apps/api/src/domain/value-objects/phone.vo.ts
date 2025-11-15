import { ValueObject } from '../base/value-object';

interface PhoneProps {
  value: string;
}

export class Phone extends ValueObject<PhoneProps> {
  private constructor(props: PhoneProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(phone: string): Phone {
    const normalized = this.normalize(phone);
    if (!this.isValid(normalized)) {
      throw new Error(`Invalid phone number: ${phone}`);
    }
    return new Phone({ value: normalized });
  }

  static normalize(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add +90 prefix if not present
    if (digits.startsWith('90')) {
      return `+${digits}`;
    } else if (digits.startsWith('5') && digits.length === 10) {
      return `+90${digits}`;
    } else if (digits.startsWith('0') && digits.length === 11) {
      return `+90${digits.substring(1)}`;
    }
    
    return `+${digits}`;
  }

  static isValid(phone: string): boolean {
    // Turkish phone number: +90 5XX XXX XX XX
    const phoneRegex = /^\+905\d{9}$/;
    return phoneRegex.test(phone);
  }

  toString(): string {
    return this.value;
  }

  toFormatted(): string {
    // Format: +90 5XX XXX XX XX
    const digits = this.value.replace(/\D/g, '');
    return `+90 ${digits.substring(2, 5)} ${digits.substring(5, 8)} ${digits.substring(8, 10)} ${digits.substring(10)}`;
  }
}

