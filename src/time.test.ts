import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdown, inclusiveDays, localParts, scheduledFlight } from './time';

test('inclusive date count remains available for the commented feature', () => assert.equal(inclusiveDays('2031-01-01','2031-01-02'),2));
test('IANA clock and Korean date display handle different local dates', () => {
  const now=new Date('2031-05-01T22:30:00Z');
  assert.equal(localParts(now,'Asia/Seoul').date,'2031-05-02');
  assert.equal(localParts(now,'Asia/Seoul').label,'5월 2일');
  assert.equal(localParts(now,'Europe/Madrid').time,'00:30');
  assert.equal(localParts(now,'Europe/Lisbon').time,'23:30');
});
test('countdown clamps before, at and after a fictional arrival', () => {
  const arrival='2031-05-02T12:00:00Z';
  assert.deepEqual(countdown(new Date('2031-05-01T10:58:59Z'),arrival),{days:1,hours:1,minutes:1,seconds:1,elapsed:false});
  for(const now of ['2031-05-02T12:00:00Z','2031-05-03T00:00:00Z']) assert.deepEqual(countdown(new Date(now),arrival),{days:0,hours:0,minutes:0,seconds:0,elapsed:true});
});
test('only the supplied current flight counts down until scheduled arrival', () => {
  const flight={number:'TEST001',arrival:'2031-05-02T12:00:00Z'};
  assert.deepEqual(scheduledFlight(new Date('2031-05-02T11:58:59Z'),flight),{number:'TEST001',minutes:2});
  assert.deepEqual(scheduledFlight(new Date('2031-05-02T11:59:59Z'),flight),{number:'TEST001',minutes:1});
  for(const now of ['2031-05-02T12:00:00Z','2031-05-03T00:00:00Z']) assert.equal(scheduledFlight(new Date(now),flight),null);
  assert.equal(scheduledFlight(new Date('2031-05-02T11:00:00Z'),null),null);
});
