import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const root = resolve(import.meta.dirname, "..");
const chrome = resolve(
  root,
  "node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const outDir = resolve(root, "public/real-screens");
const appBase = process.env.TW_APP_URL ?? "http://127.0.0.1:3001";
const port = Number(process.env.TW_CHROME_PORT ?? 9224);

const flags = {
  posts: false,
  forms: true,
  "release-2-communications": false,
  notifications: true,
  "holistic-reports": false,
  "parents-gateway": true,
  "student-analytics": false,
  "student-analytics-basic": false,
  "lta-intervention": false,
  "student-groups": false,
  "import-data": false,
  "msf-uplift-data": false,
  "developer-interfaces": false,
};

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: ok, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else ok(message.result);
        return;
      }
      const listeners = this.listeners.get(message.method);
      if (listeners) listeners.forEach((listener) => listener(message.params));
    };
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) ?? []).filter((item) => item !== listener),
        );
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
    });
  }
}

async function pollJson(url, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function launchChrome() {
  const child = spawn(chrome, [
    `--remote-debugging-port=${port}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--window-size=1920,1080",
    `--user-data-dir=/tmp/teacher-workspace-video-capture-${port}`,
    "about:blank",
  ]);

  child.stderr.on("data", () => {});
  await pollJson(`http://127.0.0.1:${port}/json/version`);
  return child;
}

async function connectPage() {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: "PUT",
  }).then((res) => res.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  const page = new Cdp(ws);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return page;
}

async function setViewport(page, width, height) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function navigate(page, url) {
  const loaded = page.once("Page.loadEventFired");
  await page.send("Page.navigate", { url });
  await loaded;
  await wait(1200);
}

async function evaluate(page, expression) {
  return page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function setupStorage(page, { welcomeSeen = true } = {}) {
  await navigate(page, appBase);
  await evaluate(
    page,
    `
      localStorage.setItem('feature_flags', ${JSON.stringify(JSON.stringify(flags))});
      localStorage.setItem('tw_posts_coachmark_seen', '1');
      sessionStorage.setItem('tw_mock_auth', 'false');
      ${welcomeSeen ? "sessionStorage.setItem('tw_welcome_seen', '1');" : "sessionStorage.removeItem('tw_welcome_seen');"}
    `,
  );
}

async function screenshot(page, name) {
  const result = await page.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const file = resolve(outDir, name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(result.data, "base64"));
}

async function screenshotViewport(page, name) {
  const result = await page.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  const file = resolve(outDir, name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(result.data, "base64"));
}

async function scrollPage(page, top) {
  await evaluate(
    page,
    `
      (() => {
        const scrollables = [...document.querySelectorAll('*')]
          .filter((el) => el.scrollHeight > el.clientHeight + 80)
          .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
        const target = scrollables[0] || document.scrollingElement || document.documentElement;
        target.scrollTop = ${top};
        window.scrollTo(0, ${top});
      })();
    `,
  );
  await wait(600);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const chromeProcess = await launchChrome();
  const page = await connectPage();

  try {
    await setupStorage(page, { welcomeSeen: false });
    await navigate(page, appBase);
    await screenshot(page, "welcome.png");

    await setupStorage(page, { welcomeSeen: true });
    await navigate(page, appBase);
    await screenshot(page, "home.png");
    await setViewport(page, 1920, 2200);
    await navigate(page, appBase);
    await screenshotViewport(page, "home-full.png");
    await setViewport(page, 1920, 1080);

    await setupStorage(page, { welcomeSeen: true });
    await navigate(page, `${appBase}/students`);
    await screenshot(page, "students-top.png");
    await scrollPage(page, 520);
    await screenshot(page, "students-tan-row.png");

    await setupStorage(page, { welcomeSeen: true });
    await navigate(page, `${appBase}/students/9`);
    await screenshot(page, "profile-top.png");
    await setViewport(page, 1920, 3000);
    await navigate(page, `${appBase}/students/9`);
    await screenshotViewport(page, "profile-full.png");
    await setViewport(page, 1920, 1080);
    await scrollPage(page, 520);
    await screenshot(page, "profile-mid.png");
    await scrollPage(page, 980);
    await screenshot(page, "profile-low.png");
  } finally {
    page.ws.close();
    chromeProcess.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
