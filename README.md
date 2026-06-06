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

Run it with any static file server:

```sh
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765`.

You can also run the repository checks with any Node.js runtime:

```sh
node scripts/check.mjs
```

If npm is available, `npm run check` runs the same script.

The current prototype does not yet connect to RTL-SDR hardware or remote SDR
nodes. Those integrations should land behind explicit receive-only safety and
privacy boundaries.

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
