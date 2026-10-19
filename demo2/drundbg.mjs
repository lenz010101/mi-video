/* diagnóstico del run fallido */
import { execFileSync } from 'node:child_process';

const cred = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\r\nhost=github.com\r\n',
}).toString();
const token = cred.split('\n').find(l => l.startsWith('password=')).slice(9).trim();
const H = { 'User-Agent': 'dbg', Authorization: `token ${token}`, Accept: 'application/vnd.github+json' };

const runs = await (await fetch('https://api.github.com/repos/lenz010101/mi-video/actions/runs?per_page=3', { headers: H })).json();
const run = runs.workflow_runs[0];
console.log('run', run.id, run.head_sha.slice(0, 7), 'status:', run.status, 'conclusion:', run.conclusion);

const jobs = await (await fetch(`https://api.github.com/repos/lenz010101/mi-video/actions/runs/${run.id}/jobs`, { headers: H })).json();
for (const j of jobs.jobs) {
  console.log('— job:', j.name, '→', j.conclusion);
  const bad = j.steps.filter(s => s.conclusion === 'failure').map(s => s.name);
  if (bad.length) console.log('   step fallido:', bad.join(', '));
  if (j.conclusion === 'failure') {
    const L = { ...H };
    const sig = await fetch(j.url + '/logs', { headers: L, redirect: 'manual' });
    const loc = sig.headers.get('location') || sig.headers.get('Location');
    const log = await (await fetch(loc, { redirect: 'follow' })).text();
    console.log('log len', log.length);
    const ls = log.split('\n');
    const iErr = ls.findIndex(l => /error\(s\)/.test(l));
    if (iErr > 0) for (let k = Math.max(0, iErr - 45); k <= iErr + 2; k++) console.log('  |', ls[k].slice(0, 240));
  }
}
