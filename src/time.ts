import { travelSnapshot, page } from './data';
export function localParts(now: Date, zone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, label: `${Number(parts.month)}월 ${Number(parts.day)}일`, time: `${parts.hour}:${parts.minute}`, night: Number(parts.hour) < 7 || Number(parts.hour) >= 19 };
}
export function inclusiveDays(start: string, end: string) { return Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) + 1; }
export function countdown(now: Date, arrival = page.arrival) {
  const seconds = Math.max(0, Math.floor((Date.parse(arrival) - now.getTime()) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds % 86400 / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60, elapsed: now.getTime() >= Date.parse(arrival) };
}
export function scheduledFlight(now: Date, flight = travelSnapshot.flight) {
  if (!flight || now.getTime() >= Date.parse(flight.arrival)) return null;
  return { number: flight.number, minutes: Math.ceil((Date.parse(flight.arrival) - now.getTime()) / 60000) };
}
