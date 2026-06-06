import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const checks = [
  checkNode(),
  checkCommand("rtl_fm", "RTL-SDR demodulator"),
  checkCommand("rtl_test", "RTL-SDR device probe"),
  checkCommand("ffmpeg", "browser audio encoder"),
  checkBrowser(),
  checkRtlDevice(),
];

const osInfo = readOsRelease();
console.log("RF Commons doctor");
if (osInfo.prettyName) console.log(`OS: ${osInfo.prettyName}`);
console.log("");

for (const check of checks) {
  console.log(`${check.ok ? "ok" : check.warn ? "warn" : "fail"} - ${check.label}`);
  if (check.detail) console.log(`  ${check.detail}`);
}

const hardFailures = checks.filter((check) => !check.ok && !check.warn);

if (hardFailures.length) {
  console.log("");
  console.log("Suggested Red Hat/Fedora packages:");
  console.log("  sudo dnf install nodejs rtl-sdr ffmpeg chromium");
  console.log("");
  console.log("On RHEL-compatible systems, rtl-sdr may come from EPEL and ffmpeg may come");
  console.log("from your approved multimedia repository. See docs/redhat-linux.md.");
  process.exitCode = 1;
}

function checkNode() {
  const [major] = process.versions.node.split(".").map(Number);
  return {
    ok: major >= 18,
    label: `Node.js ${process.versions.node}`,
    detail: major >= 18 ? "" : "Use Node.js 18 or newer.",
  };
}

function checkCommand(command, label) {
  const found = findCommand(command);
  return {
    ok: Boolean(found),
    label: `${label}: ${command}`,
    detail: found || "not found on PATH",
  };
}

function checkBrowser() {
  const candidates = [
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "microsoft-edge-stable",
    "microsoft-edge",
  ];
  const found = candidates.map(findCommand).find(Boolean);
  return {
    ok: Boolean(found),
    warn: true,
    label: "Chrome/Chromium for browser smoke tests",
    detail: found || "not required to run RF Commons; set CHROME_PATH for smoke tests",
  };
}

function checkRtlDevice() {
  const rtlTest = findCommand("rtl_test");
  if (!rtlTest) {
    return {
      ok: false,
      warn: true,
      label: "RTL-SDR dongle",
      detail: "rtl_test not found, so device detection was skipped",
    };
  }

  const result = spawnSync(rtlTest, ["-t"], {
    encoding: "utf8",
    timeout: 2500,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  const summary = output.split("\n").find((line) => line.trim()) || "No rtl_test output";
  return {
    ok: result.status === 0,
    warn: result.status !== 0,
    label: "RTL-SDR dongle",
    detail: summary.trim(),
  };
}

function readOsRelease() {
  try {
    const raw = readFileSync("/etc/os-release", "utf8");
    return Object.fromEntries(
      raw
        .split("\n")
        .filter((line) => line.includes("="))
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return [toCamel(key), rest.join("=").replace(/^"|"$/g, "")];
        })
    );
  } catch {
    return {};
  }
}

function toCamel(value) {
  return value
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function findCommand(name) {
  const result = spawnSync("sh", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}
