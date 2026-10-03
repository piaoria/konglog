import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseWeight,upsertWeight,weightPoints} from './weight';
import {localParts} from './time';
test('weight accepts finite positive decimals and rejects empty or invalid values',()=>{assert.equal(parseWeight('76.25'),76.25);assert.equal(parseWeight(' .5 '),.5);for(const input of ['', ' ', '0', '-1', 'NaN', 'Infinity', 'abc'])assert.equal(parseWeight(input),null);});
test('daily records replace the same Korean date without changing the start date',()=>{const first={date:'2026-10-03',kg:80.5};const records=upsertWeight([first],{date:'2026-10-04',kg:79.5});const changed=upsertWeight(records,{date:'2026-10-04',kg:79.25});assert.equal(changed.length,2);assert.deepEqual(changed[0],first);assert.equal(changed[1].kg,79.25);assert.equal(records[1].kg,79.5);});
test('daily key uses Korea midnight, independent of UTC day',()=>{assert.equal(localParts(new Date('2026-10-03T14:59:59Z'),'Asia/Seoul').date,'2026-10-03');assert.equal(localParts(new Date('2026-10-03T15:00:00Z'),'Asia/Seoul').date,'2026-10-04');});
test('empty, single, flat, increasing and decreasing charts have finite coordinates',()=>{assert.deepEqual(weightPoints([]),[]);for(const values of [[76],[76,76],[74,75,76],[78,77,76]]){const points=weightPoints(values.map((kg,index)=>({date:`2026-10-${String(index+3).padStart(2,'0')}`,kg})));assert.ok(points.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));assert.equal(points.length,values.length);}});

test('user-provided local start record is October 2, with a 2.25kg target difference',async()=>{const {weightChallenge}=await import('./data');assert.deepEqual(weightChallenge.records,[{date:'2026-10-02',kg:78.25}]);assert.equal(Math.abs(weightChallenge.records[0].kg-weightChallenge.target),2.25);assert.equal(weightChallenge.records.at(-1)!.kg-weightChallenge.records[0].kg,0);assert.equal(weightPoints(weightChallenge.records).length,1);});
