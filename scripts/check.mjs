import { readFile } from "node:fs/promises";

const files = {
  html: await readFile(new URL("../index.html", import.meta.url), "utf8"),
  css: await readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  js: await readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  packageJson: await readFile(new URL("../package.json", import.meta.url), "utf8"),
  readme: await readFile(new URL("../README.md", import.meta.url), "utf8"),
};
const presetBlock = files.js.match(/const presets = \[([\s\S]*?)\];/)?.[1] || "";

const checks = [
  ["README names RF Commons", files.readme.includes("# RF Commons")],
  ["README states no ads", files.readme.includes("No ads. No telemetry. No account required.")],
  ["HTML mounts Listen view", files.html.includes('id="listenView"')],
  ["HTML mounts Learn view", files.html.includes('id="learnView"')],
  ["HTML mounts Map view", files.html.includes('id="mapView"')],
  ["HTML exposes audio toggle", files.html.includes('id="audioToggle"')],
  ["HTML exposes volume control", files.html.includes('id="volumeSlider"')],
  ["Docs include Red Hat setup", await fileIncludes("../docs/redhat-linux.md", "Red Hat Linux Setup")],
  [
    "Installer includes RHEL dependency packages",
    await fileIncludes("../scripts/install-rhel-deps.sh", "dnf_install nodejs rtl-sdr"),
  ],
  [
    "Installer has a RHEL dry-run regression test",
    await fileIncludes("../scripts/test-rhel-installer.mjs", "default RHEL 10 plan"),
  ],
  [
    "npm exposes RHEL installer test",
    files.packageJson.includes('"test:rhel-installer": "node scripts/test-rhel-installer.mjs"'),
  ],
  ["App renders presets", files.js.includes("const presets =")],
  ["App includes expanded preset library", presetCount() >= 24],
  ["App includes USB/LSB mode options", files.html.includes('value="USB"') && files.html.includes('value="LSB"')],
  ["Receiver helper supports LSB", await fileIncludes("../scripts/dev.mjs", 'mode === "LSB"')],
  ["App connects receiver streams", files.js.includes("connectReceiverAudio")],
  ["App checks receiver health", files.js.includes("checkReceiverHealth")],
  ["App stores local bookmarks", files.js.includes("rf-commons-bookmarks")],
  ["App stores local logs", files.js.includes("rf-commons-logs")],
  ["No remote scripts", !/<script[^>]+src=["']https?:/i.test(files.html)],
  ["No negative letter spacing", !/letter-spacing\s*:\s*-/i.test(files.css)],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [label, passed] of checks) {
  console.log(`${passed ? "ok" : "fail"} - ${label}`);
}

if (failures.length) {
  process.exitCode = 1;
}

async function fileIncludes(relativePath, pattern) {
  const content = await readFile(new URL(relativePath, import.meta.url), "utf8");
  return content.includes(pattern);
}

function presetCount() {
  return (presetBlock.match(/\n\s+name: "/g) || []).length;
}
