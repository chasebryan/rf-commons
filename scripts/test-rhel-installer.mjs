import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fakeBin = await mkdtemp(join(tmpdir(), "rf-commons-rhel-test-"));

try {
  await writeExecutable(
    "dnf",
    `#!/usr/bin/env bash
echo "fake dnf should not run during dry-run" >&2
exit 42
`
  );
  await writeExecutable(
    "sudo",
    `#!/usr/bin/env bash
echo "fake sudo should not run during dry-run" >&2
exit 42
`
  );
  await writeExecutable(
    "rpm",
    `#!/usr/bin/env bash
if [[ "$1" == "-E" ]]; then
  echo "10"
  exit 0
fi
if [[ "$1" == "-q" ]]; then
  exit 1
fi
exit 1
`
  );
  await writeExecutable(
    "subscription-manager",
    `#!/usr/bin/env bash
echo "fake subscription-manager should not run during dry-run" >&2
exit 42
`
  );
  await writeExecutable(
    "uname",
    `#!/usr/bin/env bash
if [[ "$1" == "-m" ]]; then
  echo "x86_64"
  exit 0
fi
/usr/bin/uname "$@"
`
  );

  runCase({
    name: "default RHEL 10 plan",
    args: ["--yes", "--dry-run"],
    includes: [
      "Detected Enterprise Linux major: 10",
      "Architecture: x86_64",
      "+ sudo subscription-manager repos --enable codeready-builder-for-rhel-10-x86_64-rpms",
      "+ sudo subscription-manager repos --enable rhel-10-for-x86_64-extensions-rpms",
      "+ sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-10.noarch.rpm",
      "+ sudo dnf install -y https://mirrors.rpmfusion.org/free/el/rpmfusion-free-release-10.noarch.rpm",
      "+ sudo dnf install -y nodejs rtl-sdr",
      "+ sudo dnf install -y ffmpeg",
      "+ sudo dnf install -y chromium",
      "Done. Start RF Commons with:",
    ],
  });

  runCase({
    name: "organization-managed repositories",
    args: ["--yes", "--dry-run", "--skip-epel", "--skip-rpmfusion", "--no-chromium"],
    includes: [
      "Detected Enterprise Linux major: 10",
      "+ sudo dnf install -y nodejs rtl-sdr",
      "+ sudo dnf install -y ffmpeg",
    ],
    excludes: [
      "epel-release-latest-10.noarch.rpm",
      "rpmfusion-free-release-10.noarch.rpm",
      "+ sudo dnf install -y chromium",
    ],
  });

  console.log("ok - RHEL installer dry-run plan");
} finally {
  await rm(fakeBin, { recursive: true, force: true });
}

async function writeExecutable(name, content) {
  const target = join(fakeBin, name);
  await writeFile(target, content, "utf8");
  await chmod(target, 0o755);
}

function runCase({ name, args, includes, excludes = [] }) {
  const result = spawnSync("bash", ["scripts/install-rhel-deps.sh", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH || ""}`,
    },
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;

  if (result.status !== 0) {
    fail(name, `expected exit 0, got ${result.status}\n${output}`);
  }

  for (const needle of includes) {
    if (!output.includes(needle)) {
      fail(name, `missing expected output: ${needle}\n${output}`);
    }
  }

  for (const needle of excludes) {
    if (output.includes(needle)) {
      fail(name, `found unexpected output: ${needle}\n${output}`);
    }
  }
}

function fail(name, message) {
  console.error(`fail - ${name}`);
  console.error(message);
  process.exit(1);
}
