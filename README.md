# RF Commons

RF Commons is a free, open-source radio workbench for exploring the RF spectrum.

It supports local RTL-SDR receivers, public web SDR nodes, frequency bookmarks,
signal identification, and beginner-friendly radio learning tools.

No ads. No telemetry. No account required.

## Mission

RF Commons exists to make radio signals understandable, accessible, and open
without turning the spectrum into another ad-supported platform.

Radio knowledge should be common. Signal tools should be open. Listening should
not require subscriptions, telemetry, or locked platforms.

## Modes

- **Listen**: tune, inspect, bookmark, and log signals.
- **Learn**: identify common signal shapes and understand SDR concepts.
- **Map**: browse public receivers, bands, and radio activity.

## Project Identity

```text
RF Commons
|-- Local RTL-SDR receiver
|-- Online public SDR directory
|-- Waterfall + spectrum viewer
|-- Signal identification guide
|-- Ham / shortwave / NOAA / ADS-B / APRS learning modes
|-- Local logbook
|-- Frequency bookmarks
|-- Club / school / emergency-prep friendly
`-- No ads, no telemetry, no account required
```

## Prototype

This repo currently includes a dependency-free static prototype of the RF
Commons workbench. It is a front-end foundation for the product shape: tuner
controls, a live synthetic spectrum/waterfall, signal hints, bookmarks, a local
logbook, a learning identifier, and a receiver directory/map surface.

Run the app and local receiver endpoint with one command:

```sh
node scripts/dev.mjs
```

Then open `http://127.0.0.1:8765`.

You can also run the repository checks with any Node.js runtime:

```sh
node scripts/check.mjs
```

Check local receiver dependencies with:

```sh
node scripts/doctor.mjs
```

If npm is available, `npm run check` runs the same script.

### Receiver Audio

The waterfall demo is visual-only until a real receiver audio stream is
connected. The app will not synthesize fake radio audio.

For local RTL-SDR audio, install `rtl_fm` from the rtl-sdr tools and make sure
`ffmpeg` is available. The one-command dev server exposes health and audio
endpoints:

```text
http://127.0.0.1:8765/health
http://127.0.0.1:8765/audio.mp3?freq=162.550&mode=NFM
```

The audio field defaults to `/audio.mp3?freq=162.550&mode=NFM`, so you should
not need to paste URLs for local listening. The server uses `rtl_fm` for
receive-only demodulation and `ffmpeg` to expose a browser-playable MP3 stream.
It also runs `rtl_test -t` for device detection. If tools are missing or no
dongle is connected, `/health`, the terminal, and the app surface report that
clearly instead of producing placeholder audio.

For Red Hat-family Linux setup details, see
[docs/redhat-linux.md](docs/redhat-linux.md).

Public receiver audio can also be used if the receiver exposes a direct
browser-playable stream URL.

The current prototype does not yet include device discovery, gain calibration,
or IQ/waterfall data from real RTL-SDR samples. Those integrations should land
behind explicit receive-only safety and privacy boundaries.

## Safety Boundary

RF Commons starts as a receive-only project. The project should not add transmit
features, private-signal harvesting, cellular/private decoding, encryption
bypass, or surveillance workflows.

See [docs/safety.md](docs/safety.md) for the project safety posture.

## Roadmap

- Local RTL-SDR receive path through a native helper or browser-compatible bridge.
- Public OpenWebRX/WebSDR-style receiver directory import.
- Real FFT/waterfall data pipeline.
- AM, FM, NFM, WFM, SSB, and CW receive profiles.
- Signal guide with beginner-friendly identification hints.
- Local-first SQLite or browser storage for bookmarks and logs.
- Club, school, and emergency-preparedness starter packs.
