import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarWeeks, startOfWeek, getMonth, getYear, getDate } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateRandomCode = (length: number): string => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

/**
 * Calculates the academic week number based on a given date.
 * Assumes the academic year starts on the second Monday of September.
 * @param date The date for which to calculate the academic week.
 * @returns The academic week number.
 */
export function getAcademicWeek(date: Date): number {
  const currentYear = getYear(date);
  const september = 8; // September is month 8 (0-indexed)

  // Determine the start year of the current academic year
  const academicYearStartYear = getMonth(date) >= september ? currentYear : currentYear - 1;
  const firstOfSeptember = new Date(academicYearStartYear, september, 1);
  firstOfSeptember.setHours(0, 0, 0, 0);

  // Find the first Monday of September
  let firstMonday = new Date(firstOfSeptember);
  // getDay() returns 0 for Sunday, 1 for Monday, etc. We want to find the first Monday.
  const dayOfWeek = firstOfSeptember.getDay();
  const dateOffset = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek);
  firstMonday.setDate(1 + dateOffset);

  // The second Monday of September is the start of the academic year
  const secondMonday = new Date(firstMonday);
  secondMonday.setDate(firstMonday.getDate() + 7);

  // If the given date is before the start of this academic year, it's considered week 1
  if (date < secondMonday) {
    return 1;
  }

  // Calculate the difference in calendar weeks
  const startOfAcademicWeek = startOfWeek(secondMonday, { weekStartsOn: 1 });
  const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 });
  
  const weekNumber = differenceInCalendarWeeks(startOfCurrentWeek, startOfAcademicWeek, { weekStartsOn: 1 }) + 1;

  return weekNumber;
}
