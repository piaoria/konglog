import { weightChallenge } from './data';

export function parseWeight(input: string) {
  const kg = Number(input);
  return input.trim() && Number.isFinite(kg) && kg > 0 ? kg : null;
}

// The future server write uses the Korean date as the daily upsert key.
export function upsertWeight(records: typeof weightChallenge.records, record: typeof weightChallenge.records[number]) {
  return [...records.filter(item => item.date !== record.date), record].sort((a, b) => a.date.localeCompare(b.date));
}

export function weightPoints(records: typeof weightChallenge.records) {
  if (!records.length) return [];
  const values = records.map(record => record.kg);
  const min = Math.min(...values), max = Math.max(...values);
  return records.map((record, index) => ({ ...record, x: records.length === 1 ? 160 : 18 + index * 284 / (records.length - 1), y: max === min ? 44 : 12 + (max - record.kg) * 65 / (max - min) }));
}
