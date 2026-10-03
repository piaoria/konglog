export function WeatherIcon({ kind }: { kind: string }) {
  return <svg className="weather-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'sun' ? <><circle cx="12" cy="12" r="3.5"/><path d="M12 2V5M12 19V22M2 12H5M19 12H22M5 5L7 7M17 17L19 19M5 19L7 17M17 7L19 5"/></> : kind === 'moon' ? <path d="M15.4 4.4C11.8 4 8.6 6.2 7.7 9.6C6.4 14.1 9.2 18.4 13.7 19.3C16 19.8 18.4 19.2 20 17.7C20.7 17 20.1 16 19.2 16.1C15.9 16.5 13 14.4 12.6 11.2C12.3 9 13.3 7 15.2 5.8C15.9 5.3 16.2 4.6 15.4 4.4Z"/> : <><path d="M6 15H18A3 3 0 0 0 18 9A5.5 5.5 0 0 0 7.2 7.5A3.8 3.8 0 0 0 6 15Z"/>{kind === 'rain' ? <path d="M8 18L7 21M13 18L12 21M18 18L17 21"/> : kind === 'snow' ? <path d="M7 19H11M9 17V21M15 19H19M17 17V21"/> : kind === 'storm' ? <path d="M13 16L10 20H14L12 23"/> : kind === 'fog' && <path d="M5 18H19M7 21H17"/>}</>}
  </svg>;
}
