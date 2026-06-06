#!/usr/bin/env bash
set -euo pipefail

assume_yes=0
dry_run=0
enable_epel=1
enable_rpmfusion=1
install_chromium=1

usage() {
  cat <<'USAGE'
RF Commons RHEL-compatible dependency installer

Usage:
  bash scripts/install-rhel-deps.sh [options]

Options:
  -y, --yes             Do not prompt before enabling repos/installing packages.
      --dry-run         Print commands without running them.
      --skip-epel       Do not install/enable EPEL.
      --skip-rpmfusion  Do not install/enable RPM Fusion Free.
      --no-chromium     Skip Chromium/Chrome smoke-test browser package.
  -h, --help            Show this help.

Default RHEL 10 path:
  - enables CodeReady Builder when subscription-manager is available;
  - enables the RHEL 10 extensions repo when subscription-manager is available;
  - installs EPEL release configuration;
  - installs RPM Fusion Free release configuration;
  - installs nodejs, rtl-sdr, ffmpeg, and chromium if available.
USAGE
}

while (($#)); do
  case "$1" in
    -y|--yes)
      assume_yes=1
      ;;
    --dry-run)
      dry_run=1
      ;;
    --skip-epel)
      enable_epel=0
      ;;
    --skip-rpmfusion)
      enable_rpmfusion=0
      ;;
    --no-chromium)
      install_chromium=0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

detect_rhel_major() {
  local rpm_value=""
  if command -v rpm >/dev/null 2>&1; then
    rpm_value="$(rpm -E '%rhel' 2>/dev/null || true)"
    if [[ "$rpm_value" =~ ^[0-9]+$ ]]; then
      echo "$rpm_value"
      return
    fi
  fi

  if [[ -r /etc/os-release ]]; then
    # shellcheck disable=SC1091
    source /etc/os-release
    if [[ "${ID:-}" == "fedora" ]]; then
      return
    fi
    local os_version="${VERSION_ID:-}"
    echo "${os_version%%.*}"
  fi
}

run() {
  echo "+ $*"
  if [[ "$dry_run" -eq 1 ]]; then
    return 0
  fi
  "$@"
}

run_optional() {
  echo "+ $*"
  if [[ "$dry_run" -eq 1 ]]; then
    return 0
  fi
  if ! "$@"; then
    echo "warning: optional command failed: $*" >&2
  fi
}

dnf_install() {
  run "${sudo_cmd[@]}" dnf install -y "$@"
}

enable_rhel_repos() {
  if ! command -v subscription-manager >/dev/null 2>&1; then
    return
  fi

  run_optional "${sudo_cmd[@]}" subscription-manager repos \
    --enable "codeready-builder-for-rhel-${rhel_major}-${arch}-rpms"

  if [[ "$rhel_major" == "10" ]]; then
    run_optional "${sudo_cmd[@]}" subscription-manager repos \
      --enable "rhel-10-for-${arch}-extensions-rpms"
  fi
}

enable_epel_repo() {
  if [[ "$enable_epel" -ne 1 ]]; then
    return
  fi
  if rpm -q epel-release >/dev/null 2>&1; then
    echo "epel-release is already installed."
    return
  fi
  dnf_install "https://dl.fedoraproject.org/pub/epel/epel-release-latest-${rhel_major}.noarch.rpm"
}

enable_rpmfusion_repo() {
  if [[ "$enable_rpmfusion" -ne 1 ]]; then
    return
  fi
  if rpm -q rpmfusion-free-release >/dev/null 2>&1; then
    echo "rpmfusion-free-release is already installed."
    return
  fi
  dnf_install "https://mirrors.rpmfusion.org/free/el/rpmfusion-free-release-${rhel_major}.noarch.rpm"
}

install_required_packages() {
  dnf_install nodejs rtl-sdr

  if ! dnf_install ffmpeg; then
    echo "ffmpeg package install failed; trying ffmpeg-free fallback." >&2
    dnf_install ffmpeg-free
  fi
}

install_optional_browser() {
  if [[ "$install_chromium" -ne 1 ]]; then
    return
  fi
  run_optional "${sudo_cmd[@]}" dnf install -y chromium
}

run_doctor() {
  if [[ "$dry_run" -eq 1 ]]; then
    return
  fi
  if [[ -f scripts/doctor.mjs ]]; then
    node scripts/doctor.mjs || true
  fi
}

main() {
  if ! command -v dnf >/dev/null 2>&1; then
    echo "dnf was not found. This installer supports RHEL-compatible systems." >&2
    exit 1
  fi

  if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
    sudo_cmd=()
  else
    if ! command -v sudo >/dev/null 2>&1; then
      echo "sudo was not found. Re-run as root or install sudo." >&2
      exit 1
    fi
    sudo_cmd=(sudo)
  fi

  rhel_major="$(detect_rhel_major)"
  arch="$(uname -m)"

  if [[ -z "$rhel_major" ]]; then
    echo "Could not detect a RHEL-compatible major version." >&2
    echo "Use --dry-run to inspect commands, or install nodejs rtl-sdr ffmpeg manually." >&2
    exit 1
  fi

  echo "RF Commons dependency installer"
  echo "Detected EL/Fedora major: ${rhel_major}"
  echo "Architecture: ${arch}"
  echo ""
  echo "This may enable EPEL and RPM Fusion Free repositories for rtl-sdr/ffmpeg."
  echo "Review docs/redhat-linux.md if your organization restricts third-party repos."
  echo ""

  if [[ "$assume_yes" -ne 1 && "$dry_run" -ne 1 ]]; then
    read -r -p "Continue? [y/N] " answer
    case "$answer" in
      y|Y|yes|YES)
        ;;
      *)
        echo "Canceled."
        exit 0
        ;;
    esac
  fi

  enable_rhel_repos
  enable_epel_repo
  enable_rpmfusion_repo
  install_required_packages
  install_optional_browser
  run_doctor

  echo ""
  echo "Done. Start RF Commons with:"
  echo "  node scripts/dev.mjs"
}

main
