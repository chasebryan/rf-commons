import { spawn, spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8765);
const ffmpegPath = process.env.FFMPEG_PATH || findCommand("ffmpeg");
const rtlFmPath = process.env.RTL_FM_PATH || findCommand("rtl_fm");
const rtlTestPath = process.env.RTL_TEST_PATH || findCommand("rtl_test");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/health" || url.pathname === "/api/receiver-health") {
    sendJson(res, healthBody());
    return;
  }

  if (url.pathname === "/audio.mp3") {
    streamReceiverAudio(url.searchParams, req, res);
    return;
  }

  await serveStatic(url.pathname, res);
});

server.listen(port, host, () => {
  const base = `http://${host}:${port}`;
  const device = checkRtlDevice();
  console.log(`RF Commons dev server: ${base}`);
  console.log(`Receiver health: ${base}/health`);
  console.log(`Receiver audio: ${base}/audio.mp3?freq=162.550&mode=NFM`);
  if (!rtlFmPath) console.warn("rtl_fm not found. Receiver audio needs rtl-sdr tools.");
  if (!ffmpegPath) console.warn("ffmpeg not found. Browser MP3 audio needs ffmpeg.");
  if (rtlFmPath && ffmpegPath && device.ok === false) {
    console.warn(`RTL-SDR device not detected: ${device.message}`);
  }
});

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const decoded = decodeURIComponent(requested);
  const filePath = path.resolve(repoRoot, `.${decoded}`);

  if (!filePath.startsWith(repoRoot)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("Forbidden\n");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentType(filePath),
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "Not found. Open / for RF Commons, /health for receiver status, or /audio.mp3 for receiver audio.\n"
    );
  }
}

function streamReceiverAudio(params, req, res) {
  if (!ffmpegPath || !rtlFmPath) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "Receiver audio is not ready. Install rtl_fm from rtl-sdr tools and ffmpeg, then restart `node scripts/dev.mjs`.\n"
    );
    return;
  }

  const profile = receiverProfile(params);
  res.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "audio/mpeg",
  });

  const rtl = spawn(rtlFmPath, [
    "-M",
    profile.rtlMode,
    "-f",
    `${profile.freqHz}`,
    "-s",
    profile.sampleRate,
    "-r",
    profile.audioRate,
    "-",
  ]);

  const ffmpeg = spawn(ffmpegPath, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "s16le",
    "-ar",
    profile.audioRate,
    "-ac",
    "1",
    "-i",
    "pipe:0",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "64k",
    "-f",
    "mp3",
    "pipe:1",
  ]);

  rtl.stdout.pipe(ffmpeg.stdin);
  ffmpeg.stdout.pipe(res);

  const stop = () => {
    rtl.kill("SIGTERM");
    ffmpeg.kill("SIGTERM");
  };

  req.on("close", stop);
  rtl.on("error", stop);
  ffmpeg.on("error", stop);
}

function healthBody() {
  const device = checkRtlDevice();
  return {
    ok: Boolean(ffmpegPath && rtlFmPath && device.ok),
    app: `http://${host}:${port}/`,
    device,
    ffmpeg: ffmpegPath || null,
    rtl_fm: rtlFmPath || null,
    rtl_test: rtlTestPath || null,
    audio: "/audio.mp3?freq=162.550&mode=NFM",
  };
}

function receiverProfile(params) {
  const freqMHz = Number(params.get("freq") || "162.55");
  const mode = String(params.get("mode") || "NFM").toUpperCase();
  const wide = mode === "WFM";
  const usb = mode === "USB" || mode === "SSB";
  const lsb = mode === "LSB";
  const am = mode === "AM";
  const cw = mode === "CW";
  const data = mode === "DATA";

  return {
    audioRate: wide ? "48000" : "24000",
    freqHz: Math.round(freqMHz * 1_000_000),
    rtlMode: wide ? "wbfm" : am ? "am" : lsb ? "lsb" : usb || cw ? "usb" : data ? "fm" : "fm",
    sampleRate: wide ? "200k" : "24k",
  };
}

function findCommand(name) {
  const result = spawnSync("sh", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function checkRtlDevice() {
  if (!rtlTestPath) {
    return { ok: null, message: "rtl_test not found" };
  }

  const result = spawnSync(rtlTestPath, ["-t"], {
    encoding: "utf8",
    timeout: 2500,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  const summary = output.split("\n").find((line) => line.trim()) || "No rtl_test output";
  return {
    ok: result.status === 0,
    message: summary.trim(),
  };
}

function setCors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function sendJson(res, body) {
  res.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

function contentType(filePath) {
  const ext = path.extname(filePath);
  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".md": "text/markdown; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    }[ext] || "application/octet-stream"
  );
}
