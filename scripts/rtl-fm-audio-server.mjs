import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const port = Number(process.env.PORT || 8873);
const host = process.env.HOST || "127.0.0.1";
const ffmpegPath = process.env.FFMPEG_PATH || findCommand("ffmpeg");
const rtlFmPath = process.env.RTL_FM_PATH || findCommand("rtl_fm");
const rtlTestPath = process.env.RTL_TEST_PATH || findCommand("rtl_test");

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "RF Commons RTL audio helper\n\nHealth: /health\nAudio: /audio.mp3?freq=162.550&mode=NFM\n\nFor the simpler app + audio server, run: node scripts/dev.mjs\n"
    );
    return;
  }

  if (url.pathname === "/health") {
    const device = checkRtlDevice();
    sendJson(res, {
      ok: Boolean(ffmpegPath && rtlFmPath && device.ok),
      device,
      ffmpeg: ffmpegPath || null,
      rtl_fm: rtlFmPath || null,
      rtl_test: rtlTestPath || null,
      audio: "/audio.mp3?freq=162.550&mode=NFM",
    });
    return;
  }

  if (url.pathname !== "/audio.mp3") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }

  if (!ffmpegPath || !rtlFmPath) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "Missing rtl_fm or ffmpeg. Install rtl-sdr tools and ffmpeg, then restart this helper.\n"
    );
    return;
  }

  const profile = receiverProfile(url.searchParams);
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
});

server.listen(port, host, () => {
  console.log(`RF Commons RTL audio helper listening at http://${host}:${port}`);
  if (!rtlFmPath) console.warn("rtl_fm not found. Install rtl-sdr tools for receiver audio.");
  if (!ffmpegPath) console.warn("ffmpeg not found. Install ffmpeg for MP3 browser audio.");
});

function receiverProfile(params) {
  const freqMHz = Number(params.get("freq") || "162.55");
  const mode = String(params.get("mode") || "NFM").toUpperCase();
  const wide = mode === "WFM";
  const ssb = mode === "SSB";
  const am = mode === "AM";
  const data = mode === "DATA";

  return {
    audioRate: wide ? "48000" : "24000",
    freqHz: Math.round(freqMHz * 1_000_000),
    rtlMode: wide ? "wbfm" : am ? "am" : ssb ? "usb" : data ? "fm" : "fm",
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
