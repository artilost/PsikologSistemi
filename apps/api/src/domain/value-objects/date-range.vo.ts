import { ValueObject } from '../base/value-object';

interface DateRangeProps {
  startDate: Date;
  endDate: Date;
}

export class DateRange extends ValueObject<DateRangeProps> {
  private constructor(props: DateRangeProps) {
    super(props);
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  static create(startDate: Date, endDate: Date): DateRange {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }
    return new DateRange({ startDate, endDate });
  }

  /**
   * Get duration in minutes
   */
  getDurationInMinutes(): number {
    return Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60));
  }

  /**
   * Get duration in hours
   */
  getDurationInHours(): number {
    return this.getDurationInMinutes() / 60;
  }

  /**
   * Check if a date is within this range
   */
  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  /**
   * Check if this range overlaps with another range
   */
  overlaps(other: DateRange): boolean {
    return this.startDate < other.endDate && this.endDate > other.startDate;
  }

  /**
   * Check if the start date is in the past
   */
  isPast(): boolean {
    return this.endDate < new Date();
  }

  /**
   * Check if the range is currently active
   */
  isCurrent(): boolean {
    const now = new Date();
    return this.contains(now);
  }

  /**
   * Check if the start date is in the future
   */
  isFuture(): boolean {
    return this.startDate > new Date();
  }
}

