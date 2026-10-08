import test from 'node:test';
import assert from 'node:assert/strict';
// Source is pure JS with TS types; test its actual predicates directly via stripping type declaration.
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../src/url.ts', import.meta.url), 'utf8')
 .replace(/\(value: string\): \{[^}]+\}/, '(value)');
const {classifyQR} = await import('data:text/javascript,' + encodeURIComponent(source));
test('opens only exact HTTPS Slonig domain',()=>{
 for(const url of ['https://app.slonig.org/','https://APP.SLONIG.ORG/lesson?x=1','https://app.slonig.org:443/a'])assert.equal(classifyQR(url).kind,'slonig');
});
test('never auto opens lookalikes or unsafe links',()=>{
 for(const url of ['http://app.slonig.org','https://app.slonig.org.evil.test','https://evil.test/?q=app.slonig.org','https://app.slonig.org@evil.test','https://app.slonig.org:8080','javascript:alert(1)','not a link','https://name:pass@app.slonig.org'])assert.notEqual(classifyQR(url).kind,'slonig',url);
});
test('distinguishes other links and non-links',()=>{assert.equal(classifyQR('https://example.com/').kind,'other');assert.equal(classifyQR('hello').kind,'not-url')});
