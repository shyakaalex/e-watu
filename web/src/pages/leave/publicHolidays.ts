export type PublicHoliday = {
  name: string;
  month: number; // 1-12
  day: number;
  note?: string;
};

// Rwanda's official fixed-date public holidays (Government Notice on public holidays).
// Movable religious holidays (Eid al-Fitr, Eid al-Adha) are excluded since their dates
// shift yearly on the lunar calendar and aren't safe to hardcode.
export const RWANDA_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  { name: "New Year's Day", month: 1, day: 1 },
  { name: "Heroes' Day", month: 2, day: 1 },
  { name: 'Genocide against the Tutsi Memorial Day', month: 4, day: 7 },
  { name: 'Labour Day', month: 5, day: 1 },
  { name: 'Independence Day', month: 7, day: 1 },
  { name: 'Liberation Day', month: 7, day: 4 },
  { name: 'Umuganura Day', month: 8, day: 1, note: 'First Friday of August' },
  { name: 'Assumption Day', month: 8, day: 15 },
  { name: 'Christmas Day', month: 12, day: 25 },
  { name: 'Boxing Day', month: 12, day: 26 },
];

function nextOccurrence(holiday: PublicHoliday, from: Date): Date {
  const year = from.getFullYear();
  let date = new Date(year, holiday.month - 1, holiday.day);
  if (date < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    date = new Date(year + 1, holiday.month - 1, holiday.day);
  }
  return date;
}

export function getUpcomingHolidays(from: Date = new Date(), count = 4) {
  return RWANDA_PUBLIC_HOLIDAYS
    .map((h) => ({ ...h, date: nextOccurrence(h, from) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

export function getAllHolidaysSorted(from: Date = new Date()) {
  return getUpcomingHolidays(from, RWANDA_PUBLIC_HOLIDAYS.length);
}
