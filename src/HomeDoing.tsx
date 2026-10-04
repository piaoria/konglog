import { useEffect, useRef, useState } from 'react';
import { homeStatuses, saveSharedRecord } from './storage';

export function HomeDoing({ value, pendingText, onSaved }: { value: string | null; pendingText: string; onSaved: () => Promise<void> }) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const choices = useRef<HTMLUListElement>(null);
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!choosing) return;
    const buttons = choices.current?.querySelectorAll<HTMLButtonElement>('button[data-status]');
    const current = homeStatuses.findIndex(status => status.value === value);
    buttons?.[Math.max(0, current)]?.focus();
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setChoosing(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setChoosing(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [choosing, value]);
  function open() { setChoosing(true); setSelected(null); setCode(''); setMessage(''); }
  function move(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const buttons = choices.current?.querySelectorAll<HTMLButtonElement>('button[data-status]');
    if (!buttons?.length) return;
    const next = event.key === 'ArrowDown' ? (index + 1) % buttons.length : event.key === 'ArrowUp' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : null;
    if (next !== null) { event.preventDefault(); buttons[next].focus(); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving || !selected || !/^[0-9]{4}$/.test(code)) return;
    setSaving(true); setMessage('');
    try { await saveSharedRecord({ kind: 'home_status', status: selected, code }); await onSaved(); setSelected(null); setCode(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : '상태를 저장하지 못했습니다.'); }
    finally { setSaving(false); }
  }
  return <div className="home-doing" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setChoosing(false); }}>
    <button ref={trigger} className="doing-text" type="button" disabled={!value || saving} aria-expanded={choosing} aria-controls="doing-choices" onClick={() => { if (choosing) setChoosing(false); else open(); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); } }}>{homeStatuses.find(status => status.value === value)?.label ?? pendingText}</button>
    {choosing && <div className="doing-choices" id="doing-choices" role="group" aria-label="콩돌 상태 선택"><ul ref={choices}>{homeStatuses.map((status, index) => <li key={status.value}><button type="button" data-status={status.value} aria-pressed={status.value === value} onKeyDown={event => move(event, index)} onClick={() => { setSelected(status.value); setChoosing(false); setCode(''); setMessage(''); }}>{status.label}</button></li>)}</ul><button className="doing-cancel" type="button" onClick={() => { setChoosing(false); trigger.current?.focus(); }}>취소</button></div>}
    {selected && <form className="doing-confirm" onSubmit={submit}><fieldset disabled={saving}><span>{homeStatuses.find(status => status.value === selected)?.label}</span><label className="visually-hidden" htmlFor="doing-code">콩돌 작성 코드</label><input id="doing-code" autoFocus type="password" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" autoComplete="off" placeholder="작성 코드" required value={code} onChange={event => { setCode(event.target.value); setMessage(''); }}/><div><button type="button" onClick={() => { setSelected(null); setCode(''); setMessage(''); trigger.current?.focus(); }}>취소</button><button type="submit" disabled={!/^[0-9]{4}$/.test(code)}>{saving ? '저장 중…' : '저장'}</button></div></fieldset></form>}
    {message && <p className="doing-message" role="status">{message}</p>}
  </div>;
}
