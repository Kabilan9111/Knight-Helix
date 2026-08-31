const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\scratch\\chrome_test_profile';

console.log('Launching Chrome from:', chromePath);

const chrome = spawn(chromePath, [
  '--remote-debugging-port=9222',
  '--headless=new',
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

chrome.stderr.on('data', (d) => {
  console.log('[Chrome STDERR]', d.toString());
});

chrome.stdout.on('data', (d) => {
  console.log('[Chrome STDOUT]', d.toString());
});

chrome.on('error', (err) => {
  console.error('[Chrome ERROR]', err);
});

chrome.on('exit', (code, sig) => {
  console.log('[Chrome EXITED]', code, sig);
});

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    console.log('Successfully connected to Chrome DevTools Protocol!', data);
    chrome.kill();
  } catch (err) {
    console.error('Failed to connect to CDP:', err);
    chrome.kill();
  }
}, 3000);
