# Red Hat Linux Setup

RF Commons is intended to run on Red Hat-family Linux systems with the same
one-command flow used on macOS:

```sh
node scripts/dev.mjs
```

Then open:

```text
http://127.0.0.1:8765
```

## Packages

RF Commons needs:

- Node.js 18 or newer.
- `rtl_fm` and `rtl_test` from the `rtl-sdr` package.
- `ffmpeg` with MP3 encoding support.
- Chrome or Chromium only for browser smoke tests.

On Fedora, start with:

```sh
sudo dnf install nodejs rtl-sdr ffmpeg chromium
```

On RHEL, Rocky Linux, AlmaLinux, or CentOS Stream, package availability depends
on the repositories your system is allowed to use. Enable the official Red Hat
repositories for Node.js, then use the matching EPEL release for `rtl-sdr` if
your base repos do not provide it. If `ffmpeg` is unavailable, install an
organization-approved multimedia repository that provides the `ffmpeg` command.

Useful checks:

```sh
node scripts/doctor.mjs
rtl_test -t
node scripts/dev.mjs
curl http://127.0.0.1:8765/health
```

## Device Access

If `rtl_test -t` says no supported devices were found:

- Confirm the RTL-SDR dongle is plugged in.
- Replug the dongle after installing `rtl-sdr`.
- Check whether another SDR app already owns the device.
- If Linux loaded a DVB TV driver for the dongle, blacklist the conflicting DVB
  module according to your distribution policy.
- If `sudo rtl_test -t` works but the normal user does not, fix udev/group
  permissions rather than running the RF Commons dev server as root.

The dev server binds to `127.0.0.1` by default, so no firewall or SELinux policy
change should be needed for local use.

## What `/health` Means

```json
{
  "ok": false,
  "device": {
    "ok": false,
    "message": "No supported devices found."
  },
  "ffmpeg": "/usr/bin/ffmpeg",
  "rtl_fm": "/usr/bin/rtl_fm",
  "rtl_test": "/usr/bin/rtl_test",
  "audio": "/audio.mp3?freq=162.550&mode=NFM"
}
```

`ok: true` means RF Commons found the tools and `rtl_test -t` found a dongle.
`ok: false` means the UI will show the missing tool or device state before you
try to connect audio.

## References

- Fedora packages list `rtl-sdr` for Fedora releases and EPEL:
  <https://packages.fedoraproject.org/pkgs/rtl-sdr/rtl-sdr/>
- The Fedora SDR wiki describes RTL-SDR as supported SDR hardware on Fedora:
  <https://fedoraproject.org/wiki/SDR>
- Red Hat documents DNF as the package installation tool for RHEL 9:
  <https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/htmlsingle/managing_software_with_the_dnf_tool/index>
- Red Hat notes that EPEL is community-supported and outside RHEL production
  support scope:
  <https://access.redhat.com/solutions/3358>
- Fedora Docs describes enabling RPM Fusion repositories:
  <https://docs.fedoraproject.org/en-US/quick-docs/rpmfusion-setup/>
