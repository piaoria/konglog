import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentWeather, weatherDescription } from './weather';

test('request sends only city center coordinates and current weather fields', async () => {
  const previous=globalThis.fetch;
  try {
    globalThis.fetch=async (input,init) => {
      const url=new URL(String(input));
      assert.equal(url.hostname,'api.open-meteo.com');
      assert.deepEqual([...url.searchParams.keys()],['latitude','longitude','current','timezone','forecast_days']);
      assert.equal(url.searchParams.get('latitude'),'12.3');
      assert.equal(init?.credentials,'omit');
      assert.equal(init?.referrerPolicy,'no-referrer');
      return new Response(JSON.stringify({current:{temperature_2m:12.4,apparent_temperature:11.2,weather_code:2,is_day:1}}));
    };
    assert.deepEqual(await currentWeather({latitude:12.3,longitude:45.6},new AbortController().signal),{temperature:12.4,feelsLike:11.2,code:2,day:true});
  } finally { globalThis.fetch=previous; }
});
test('HTTP and invalid API responses fail without invented temperatures', async () => {
  const previous=globalThis.fetch;
  try {
    for(const response of [new Response('',{status:503}),new Response(JSON.stringify({current:{temperature_2m:null}}))]) {
      globalThis.fetch=async()=>response;
      await assert.rejects(currentWeather({latitude:12.3,longitude:45.6},new AbortController().signal));
    }
  } finally { globalThis.fetch=previous; }
});
test('weather descriptions cover day, night, rain, snow and thunderstorms', () => {
  assert.equal(weatherDescription(0,true).icon,'sun');
  assert.equal(weatherDescription(0,false).icon,'moon');
  assert.equal(weatherDescription(63,true).text,'비');
  assert.equal(weatherDescription(75,true).text,'눈');
  assert.equal(weatherDescription(95,true).text,'뇌우');
});
