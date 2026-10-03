export type Weather = { temperature: number; feelsLike: number; code: number; day: boolean };

export async function currentWeather(location: { latitude: number; longitude: number }, signal: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), current: 'temperature_2m,apparent_temperature,weather_code,is_day', timezone: 'auto', forecast_days: '1' });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('날씨를 불러오지 못했어요.');
  const { current } = await response.json();
  if (!current || ![current.temperature_2m,current.apparent_temperature,current.weather_code].every(Number.isFinite) || ![0,1].includes(current.is_day)) throw new Error('날씨 응답을 확인하지 못했어요.');
  return { temperature: current.temperature_2m, feelsLike: current.apparent_temperature, code: current.weather_code, day: current.is_day === 1 };
}

export function weatherDescription(code: number, day: boolean) {
  if (code === 0) return { icon: day ? '☀️' : '🌙', text: '맑음' };
  if ([1,2].includes(code)) return { icon: day ? '🌤️' : '☁️', text: '구름 조금' };
  if (code === 3) return { icon: '☁️', text: '흐림' };
  if ([45,48].includes(code)) return { icon: '🌫️', text: '안개' };
  if ([51,53,55,56,57].includes(code)) return { icon: '🌦️', text: '이슬비' };
  if ([61,63,65,66,67,80,81,82].includes(code)) return { icon: '🌧️', text: '비' };
  if ([71,73,75,77,85,86].includes(code)) return { icon: '🌨️', text: '눈' };
  if ([95,96,97,99].includes(code)) return { icon: '⛈️', text: '뇌우' };
  return { icon: '🌡️', text: '날씨 정보' };
}
