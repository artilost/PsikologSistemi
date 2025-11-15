import { ValueObject } from '../base/value-object';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  static create(amount: number, currency = 'TRY'): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    
    if (!this.isValidCurrency(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;

    return new Money({ amount: roundedAmount, currency: currency.toUpperCase() });
  }

  static isValidCurrency(currency: string): boolean {
    const validCurrencies = ['TRY', 'USD', 'EUR', 'GBP'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Result cannot be negative');
    }
    return Money.create(result, this.currency);
  }

  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new Error('Multiplier cannot be negative');
    }
    return Money.create(this.amount * multiplier, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('Divisor must be positive');
    }
    return Money.create(this.amount / divisor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  greaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount > other.amount;
  }

  lessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  toFormatted(): string {
    const formatter = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: this.currency,
    });
    return formatter.format(this.amount);
  }
}

