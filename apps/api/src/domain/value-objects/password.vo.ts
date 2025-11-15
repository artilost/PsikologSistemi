import { ValueObject } from '../base/value-object';
import * as bcrypt from 'bcrypt';

interface PasswordProps {
  value: string;
  hashed: boolean;
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  get isHashed(): boolean {
    return this.props.hashed;
  }

  static create(password: string, hashed = false): Password {
    if (!hashed && !this.isValid(password)) {
      throw new Error(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }
    return new Password({ value: password, hashed });
  }

  static isValid(password: string): boolean {
    if (password.length < 8) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber;
  }

  async hash(): Promise<Password> {
    if (this.isHashed) {
      return this;
    }

    const hashedValue = await bcrypt.hash(this.value, 10);
    return new Password({ value: hashedValue, hashed: true });
  }

  async compare(plainPassword: string): Promise<boolean> {
    if (!this.isHashed) {
      throw new Error('Cannot compare unhashed password');
    }
    return bcrypt.compare(plainPassword, this.value);
  }
}

