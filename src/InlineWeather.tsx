import { useEffect, useState } from 'react';
import { weatherLocations } from './data';
import { currentWeather, weatherDescription } from './weather';
import type { Weather } from './weather';

export function InlineWeather({ index }: { index: number }) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const location = weatherLocations[index];
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    currentWeather(location, controller.signal).then(value => { if (active) setWeather(value); }).catch(() => { if (active) setError(true); }).finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [location, attempt]);
  const description = weather && weatherDescription(weather.code, weather.day);
  return <span className="inline-weather">
    {error ? <button type="button" className="weather-retry" aria-label="날씨 다시 불러오기" onClick={() => { setError(false); setWeather(null); setAttempt(value => value + 1); }}>날씨 재시도</button> : !weather ? <span className="weather-loading" role="status">날씨…</span> : <span className="weather-value" aria-label={`${description!.text}, 현재 ${Math.round(weather.temperature)}도`} title={`${description!.text} · 도시 중심 기준`}><span aria-hidden="true">{description!.icon}</span><strong>{Math.round(weather.temperature)}<small>°C</small></strong></span>}
  </span>;
}
