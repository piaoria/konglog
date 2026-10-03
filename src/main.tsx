import React from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { page, travelSnapshot, weightChallenge } from './data';
import { countdown, localParts, scheduledFlight } from './time';
// 200일 기능 복원 시 inclusiveDays import와 아래 주석을 함께 복원합니다.
// import { inclusiveDays } from './time';
import { InlineWeather } from './InlineWeather';
import { Bean } from './Bean';
import { parseWeight, weightPoints } from './weight';
import './style.css';

function App() {
  const [now, setNow] = useState(() => new Date());
  const [draft, setDraft] = useState('');
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [memoMessage, setMemoMessage] = useState('');
  const [weightDraft, setWeightDraft] = useState('');
  const [weightCode, setWeightCode] = useState('');
  const [weightConfirming, setWeightConfirming] = useState(false);
  const [weightMessage, setWeightMessage] = useState('');
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const travel = travelSnapshot;
  const activeFlight = scheduledFlight(now);
  const home = localParts(now, page.people.home.zone);
  const away = localParts(now, travel.zone);
  const remaining = countdown(now);
  const arrival = localParts(new Date(page.arrival), 'Asia/Seoul');
  // const anniversary = inclusiveDays(page.startDate, page.anniversaryDate);
  const weightRecords = [...weightChallenge.records].sort((a, b) => a.date.localeCompare(b.date));
  const firstWeight = weightRecords[0];
  const latestWeight = weightRecords.at(-1);
  const points = weightPoints(weightRecords);
  const today = localParts(now, 'Asia/Seoul').date;
  const weightFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
  if (page.closed) return <main className="closed"><p>{page.people.home.name} ♡ {page.people.away.name}</p><h1>페이지 표시가 종료되었습니다.</h1></main>;
  return <main>
    <header><span className="brand">{page.people.home.name} <i>♡</i> {page.people.away.name}</span></header>
    {/* 200일 기념 영역: 복원 시 아래 주석을 해제합니다.
    <section className="intro">
      <span className="anniversary"><span aria-hidden="true">♡</span> 우리의 {anniversary}일</span>
      <div className="title-wrap"><span className="title-spark" aria-hidden="true">✧</span><h1>{page.title}</h1><span className="title-heart" aria-hidden="true">♡</span></div>
      <span className="date-line">{page.startDate.replaceAll('-', '.')} — {page.anniversaryDate.replaceAll('-', '.')}</span>
    </section>
    */}
    <section className="clocks" aria-label="두 콩의 현지 시계">
      {[{ person: page.people.home, clock: home, place: '대한민국', status: page.homeStatus, zone: page.people.home.zone, clockLabel: '한국 시간' }, { person: page.people.away, clock: away, place: travel.place, status: travel.status, zone: travel.zone, clockLabel: travel.clockLabel }].map((card, index) => <article key={card.person.name} className={`clock-card ${index ? 'peach' : 'blue'} ${card.clock.night ? 'night' : ''}`}>
        <div className="card-top"><span>{card.person.name}</span><div className="sky-weather"><span className="sky" aria-label={card.clock.night ? '현지 밤 시간' : '현지 낮 시간'}><svg className="sky-icon" viewBox="0 0 24 24" aria-hidden="true">{card.clock.night ? <path d="M15.4 4.4 C11.8 4.0 8.6 6.2 7.7 9.6 C6.4 14.1 9.2 18.4 13.7 19.3 C16.0 19.8 18.4 19.2 20.0 17.7 C20.7 17.0 20.1 16.0 19.2 16.1 C15.9 16.5 13.0 14.4 12.6 11.2 C12.3 9.0 13.3 7.0 15.2 5.8 C15.9 5.3 16.2 4.6 15.4 4.4Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/> : <><circle cx="12" cy="12" r="3.5" fill="currentColor"/><path d="M12 2V5 M12 19V22 M2 12H5 M19 12H22 M5 5L7 7 M17 17L19 19 M5 19L7 17 M17 7L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>}</svg></span><InlineWeather index={index}/></div></div>
        <div className="character">{card.person.photo ? <img src={card.person.photo} alt={card.person.name}/> : <Bean cat={index === 1}/>}</div>
        <p className="clock-label">{card.clockLabel}</p><time dateTime={now.toISOString()} className="time">{card.clock.time}</time><p className="local-date">{card.clock.label} <span>· {card.clock.night ? '밤' : '낮'}</span></p>
        <p className="place">{card.place}</p><p className="status">{card.status.split(' · ').map(line => <span key={line}>{line}</span>)}</p>{index === 0 && latestWeight && <p className="card-weight-readout">{weightFormat.format(latestWeight.kg)}<small>kg</small></p>}{index === 1 && activeFlight && <p className="flight-remaining"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3 C10.5 1.7 13.5 1.7 13.5 3 L13.5 9 L21 14 L21 16 L13.5 13.5 L13.5 19 L16 21 L16 22 L12 21 L8 22 L8 21 L10.5 19 L10.5 13.5 L3 16 L3 14 L10.5 9Z" fill="currentColor" stroke="currentColor" strokeWidth=".5" strokeLinejoin="round" transform="rotate(30 12 12)"/></svg><span>도착 예정까지 <strong>{activeFlight.minutes}</strong>분</span></p>}<span className="zone">{card.zone}</span>
      </article>)}
    </section>
    <a className="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a>
    <div className="between" aria-hidden="true"><span/><svg viewBox="0 0 60 28"><path d="M5 14H18M42 14H55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4"/><path d="M30 21L22 13C16 5 28 2 30 9C32 2 44 5 38 13Z" fill="#f8b5cf" stroke="#dd89b0" strokeWidth="1.2"/></svg><span/></div>
    <section className="ticket" aria-labelledby="ticket-title">
      <div className="ticket-heading"><span className="eyebrow">귀국 항공편</span><span className="ticket-stamp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3L3 10L11 13L14 21Z M11 13L21 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg> ICN</span></div>
      <h2 id="ticket-title">{page.reunited ? '재회 기록' : '인천 도착까지'}</h2>
      <p className="ticket-sub">도착 예정 시각 기준</p>
      {page.reunited ? <p className="arrival-message">재회 상태: 기록됨</p> : remaining.elapsed ? <p className="arrival-message">도착 예정 시각이 지났어요.<small>실제 도착과 재회는 아직 확인되지 않았어요.</small></p> : <div className="countdown" aria-label={`${remaining.days}일 ${remaining.hours}시간 ${remaining.minutes}분 ${remaining.seconds}초 남음`}>{[[remaining.days,'일'],[remaining.hours,'시간'],[remaining.minutes,'분'],[remaining.seconds,'초']].map(([value,label]) => <div key={label}><strong>{String(value).padStart(2,'0')}</strong><span>{label}</span></div>)}</div>}
      <div className="ticket-footer"><div><span>도착 예정</span><b>{arrival.label} <i>·</i> {arrival.time}</b></div><small>한국 시간<br/>(Asia/Seoul)</small></div>
    </section>
    <section className="memo" aria-labelledby="memo-title"><div className="memo-heading"><h2 id="memo-title">{page.memo.heading}</h2><span>공유 저장 미연결</span></div>
      <p className="memo-notice">공유 저장이 아직 연결되지 않았습니다. 입력한 내용은 저장되지 않습니다.</p>
      <form onSubmit={event => { event.preventDefault(); if (!confirming) { setConfirming(true); return; } if (/^[0-9]{4}$/.test(code)) setMemoMessage('공유 저장 연결 전에는 등록할 수 없습니다.'); }}>
        <label htmlFor="memo-draft">메모 내용</label><textarea id="memo-draft" value={draft} onChange={event => { setDraft(event.target.value); setMemoMessage(''); }} maxLength={2000} required placeholder="메모를 입력하세요"/>
        {confirming && <div className="code-entry"><label htmlFor="memo-code">작성 코드</label><input id="memo-code" type="password" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} required aria-describedby="code-hint"/><p id="code-hint">4자리 숫자 코드 · 작성자는 연결 후 확인됩니다.</p></div>}
        <div className="memo-actions">{confirming && <button type="button" className="secondary" onClick={() => { setConfirming(false); setCode(''); setMemoMessage(''); }}>돌아가기</button>}<button type="submit" disabled={!draft.trim()}>{confirming ? '등록 확인' : '등록하기'}</button></div>
        <p className="memo-message" role="status">{memoMessage}</p>
      </form><p className="memo-empty">등록된 메모가 없습니다.</p>
    </section>
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
      <p className="weight-notice">공유 저장 미연결 · 입력한 체중은 저장되지 않습니다.</p>
      <form onSubmit={event => { event.preventDefault(); if (parseWeight(weightDraft) === null) { setWeightMessage('0보다 큰 숫자로 체중을 입력하세요.'); return; } if (!weightConfirming) { setWeightConfirming(true); setWeightMessage(''); return; } if (/^[0-9]{4}$/.test(weightCode)) setWeightMessage('공유 저장 연결 전에는 체중을 기록할 수 없습니다.'); }}>
        <label htmlFor="weight-input">오늘의 체중 <span>{localParts(new Date(today), 'Asia/Seoul').label} · 한국 날짜</span></label><div className="weight-input-wrap"><input id="weight-input" type="number" inputMode="decimal" step="any" value={weightDraft} onChange={event => { setWeightDraft(event.target.value); setWeightMessage(''); }} required placeholder="체중 입력"/><span>kg</span></div>
        <p className="weight-daily">연결 후 한국 날짜별 하루 1건 · 같은 날짜 입력은 기존 기록을 수정합니다.</p>
        {weightConfirming && <div className="code-entry"><label htmlFor="weight-code">콩돌 작성 코드</label><input id="weight-code" type="password" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" autoComplete="off" value={weightCode} onChange={event => setWeightCode(event.target.value)} required/><p>4자리 숫자 코드 · 작성 권한은 연결 후 확인됩니다.</p></div>}
        <div className="memo-actions">{weightConfirming && <button type="button" className="secondary" onClick={() => { setWeightConfirming(false); setWeightCode(''); setWeightMessage(''); }}>돌아가기</button>}<button type="submit" disabled={!weightDraft.trim()}>{weightConfirming ? '기록 확인' : '기록하기'}</button></div>
        <p className="memo-message" role="status">{weightMessage}</p>
      </form>
    </section>
    <section className="memories"><h2>사진 기록</h2><p>등록된 사진이 없습니다.</p></section>
    <footer>{page.people.home.name} ♡ {page.people.away.name}{/* <span>{page.startDate.replaceAll('-', '.')} · {anniversary}일 기념</span> */}</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
