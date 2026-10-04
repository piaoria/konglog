import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMemoDays, saveSharedRecord, type Memo } from './storage';

function Paper({ author, date, memo, editable, disabled, unknown, onSaved }: { author: Memo['author']; date: string; memo?: Memo; editable: boolean; disabled: boolean; unknown: string; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => { setCode(''); setConfirming(false); setRequestId(crypto.randomUUID()); setMessage(''); }, [date]);
  const editing = editable && (!memo || draft !== null);
  const content = draft ?? memo?.content ?? '';
  const name = author === 'kongdol' ? '콩돌' : '콩순';
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || disabled || !content.trim()) return;
    if (!confirming) { setConfirming(true); return; }
    if (!/^[0-9]{4}$/.test(code)) return;
    setSaving(true); setMessage('');
    try {
      const result = await saveSharedRecord({ kind: 'memo', author, date, id: requestId, content: content.trim(), code });
      await onSaved();
      setDraft(null); setCode(''); setConfirming(false); setRequestId(crypto.randomUUID()); setMessage(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : '저장하지 못했습니다. 다시 시도해주세요.'); }
    finally { setSaving(false); }
  }
  return <article className={`daily-paper ${author}`} aria-label={`${date} ${name} 메모`}>
    <div className="paper-heading"><h3>{name}</h3>{memo && <time dateTime={memo.updated_at}>{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(memo.updated_at))}</time>}</div>
    {editing ? <form onSubmit={submit} aria-busy={saving}><fieldset disabled={saving || disabled}>
      {confirming ? <p className="paper-content">{content}</p> : <><label className="visually-hidden" htmlFor={`draft-${author}`}>{name} 메모</label><textarea id={`draft-${author}`} value={content} onChange={event => { setDraft(event.target.value); setRequestId(crypto.randomUUID()); setMessage(''); }} maxLength={2000} rows={5} required placeholder={unknown || "오늘의 한 줄"}/></>}
      {confirming && <><label className="visually-hidden" htmlFor={`code-${author}`}>{name} 작성 코드</label><input className="paper-code" id={`code-${author}`} autoFocus type="password" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" autoComplete="off" required placeholder="작성 코드" value={code} onChange={event => { setCode(event.target.value); setMessage(''); }}/></>}
      <div className="paper-actions">{confirming && <button className="secondary" type="button" onClick={() => { setConfirming(false); setCode(''); setMessage(''); }}>수정</button>}<button type="submit" disabled={!content.trim() || (confirming && !/^[0-9]{4}$/.test(code))}>{saving ? '저장 중…' : '저장'}</button></div>
    </fieldset></form> : <><p className={`paper-content ${memo ? '' : 'paper-blank'}`}>{memo?.content ?? (unknown || '아직 비어 있는 메모지')}</p>{editable && memo && <button className="paper-edit" type="button" disabled={disabled} onClick={() => { setDraft(memo.content); setMessage(''); }}>수정</button>}</>}
    {message && <p className="paper-message" role="status">{message}</p>}
  </article>;
}

export function DailyNotes({ today }: { today: string }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const requestId = useRef(0);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(navigator.onLine); setError('');
    try {
      const page = await loadMemoDays();
      if (request !== requestId.current) return;
      setMemos(current => [...page.memos, ...current.filter(row => !page.memos.some(fresh => fresh.id === row.id) && row.record_date < (page.memos.at(-1)?.record_date ?? ''))]);
      setHasOlder(page.hasOlder); setLoaded(true);
    } catch {
      if (request === requestId.current) setError(navigator.onLine ? '메모를 불러오지 못했어요. 입력 내용은 유지됩니다.' : '오프라인 · 메모를 확인할 수 없어요.');
    } finally { if (request === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => {
    const connected = () => { void refresh(); };
    const offline = () => { ++requestId.current; setLoading(false); setError('오프라인 · 메모를 확인할 수 없어요.'); };
    connected(); window.addEventListener('online', connected); window.addEventListener('offline', offline);
    const invalidate = () => { ++requestId.current; };
    return () => { invalidate(); window.removeEventListener('online', connected); window.removeEventListener('offline', offline); };
  }, [refresh]);
  async function older() {
    if (olderLoading || !memos.length) return;
    setOlderLoading(true); setError('');
    try {
      const before = memos[memos.length - 1].record_date;
      const page = await loadMemoDays(before);
      setMemos(current => [...current, ...page.memos.filter(row => !current.some(existing => existing.id === row.id))]);
      setHasOlder(page.hasOlder);
    } catch { setError('이전 메모를 불러오지 못했습니다. 다시 시도해주세요.'); }
    finally { setOlderLoading(false); }
  }
  const days = [today, ...new Set(memos.map(memo => memo.record_date).filter(date => date !== today))];
  return <section aria-busy={loading || olderLoading} className="memo daily-notes" aria-labelledby="memo-title"><div className="memo-heading"><h2 id="memo-title">메모<span aria-hidden="true">♡</span></h2></div>
    {error && <div className="records-error" role="status"><p>{error}{loaded && ' · 이전 메모 표시'}</p><button type="button" disabled={loading} onClick={refresh}>다시 불러오기</button></div>}
    <p className={`fetch-status ${loading ? 'daily-loading' : ''}`} role="status">{loading ? (loaded ? '메모 갱신 중…' : '메모 불러오는 중…') : loaded && !memos.length ? '아직 등록된 메모가 없어요.' : ''}</p>
    {days.map((day, index) => <div className="memo-day-pair" key={index === 0 ? 'today' : day}><div className="memo-day"><time dateTime={day}>{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${day}T12:00:00+09:00`))}{day === today && <span> · 오늘</span>}</time></div><div className="paper-pair">{(['kongdol', 'kongsun'] as const).map(author => <Paper key={author} author={author} date={day} memo={memos.find(memo => memo.record_date === day && memo.author === author)} editable={day === today} disabled={!loaded && loading} unknown={loaded ? '' : loading ? '메모 불러오는 중…' : '메모 미확인 · 연결 후 다시 불러와주세요'} onSaved={refresh}/>)}</div></div>)}
    {hasOlder && <button className="memo-older" type="button" disabled={olderLoading || loading} onClick={older}>{olderLoading ? '불러오는 중…' : '이전 메모 더 보기'}</button>}
  </section>;
}
