import { WeatherIcon } from './WeatherIcon';
import { useEffect, useState } from 'react';
import { weatherLocations } from './data';
import { currentWeather, weatherDescription } from './weather';
import type { Weather } from './weather';

export function InlineWeather({ index, location: suppliedLocation }: { index: number; location?: { latitude: number; longitude: number } }) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { latitude, longitude } = suppliedLocation ?? weatherLocations[index];
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(navigator.onLine); setError('');
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    if (navigator.onLine) {
      currentWeather({ latitude, longitude }, controller.signal).then(value => { if (active) setWeather(value); }).catch(() => { if (active) setError(navigator.onLine ? '날씨 조회 실패' : '오프라인'); }).finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    } else { setError('오프라인'); window.clearTimeout(timeout); }
    const connected = () => setAttempt(value => value + 1);
    const offline = () => { active = false; controller.abort(); window.clearTimeout(timeout); setLoading(false); setError('오프라인'); };
    window.addEventListener('online', connected); window.addEventListener('offline', offline);
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); window.removeEventListener('online', connected); window.removeEventListener('offline', offline); };
  }, [latitude, longitude, attempt]);
  const description = weather && weatherDescription(weather.code, weather.day);
  return <span className="inline-weather" aria-busy={loading}>
    {weather && <span className="weather-value" aria-label={`${description!.text}, 기온 ${Math.round(weather.temperature)}도`} title={`${description!.text} · 마지막으로 확인한 날씨`}><WeatherIcon kind={description!.icon}/><strong>{Math.round(weather.temperature)}<small>°C</small></strong></span>}
    <span className="weather-state" role="status">{loading ? weather ? '갱신 중…' : '날씨 조회 중…' : error ? <button type="button" className="weather-retry" aria-label={`${error}${weather ? ' · 이전 날씨 표시' : ''}, 다시 불러오기`} onClick={() => setAttempt(value => value + 1)}>{error}{weather ? ' · 이전 값' : ''}</button> : ''}</span>
  </span>;
}
