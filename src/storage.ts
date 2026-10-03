export type Memo = { id: string; author: 'kongdol' | 'kongsun'; content: string; created_at: string; updated_at: string; record_date: string };
export type WeightRecord = { date: string; kg: number };
export type CurrentTravel = { place: string; zone: string; clockLabel: string; status: string };
export const homeStatuses = [{ value: 'baseball', label: '야구보기' }, { value: 'sleep', label: '취침' }, { value: 'eating', label: '밥먹는중' }, { value: 'resume', label: '자소서작성중' }, { value: 'certificate', label: '자격증공부중' }];
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const sharedStorageConfigured = Boolean(url && key);
async function request(path: string, init?: RequestInit) {
  if (!navigator.onLine) throw new Error('오프라인에서는 저장하거나 새 기록을 불러올 수 없어요. 연결 후 다시 시도해주세요.');
  if (!sharedStorageConfigured) throw new Error('공유 저장 연결 전에는 등록할 수 없습니다.');
  const response = await fetch(`${url}${path}`, { ...init, headers: { apikey: key, 'Content-Type': 'application/json', ...init?.headers }, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.message === 'string' && path.startsWith('/functions/') ? error.message : '공유 기록을 불러오지 못했습니다. 다시 시도해주세요.');
  }
  return response.json();
}
export async function loadMemoDays(before?: string) {
  const rows = await request('/rest/v1/rpc/get_memo_days', { method: 'POST', body: JSON.stringify({ before_date: before ?? null }) });
  if (!Array.isArray(rows) || !rows.every(row => typeof row.id === 'string' && ['kongdol', 'kongsun'].includes(row.author) && typeof row.content === 'string' && typeof row.created_at === 'string' && typeof row.updated_at === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(row.record_date))) throw new Error('메모 응답을 확인할 수 없습니다.');
  const days = [...new Set(rows.map(row => row.record_date))].sort().reverse();
  return { memos: rows.filter(row => days.slice(0, 6).includes(row.record_date)) as Memo[], hasOlder: days.length > 6 };
}
export async function loadSharedRecords() {
  const weights = await request('/rest/v1/weight_records?select=record_date,kg&order=record_date.asc');
  if (!Array.isArray(weights) || !weights.every(row => typeof row.record_date === 'string' && typeof row.kg === 'number' && Number.isFinite(row.kg) && row.kg > 0)) throw new Error('체중 응답을 확인할 수 없습니다.');
  return { weights: weights.map(row => ({ date: row.record_date, kg: row.kg })) as WeightRecord[] };
}
export async function loadCurrentState() {
  const result = await request('/functions/v1/konglog-current');
  if (!homeStatuses.some(status => status.value === result.homeStatus)) throw new Error('상태 응답을 확인할 수 없습니다.');
  const travel = result.travel;
  if (travel !== null) {
    if (!travel || !['place','zone','clockLabel','status'].every(field => typeof travel[field] === 'string')) throw new Error('현재 여행 응답을 확인할 수 없습니다.');
    new Intl.DateTimeFormat('ko-KR', { timeZone: travel.zone });
  }
  return { homeStatus: result.homeStatus as string, travel: travel as CurrentTravel | null };
}
export async function saveSharedRecord(input: { kind: 'memo'; author: Memo['author']; date: string; id: string; content: string; code: string } | { kind: 'weight'; kg: number; code: string } | { kind: 'home_status'; status: string; code: string }) {
  const result = await request('/functions/v1/konglog-write', { method: 'POST', body: JSON.stringify(input) });
  return typeof result.message === 'string' ? result.message : '저장했습니다.';
}
