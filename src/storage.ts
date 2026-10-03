export type Memo = { id: string; author: 'kongdol' | 'kongsun'; content: string; created_at: string };
export type WeightRecord = { date: string; kg: number };
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const sharedStorageConfigured = Boolean(url && key);

async function request(path: string, init?: RequestInit) {
  if (!sharedStorageConfigured) throw new Error('공유 저장 연결 전에는 등록할 수 없습니다.');
  const response = await fetch(`${url}${path}`, { ...init, headers: { apikey: key, 'Content-Type': 'application/json', ...init?.headers }, credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.message === 'string' && path.startsWith('/functions/') ? error.message : '공유 기록을 불러오지 못했습니다. 다시 시도해주세요.');
  }
  return response.json();
}
export async function loadSharedRecords() {
  const [memos, weights] = await Promise.all([
    request('/rest/v1/memos?select=id,author,content,created_at&order=created_at.desc,id.desc&limit=7'),
    request('/rest/v1/weight_records?select=record_date,kg&order=record_date.asc'),
  ]);
  if (!Array.isArray(memos) || !memos.every(row => typeof row.id === 'string' && ['kongdol', 'kongsun'].includes(row.author) && typeof row.content === 'string' && typeof row.created_at === 'string') || !Array.isArray(weights) || !weights.every(row => typeof row.record_date === 'string' && typeof row.kg === 'number' && Number.isFinite(row.kg) && row.kg > 0)) throw new Error('공유 기록 응답을 확인할 수 없습니다.');
  return { memos: memos.slice(0, 6) as Memo[], hasOlderMemos: memos.length > 6, weights: weights.map(row => ({ date: row.record_date, kg: row.kg })) as WeightRecord[] };
}
export async function saveSharedRecord(input: { kind: 'memo'; id: string; content: string; code: string } | { kind: 'weight'; kg: number; code: string }) {
  const result = await request('/functions/v1/konglog-write', { method: 'POST', body: JSON.stringify(input) });
  return typeof result.message === 'string' ? result.message : '등록했습니다.';
}

export async function loadOlderMemos(oldest: Memo) {
  const cursor = new URLSearchParams({
    select: 'id,author,content,created_at', order: 'created_at.desc,id.desc', limit: '7',
    or: `(created_at.lt.${oldest.created_at},and(created_at.eq.${oldest.created_at},id.lt.${oldest.id}))`,
  });
  const rows = await request(`/rest/v1/memos?${cursor}`);
  if (!Array.isArray(rows) || !rows.every(row => typeof row.id === 'string' && ['kongdol', 'kongsun'].includes(row.author) && typeof row.content === 'string' && typeof row.created_at === 'string')) throw new Error('이전 메모를 불러오지 못했습니다.');
  return { memos: rows.slice(0, 6) as Memo[], hasOlderMemos: rows.length > 6 };
}
