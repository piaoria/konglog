import { useEffect, useState } from 'react';
import { page, travelSnapshot, weatherLocations, homeCity } from './data';
import { currentWeather, weatherDescription } from './weather';
import type { Weather } from './weather';

function WeatherCard({ index, city, name }: { index: number; city: string; name: string }) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const location = weatherLocations[index];
  useEffect(() => {
    if (!location) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    currentWeather(location, controller.signal).then(value => { if (active) setWeather(value); }).catch(() => { if (active) setError(true); }).finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [location, attempt]);
  const description = weather && weatherDescription(weather.code, weather.day);
  return <article className={`weather-card ${index ? 'away-weather' : ''}`} aria-label={`${name} ${city} 날씨`}>
    <div className="weather-city"><span>{name}</span><strong>{city}</strong></div>
    {!location ? <p className="weather-state">날씨 연결 준비 중</p> : error ? <div className="weather-state" role="status"><p>날씨를 불러오지 못했어요.</p><button type="button" onClick={() => { setError(false); setWeather(null); setAttempt(value => value + 1); }}>다시 시도</button></div> : !weather ? <p className="weather-state" role="status">날씨 불러오는 중…</p> : <><div className="weather-current"><span className="weather-icon" aria-hidden="true">{description!.icon}</span><strong>{Math.round(weather.temperature)}<small>°C</small></strong></div><p className="weather-description">{description!.text}<span>체감 {Math.round(weather.feelsLike)}°C</span></p></>}
  </article>;
}

export function WeatherSection() {
  return <section className="weather-section" aria-labelledby="weather-title"><div className="weather-heading"><h2 id="weather-title">우리 동네 날씨</h2><span>도시 중심 기준</span></div><div className="weather-cards"><WeatherCard index={0} city={homeCity} name={page.people.home.name}/><WeatherCard index={1} city={travelSnapshot.place} name={page.people.away.name}/></div><a className="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a></section>;
}
