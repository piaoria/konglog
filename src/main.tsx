import React from 'react';
import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { page, weightChallenge } from './data';
import { countdown, localParts, scheduledFlight } from './time';
// 200일 기능 복원 시 inclusiveDays import와 아래 주석을 함께 복원합니다.
// import { inclusiveDays } from './time';
import { InlineWeather } from './InlineWeather';
import { Bean } from './Bean';
import { parseWeight, weightPoints } from './weight';
import { loadSharedRecords, loadCurrentState, saveSharedRecord, type CurrentTravel, type WeightRecord } from './storage';
import { DailyNotes } from './DailyNotes';
import { HomeDoing } from './HomeDoing';
import { PwaStatus } from './PwaStatus';
import './style.css';

function App() {
  const [now, setNow] = useState(() => new Date());
  const [sharedWeights, setSharedWeights] = useState<WeightRecord[]>([]);
  const [recordsError, setRecordsError] = useState('');
  const [weightDraft, setWeightDraft] = useState('');
  const [weightCode, setWeightCode] = useState('');
  const [weightConfirming, setWeightConfirming] = useState(false);
  const [weightMessage, setWeightMessage] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [travel, setTravel] = useState<CurrentTravel | null>(null);
  const [homeStatus, setHomeStatus] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState('');
  const [currentLoading, setCurrentLoading] = useState(true);
  const [currentLoaded, setCurrentLoaded] = useState(false);
  const currentRequest = useRef(0);
  const refreshCurrent = useCallback(async () => {
    const request = ++currentRequest.current;
    setCurrentLoading(navigator.onLine); setCurrentError('');
    try {
      const current = await loadCurrentState();
      if (request !== currentRequest.current) return;
      setTravel(current.travel); setHomeStatus(current.homeStatus); setCurrentLoaded(true);
    } catch {
      if (request === currentRequest.current) setCurrentError(navigator.onLine ? '현재 정보를 불러오지 못했어요.' : '오프라인 · 현재 정보를 확인할 수 없어요.');
    } finally { if (request === currentRequest.current) setCurrentLoading(false); }
  }, []);
  useEffect(() => {
    const update = () => { void refreshCurrent(); };
    const offline = () => { ++currentRequest.current; setCurrentLoading(false); setCurrentError('오프라인 · 현재 정보를 확인할 수 없어요.'); };
    update(); window.addEventListener('online', update); window.addEventListener('offline', offline);
    const timer = window.setInterval(update, 60000);
    const invalidate = () => { ++currentRequest.current; };
    return () => { invalidate(); window.clearInterval(timer); window.removeEventListener('online', update); window.removeEventListener('offline', offline); };
  }, [refreshCurrent]);
  async function refreshRecords() {
    setRecordsError('');
    try { const records = await loadSharedRecords(); setSharedWeights(records.weights); }
    catch { setRecordsError('체중 기록을 불러오지 못했습니다.'); }
  }
  useEffect(() => {
    let active = true;
    const update = () => loadSharedRecords().then(records => { if (active) { setSharedWeights(records.weights); setRecordsError(''); } }).catch(() => { if (active) setRecordsError('체중 기록을 불러오지 못했습니다.'); });
    void update(); window.addEventListener('online', update);
    return () => { active = false; window.removeEventListener('online', update); };
  }, []);
  async function submitWeight(event: React.FormEvent) {
    event.preventDefault(); if (savingWeight) return;
    const kg = parseWeight(weightDraft);
    if (kg === null || kg >= 1000) { setWeightMessage('0보다 크고 1000보다 작은 체중을 입력하세요.'); return; }
    if (!weightConfirming) { setWeightConfirming(true); setWeightMessage(''); return; }
    if (!/^[0-9]{4}$/.test(weightCode)) return;
    setSavingWeight(true); setWeightMessage('');
    try {
      const message = await saveSharedRecord({ kind: 'weight', kg, code: weightCode });
      setWeightDraft(''); setWeightCode(''); setWeightConfirming(false); setWeightMessage(message);
      await refreshRecords();
    } catch (error) { setWeightMessage(error instanceof Error ? error.message : '등록하지 못했습니다. 다시 시도해주세요.'); }
    finally { setSavingWeight(false); }
  }
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const activeFlight = scheduledFlight(now, null);
  const home = localParts(now, page.people.home.zone);
  const away = travel ? localParts(now, travel.zone) : null;
  const remaining = countdown(now);
  // const anniversary = inclusiveDays(page.startDate, page.anniversaryDate);
  const weightRecords = [...new Map([...weightChallenge.records, ...sharedWeights].map(record => [record.date, record])).values()].sort((a, b) => a.date.localeCompare(b.date));
  const firstWeight = weightRecords[0];
  const latestWeight = weightRecords.at(-1);
  const points = weightPoints(weightRecords);
  const today = localParts(now, 'Asia/Seoul').date;
  const weightFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
  if (page.closed) return <main className="closed"><p>{page.people.home.name} ♡ {page.people.away.name}</p><h1>페이지 표시가 종료되었습니다.</h1></main>;
  return <main><PwaStatus/>
    <header><span className="brand">{page.people.home.name} <i>♡</i> {page.people.away.name}</span><div className="header-countdown" aria-label="다시 만나기까지, 예정 도착 시각 기준"><span className="countdown-label">다시 만나기까지</span>{page.reunited ? <span className="arrival-message">재회 기록됨</span> : remaining.elapsed ? <span className="arrival-message">예정 시각 지남<small>도착·재회 미확인</small></span> : <span className="countdown" aria-label={`${remaining.days}일 ${remaining.hours}시간 ${remaining.minutes}분 ${remaining.seconds}초 남음`}><strong>{remaining.days}<small>일</small></strong><span>{String(remaining.hours).padStart(2,'0')}:{String(remaining.minutes).padStart(2,'0')}:{String(remaining.seconds).padStart(2,'0')}</span></span>}</div></header>
    {/* 200일 기념 영역: 복원 시 아래 주석을 해제합니다.
    <section className="intro">
      <span className="anniversary"><span aria-hidden="true">♡</span> 우리의 {anniversary}일</span>
      <div className="title-wrap"><span className="title-spark" aria-hidden="true">✧</span><h1>{page.title}</h1><span className="title-heart" aria-hidden="true">♡</span></div>
      <span className="date-line">{page.startDate.replaceAll('-', '.')} — {page.anniversaryDate.replaceAll('-', '.')}</span>
    </section>
    */}
    <section aria-busy={currentLoading} className="clocks" aria-label="두 콩의 현지 시계">
      {[{ person: page.people.home, clock: home, place: '대한민국', status: '', zone: page.people.home.zone, clockLabel: '한국 시간' }, { person: page.people.away, clock: away, place: travel?.place ?? (currentLoading ? '현지 정보 불러오는 중…' : currentLoaded ? '현재 현지 정보 없음' : '현지 정보 미확인'), status: travel?.status ?? '', zone: travel?.zone ?? '', clockLabel: travel?.clockLabel ?? '현지 시간' }].map((card, index) => <article key={card.person.name} className={`clock-card ${index ? 'peach' : 'blue'} ${card.clock?.night ? 'night' : ''}`}>
        <div className="card-top"><span>{card.person.name}</span><div className="sky-weather">{card.clock && <span className="sky" aria-label={card.clock?.night ? '현지 밤 시간' : '현지 낮 시간'}><svg className="sky-icon" viewBox="0 0 24 24" aria-hidden="true">{card.clock?.night ? <path d="M15.4 4.4 C11.8 4.0 8.6 6.2 7.7 9.6 C6.4 14.1 9.2 18.4 13.7 19.3 C16.0 19.8 18.4 19.2 20.0 17.7 C20.7 17.0 20.1 16.0 19.2 16.1 C15.9 16.5 13.0 14.4 12.6 11.2 C12.3 9.0 13.3 7.0 15.2 5.8 C15.9 5.3 16.2 4.6 15.4 4.4Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/> : <><circle cx="12" cy="12" r="3.5" fill="currentColor"/><path d="M12 2V5 M12 19V22 M2 12H5 M19 12H22 M5 5L7 7 M17 17L19 19 M5 19L7 17 M17 7L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>}</svg></span>}{index === 0 ? <InlineWeather index={0}/> : travel?.place === '바르셀로나' && travel.zone === 'Europe/Madrid' && <InlineWeather index={1}/>}</div></div>
        <div className="character">{card.person.photo ? <img src={card.person.photo} alt={card.person.name}/> : <Bean cat={index === 1}/>}</div>
        <p className="clock-label">{card.clockLabel}</p><time dateTime={now.toISOString()} className="time">{card.clock?.time ?? '—:—'}</time><p className="local-date">{card.clock?.label ?? '—'} {card.clock && <span>· {card.clock.night ? '밤' : '낮'}</span>}</p>
        <p className="place">{card.place}</p><div className="status">{index === 0 ? <HomeDoing value={homeStatus} pendingText={currentLoading ? '상태 불러오는 중…' : currentLoaded ? '등록된 상태 없음' : '상태 미확인'} onSaved={refreshCurrent}/> : card.status.split(' · ').map(line => <span key={line}>{line}</span>)}</div>{index === 0 && latestWeight && <p className="card-weight-readout">{weightFormat.format(latestWeight.kg)}<small>kg</small></p>}{index === 1 && activeFlight && <p className="flight-remaining"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3 C10.5 1.7 13.5 1.7 13.5 3 L13.5 9 L21 14 L21 16 L13.5 13.5 L13.5 19 L16 21 L16 22 L12 21 L8 22 L8 21 L10.5 19 L10.5 13.5 L3 16 L3 14 L10.5 9Z" fill="currentColor" stroke="currentColor" strokeWidth=".5" strokeLinejoin="round" transform="rotate(30 12 12)"/></svg><span>도착 예정까지 <strong>{activeFlight.minutes}</strong>분</span></p>}<span className="zone">{card.zone}</span>
      </article>)}
    </section>
    <p className="fetch-status" role="status">{currentLoading ? (currentLoaded ? '현재 정보 갱신 중…' : '현재 정보 불러오는 중…') : ''}</p>
    {currentError && <p className="current-error" role="status">{currentError}{currentLoaded && ' · 이전 정보 표시'}<button type="button" disabled={currentLoading} onClick={refreshCurrent}>다시 불러오기</button></p>}
    <a className="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a>
    <div className="between" aria-hidden="true"><span/><svg viewBox="0 0 60 28"><path d="M5 14H18M42 14H55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4"/><path d="M30 21L22 13C16 5 28 2 30 9C32 2 44 5 38 13Z" fill="#f8b5cf" stroke="#dd89b0" strokeWidth="1.2"/></svg><span/></div>
    <DailyNotes today={today}/>
    <section className="weight-challenge" aria-labelledby="weight-title">
      <div className="memo-heading"><h2 id="weight-title">{page.people.home.name} {weightChallenge.target}kg 챌린지</h2><span>귀국 예정까지</span></div>
      <div className="weight-stats"><div><span>최근 기록</span><strong>{latestWeight ? weightFormat.format(latestWeight.kg) : '—'}<small>kg</small></strong><p>{latestWeight ? localParts(new Date(latestWeight.date), 'Asia/Seoul').label : '아직 기록 없음'}</p></div><div><span>목표 {weightChallenge.target}kg와의 차이</span><strong>{latestWeight ? weightFormat.format(Math.abs(latestWeight.kg - weightChallenge.target)) : '—'}<small>kg</small></strong><p>절댓값 기준</p></div></div>
      {firstWeight && latestWeight && <p className="weight-change">시작 기록 대비 변화 <strong>{weightFormat.format(latestWeight.kg - firstWeight.kg)}kg</strong></p>}
      <div className="weight-chart-heading"><span>첫 기록부터의 변화</span>{firstWeight && <small>시작 {weightFormat.format(firstWeight.kg)}kg · {localParts(new Date(firstWeight.date), 'Asia/Seoul').label}</small>}</div>
      <div className={`weight-chart ${points.length ? '' : 'empty'}`}>
        <svg viewBox="0 0 320 112" role="img" aria-label={points.length ? `${weightRecords.length}일 체중 기록. 첫 기록 ${firstWeight.kg}kg, 최근 ${latestWeight!.kg}kg` : '체중 기록 그래프: 아직 기록 없음'}>
          <path d="M18 12H302 M18 44H302 M18 77H302" stroke="#e5deef" strokeWidth="1" fill="none"/>
          {points.length > 1 && <polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} stroke="#8d71ca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>}
          {points.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" fill="#8d71ca"><title>{localParts(new Date(point.date), 'Asia/Seoul').label} · {point.kg}kg</title></circle>)}
          {points.length === 1 ? <text x="160" y="102" textAnchor="middle" fill="#8a7a9c" fontSize="10">{localParts(new Date(firstWeight.date), 'Asia/Seoul').label}</text> : points.length > 1 && <><text x="18" y="102" fill="#8a7a9c" fontSize="10">{localParts(new Date(firstWeight.date), 'Asia/Seoul').label}</text><text x="302" y="102" textAnchor="end" fill="#8a7a9c" fontSize="10">{localParts(new Date(latestWeight!.date), 'Asia/Seoul').label}</text></>}
        </svg>{!points.length && <p>첫 기록이 저장되면 그래프가 표시됩니다.</p>}
      </div>
      <p className="weight-notice">체중 기록은 누구나 볼 수 있습니다. 콩돌만 등록할 수 있습니다.</p>
      {recordsError && <p className="memo-message" role="status">{recordsError}<button type="button" onClick={refreshRecords}>다시 불러오기</button></p>}
      <form onSubmit={submitWeight} aria-busy={savingWeight}><fieldset disabled={savingWeight}>
        <label htmlFor="weight-input">오늘의 체중 <span>{localParts(new Date(today), 'Asia/Seoul').label} · 한국 날짜</span></label><div className="weight-input-wrap"><input id="weight-input" type="number" inputMode="decimal" step="any" value={weightDraft} onChange={event => { setWeightDraft(event.target.value); setWeightMessage(''); }} required placeholder="체중 입력"/><span>kg</span></div>
        <p className="weight-daily">한국 날짜별 하루 1건 · 같은 날짜 입력은 기존 기록을 수정합니다.</p>
        {weightConfirming && <div className="code-entry"><label htmlFor="weight-code">콩돌 작성 코드</label><input id="weight-code" type="password" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" autoComplete="off" value={weightCode} onChange={event => setWeightCode(event.target.value)} required/><p>4자리 숫자 코드 · 작성 권한은 연결 후 확인됩니다.</p></div>}
        <div className="memo-actions">{weightConfirming && <button type="button" className="secondary" onClick={() => { setWeightConfirming(false); setWeightCode(''); setWeightMessage(''); }}>돌아가기</button>}<button type="submit" disabled={!weightDraft.trim() || (weightConfirming && !/^[0-9]{4}$/.test(weightCode))}>{weightConfirming ? '기록 확인' : '기록하기'}</button></div>
        <p className="memo-message" role="status">{weightMessage}</p>
      </fieldset></form>
    </section>
    <footer>{page.people.home.name} ♡ {page.people.away.name}{/* <span>{page.startDate.replaceAll('-', '.')} · {anniversary}일 기념</span> */}</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
