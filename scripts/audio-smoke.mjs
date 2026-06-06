import { spawnSync } from "node:child_process";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  if (!process.env.PLAYWRIGHT_IMPORT_PATH) {
    console.error("Missing optional dependency: playwright");
    console.error("Install it with `npm install --save-dev playwright` before running audio smoke tests.");
    console.error("Or set PLAYWRIGHT_IMPORT_PATH to a Playwright ESM entrypoint.");
    process.exit(1);
  }
  ({ chromium } = await import(process.env.PLAYWRIGHT_IMPORT_PATH));
}

const url = process.argv[2] || "http://127.0.0.1:8765/";
const executablePath = process.env.CHROME_PATH || findBrowserExecutable();

if (!executablePath) {
  console.error("Could not find Chrome or Chromium.");
  console.error("Set CHROME_PATH or install google-chrome-stable/chromium.");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: process.platform === "linux" && process.getuid?.() === 0 ? ["--no-sandbox"] : [],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];

page.on("console", (message) => {
  logs.push({ type: message.type(), text: message.text() });
});

await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(250);

const before = await page.evaluate(() => ({
  audioDataset: document.documentElement.dataset.audio,
  scriptSrc: document.querySelector('script[src^="src/app.js"]')?.getAttribute("src"),
  status: document.getElementById("audioStatus")?.textContent.trim(),
}));

const testAudioUrl = makeTestWavDataUrl();
await page.fill("#audioStreamInput", testAudioUrl);
await page.click("#audioToggle");
await page.waitForTimeout(600);

const after = await page.evaluate(() => ({
  audioDataset: document.documentElement.dataset.audio,
  button: document.getElementById("audioToggle")?.textContent.trim().replace(/\s+/g, " "),
  isOn: document.getElementById("audioToggle")?.classList.contains("is-audio-on"),
  status: document.getElementById("audioStatus")?.textContent.trim(),
}));

await browser.close();

console.log(JSON.stringify({ before, after, logs }, null, 2));

if (after.audioDataset !== "on" && after.audioDataset !== "unavailable") {
  throw new Error(`Audio control did not react. State: ${after.audioDataset || "missing"}`);
}

function makeTestWavDataUrl() {
  const sampleRate = 8000;
  const durationSeconds = 1;
  const samples = sampleRate * durationSeconds;
  const dataBytes = samples * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples; i += 1) {
    const sample = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 12000);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}

function findBrowserExecutable() {
  const commandCandidates = [
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "microsoft-edge-stable",
    "microsoft-edge",
  ];
  for (const command of commandCandidates) {
    const found = findCommand(command);
    if (found) return found;
  }

  const pathCandidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const candidate of pathCandidates) {
    const result = spawnSync("test", ["-x", candidate]);
    if (result.status === 0) return candidate;
  }

  return "";
}

function findCommand(name) {
  const result = spawnSync("sh", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}
