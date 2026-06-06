import { readFile } from "node:fs/promises";

const files = {
  html: await readFile(new URL("../index.html", import.meta.url), "utf8"),
  css: await readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  js: await readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readme: await readFile(new URL("../README.md", import.meta.url), "utf8"),
};

const checks = [
  ["README names RF Commons", files.readme.includes("# RF Commons")],
  ["README states no ads", files.readme.includes("No ads. No telemetry. No account required.")],
  ["HTML mounts Listen view", files.html.includes('id="listenView"')],
  ["HTML mounts Learn view", files.html.includes('id="learnView"')],
  ["HTML mounts Map view", files.html.includes('id="mapView"')],
  ["HTML exposes audio toggle", files.html.includes('id="audioToggle"')],
  ["HTML exposes volume control", files.html.includes('id="volumeSlider"')],
  ["Docs include Red Hat setup", await fileIncludes("../docs/redhat-linux.md", "Red Hat Linux Setup")],
  ["App renders presets", files.js.includes("const presets =")],
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
