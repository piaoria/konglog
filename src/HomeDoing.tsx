import { useState } from 'react';
import { homeStatuses, saveSharedRecord } from './storage';

export function HomeDoing({ value, pendingText, onSaved }: { value: string | null; pendingText: string; onSaved: () => Promise<void> }) {
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving || !selected || !/^[0-9]{4}$/.test(code)) return;
    setSaving(true); setMessage('');
    try { await saveSharedRecord({ kind: 'home_status', status: selected, code }); await onSaved(); setSelected(null); setCode(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : '상태를 저장하지 못했습니다.'); }
    finally { setSaving(false); }
  }
  return <div className="home-doing">
    {choosing ? <select autoFocus onBlur={() => setChoosing(false)} aria-label="콩돌 상태" value={value ?? ''} onChange={event => { setSelected(event.target.value); setChoosing(false); setCode(''); setMessage(''); }}><option value="" disabled>상태 선택</option>{homeStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select> : <button className="doing-text" type="button" disabled={!value || saving} onClick={() => { setChoosing(true); setSelected(null); setCode(''); setMessage(''); }}>{homeStatuses.find(status => status.value === value)?.label ?? pendingText}</button>}
    {selected && <form className="doing-confirm" onSubmit={submit}><fieldset disabled={saving}><span>{homeStatuses.find(status => status.value === selected)?.label}</span><label className="visually-hidden" htmlFor="doing-code">콩돌 작성 코드</label><input id="doing-code" autoFocus type="password" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" autoComplete="off" placeholder="작성 코드" required value={code} onChange={event => { setCode(event.target.value); setMessage(''); }}/><div><button type="button" onClick={() => { setSelected(null); setCode(''); setMessage(''); }}>취소</button><button type="submit" disabled={!/^[0-9]{4}$/.test(code)}>{saving ? '저장 중…' : '저장'}</button></div></fieldset></form>}
    {message && <p className="doing-message" role="status">{message}</p>}
  </div>;
}
