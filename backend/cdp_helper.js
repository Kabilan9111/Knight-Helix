const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class MobileBrowserSession {
  constructor(options = {}) {
    this.chromePath = options.chromePath || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    this.profileDir = options.profileDir || 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\scratch\\chrome_test_profile';
    this.port = options.port || 9222;
    this.chromeProcess = null;
    this.ws = null;
    this.targetWs = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.events = new Map();
    this.targetId = null;
    this.sessionId = null;
  }

  async launch() {
    console.log('[CDP] Spawning Chrome instance on port', this.port);
    this.chromeProcess = spawn(this.chromePath, [
      `--remote-debugging-port=${this.port}`,
      '--headless=new',
      `--user-data-dir=${this.profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-background-networking',
      'about:blank'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Wait for CDP to respond
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
        if (res.ok) {
          const info = await res.json();
          this.browserWsUrl = info.webSocketDebuggerUrl;
          console.log('[CDP] Connected to browser:', info.Browser);
          break;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 250));
      }
    }

    if (!this.browserWsUrl) {
      throw new Error('Failed to connect to Chrome CDP within timeout');
    }

    // Connect to browser target
    this.ws = new WebSocket(this.browserWsUrl);
    await new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
    });

    this.ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });

    // Create a new target page
    const { targetId } = await this.sendBrowser('Target.createTarget', { url: 'about:blank' });
    this.targetId = targetId;

    // Attach to target page
    const { sessionId } = await this.sendBrowser('Target.attachToTarget', { targetId, flatten: true });
    this.sessionId = sessionId;

    // Enable Page, Runtime, DOM, Network, Emulation
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('DOM.enable');
    await this.send('Network.enable');

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method === 'Runtime.consoleAPICalled') {
          const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          console.log(`[Browser Console ${msg.params.type}] ${args}`);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error(`[Browser Uncaught]`, msg.params.exceptionDetails);
        }
      } catch (e) {}
    });

    // Grant permissions
    try {
      await this.sendBrowser('Browser.setPermission', {
        permission: { name: 'geolocation' },
        setting: 'granted',
        origin: 'http://localhost:5173'
      });
      await this.sendBrowser('Browser.grantPermissions', {
        permissions: ['geolocation', 'videoCapture', 'audioCapture'],
        origin: 'http://localhost:5173'
      });
    } catch (e) {}
  }

  sendBrowser(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, sessionId: this.sessionId, method, params }));
    });
  }

  async setMobileViewport(width = 390, height = 844, dsf = 3) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dsf,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await this.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });
    await this.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    });
  }

  async setGeolocation(lat, lng, accuracy = 10) {
    await this.send('Emulation.setGeolocationOverride', {
      latitude: lat,
      longitude: lng,
      accuracy
    });
  }

  async setNetworkOffline(offline = true) {
    await this.send('Network.emulateNetworkConditions', {
      offline,
      latency: offline ? 0 : 20,
      downloadThroughput: offline ? 0 : -1,
      uploadThroughput: offline ? 0 : -1
    });
    // Also dispatch DOM online/offline event for instantaneous reactive UI
    await this.evaluate(`window.dispatchEvent(new Event('${offline ? 'offline' : 'online'}'))`);
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await this.waitForLoad();
  }

  async waitForLoad(timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const readyState = await this.evaluate('document.readyState');
      if (readyState === 'complete' || readyState === 'interactive') {
        await new Promise(r => setTimeout(r, 400));
        return;
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Evaluation error');
    }
    return res.result?.value;
  }

  async click(selector) {
    const exists = await this.evaluate(`!!document.querySelector('${selector}')`);
    if (!exists) throw new Error(`Element not found for click: ${selector}`);
    await this.evaluate(`document.querySelector('${selector}').click()`);
    await new Promise(r => setTimeout(r, 400));
  }

  async type(selector, text) {
    await this.evaluate(`(() => {
      const el = document.querySelector('${selector}');
      if (!el) throw new Error('Element not found: ${selector}');
      el.focus();
      el.value = ${JSON.stringify(text)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await new Promise(r => setTimeout(r, 200));
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 90 });
    const buffer = Buffer.from(res.data, 'base64');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    console.log(`[Screenshot Saved] -> ${filePath}`);
    return filePath;
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
    } catch (e) {}
    try {
      if (this.chromeProcess) this.chromeProcess.kill();
    } catch (e) {}
  }
}

module.exports = { MobileBrowserSession };
