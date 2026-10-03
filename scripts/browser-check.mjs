import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = 'C:/Users/cronp/Desktop/project/verification';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [];
  for (const width of [360, 375, 390,393, 430, 900]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-03T03:00:00Z') });
    await page.goto('http://127.0.0.1:5173/konglog/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${out}/preview-${width}.png`, fullPage: true });
    const layout = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, clockCount: document.querySelectorAll('.clock-card').length, headerCount: document.querySelectorAll('.intro, .anniversary').length, firstSection: document.querySelector('main > section').className, headerText: document.querySelector('header .brand').textContent, headerGap: document.querySelector('.clocks').getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom, cardsTop: document.querySelector('.clocks').getBoundingClientRect().top, weight: document.querySelector('.card-weight-readout').textContent, flightMinutes: document.querySelector('.flight-remaining strong')?.textContent ?? null, times: [...document.querySelectorAll('.time')].map(e => e.textContent), ticketBottom: document.querySelector('.ticket').getBoundingClientRect().bottom, horizontalOverflow: [...document.querySelectorAll('main *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e=>e.className) }));
    if (layout.scrollWidth > width || errors.length || layout.clockCount !== 2 || layout.headerCount !== 0 || layout.firstSection !== 'clocks' || layout.headerGap !== 12 || !layout.headerText.includes('♡') || layout.weight !== '78.25kg' || layout.flightMinutes !== null) throw Error(JSON.stringify({width,layout,errors}));
    if (await page.locator('details.schedule').count()) throw Error('Future schedule is exposed');
    results.push({ width, ...layout, errors });
    await page.close();
  }
  const page = await browser.newPage({ viewport: {width:390,height:844} });
  await page.clock.install({ time: new Date('2040-01-01T00:00:00Z') });
  await page.goto('http://127.0.0.1:5173/konglog/');
  if (!(await page.locator('.arrival-message').textContent()).includes('실제 도착과 재회는 아직 확인되지')) throw Error('Arrival must not imply reunion');
  if ((await page.locator('.peach .place').textContent()) !== '바르셀로나') throw Error('Snapshot must not switch to a future city');
  await page.screenshot({path:`${out}/arrival-elapsed-390.png`,fullPage:true});
  fs.writeFileSync(`${out}/browser-results.json`, JSON.stringify({browser:'Windows Chrome headless (not iPhone Safari)',results,arrivalBoundary:'passed'},null,2));
  console.log(JSON.stringify(results,null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});



