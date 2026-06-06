(function () {
  "use strict";

  const storageKeys = {
    bookmarks: "rf-commons-bookmarks",
    logs: "rf-commons-logs",
  };

  const presets = [
    {
      name: "NOAA Weather",
      frequency: 162.55,
      mode: "NFM",
      span: 0.2,
      label: "162.400-162.550 MHz",
      tags: ["VHF", "voice"],
      summary: "Weather broadcast",
    },
    {
      name: "FM Broadcast",
      frequency: 99.5,
      mode: "WFM",
      span: 1,
      label: "88-108 MHz",
      tags: ["VHF", "wide"],
      summary: "Wideband broadcast",
    },
    {
      name: "Airband Tower",
      frequency: 124.85,
      mode: "AM",
      span: 0.2,
      label: "118-137 MHz",
      tags: ["VHF", "AM"],
      summary: "Aircraft voice",
    },
    {
      name: "APRS Packet",
      frequency: 144.39,
      mode: "NFM",
      span: 0.05,
      label: "144.390 MHz US",
      tags: ["VHF", "data"],
      summary: "1200 baud packet",
    },
    {
      name: "ADS-B",
      frequency: 1090,
      mode: "DATA",
      span: 2.4,
      label: "1090 MHz",
      tags: ["UHF", "pulse"],
      summary: "Aircraft position",
    },
    {
      name: "Shortwave Voice",
      frequency: 7.2,
      mode: "SSB",
      span: 0.05,
      label: "HF amateur",
      tags: ["HF", "voice"],
      summary: "SSB or AM voice",
    },
  ];

  const signalGuide = [
    {
      name: "NOAA Weather Radio",
      use: "Weather broadcast",
      bandwidth: "~12.5 kHz",
      mode: "NFM",
      next: "Try NFM with moderate squelch",
      band: "vhf",
      width: "narrow",
      sound: "broadcast",
      pattern: "steady",
      tags: ["VHF", "NFM", "Voice"],
      description: "A steady narrow FM carrier in the 162 MHz weather band.",
    },
    {
      name: "Narrowband FM Voice",
      use: "Ham, public service, local repeaters",
      bandwidth: "~12.5-25 kHz",
      mode: "NFM",
      next: "Tune the carrier center and adjust squelch",
      band: "vhf",
      width: "narrow",
      sound: "voice",
      pattern: "steady",
      tags: ["VHF", "UHF", "Voice"],
      description: "A slim voice channel with speech energy around the carrier.",
    },
    {
      name: "FM Broadcast",
      use: "Broadcast radio",
      bandwidth: "~150-200 kHz",
      mode: "WFM",
      next: "Use WFM and a wider span",
      band: "vhf",
      width: "wide",
      sound: "broadcast",
      pattern: "wideband",
      tags: ["VHF", "WFM", "Wide"],
      description: "A wide signal block across the commercial FM band.",
    },
    {
      name: "ADS-B",
      use: "Aircraft position broadcast",
      bandwidth: "~1-2 MHz",
      mode: "DATA",
      next: "Use an ADS-B decoder and map view",
      band: "uhf",
      width: "pulse",
      sound: "data",
      pattern: "bursty",
      tags: ["UHF", "1090 MHz", "Data"],
      description: "Short pulse bursts centered on 1090 MHz.",
    },
    {
      name: "APRS Packet",
      use: "Amateur position and message packets",
      bandwidth: "~12.5 kHz",
      mode: "NFM",
      next: "Pipe audio to a packet decoder",
      band: "vhf",
      width: "narrow",
      sound: "data",
      pattern: "bursty",
      tags: ["VHF", "AFSK", "Ham"],
      description: "Brief packet bursts, commonly 144.390 MHz in the US.",
    },
    {
      name: "CW Morse",
      use: "Amateur and utility Morse",
      bandwidth: "~500 Hz",
      mode: "CW",
      next: "Use a narrow filter and tune for a clear tone",
      band: "hf",
      width: "narrow",
      sound: "tone",
      pattern: "keyed",
      tags: ["HF", "CW", "Tone"],
      description: "A very narrow keyed tone that appears as dots and dashes.",
    },
    {
      name: "Airband AM",
      use: "Aircraft voice",
      bandwidth: "~8-25 kHz",
      mode: "AM",
      next: "Use AM and scan local tower or approach frequencies",
      band: "air",
      width: "narrow",
      sound: "voice",
      pattern: "bursty",
      tags: ["VHF", "AM", "Air"],
      description: "Intermittent AM voice signals across the aviation band.",
    },
    {
      name: "Shortwave AM/SSB",
      use: "Broadcast, amateur, utility",
      bandwidth: "~2.4-10 kHz",
      mode: "AM/SSB",
      next: "Try AM first, then USB or LSB",
      band: "hf",
      width: "narrow",
      sound: "voice",
      pattern: "steady",
      tags: ["HF", "AM", "SSB"],
      description: "Narrow HF channels that may fade or drift over time.",
    },
  ];

  const receivers = [
    {
      name: "Community HF Node",
      place: "Club-hosted receiver",
      bands: ["HF"],
      status: "Directory seed",
      x: 22,
      y: 58,
      note: "Good for shortwave and amateur HF discovery.",
    },
    {
      name: "Campus VHF Station",
      place: "School receiver",
      bands: ["VHF"],
      status: "Directory seed",
      x: 44,
      y: 36,
      note: "Starter range for NOAA, airband, APRS, and local repeaters.",
    },
    {
      name: "Emergency Prep Receiver",
      place: "Local public-service lab",
      bands: ["VHF", "UHF"],
      status: "Directory seed",
      x: 65,
      y: 48,
      note: "Designed for training, weather, and community readiness.",
    },
    {
      name: "Open SDR Gateway",
      place: "Public internet node",
      bands: ["HF", "VHF", "UHF"],
      status: "Directory seed",
      x: 78,
      y: 24,
      note: "A placeholder for imported OpenWebRX/WebSDR-style nodes.",
    },
    {
      name: "ADS-B Listening Post",
      place: "Aviation data station",
      bands: ["UHF"],
      status: "Directory seed",
      x: 36,
      y: 74,
      note: "A training target for 1090 MHz aircraft broadcasts.",
    },
  ];

  const state = {
    view: "listen",
    source: "rtl",
    frequency: 162.55,
    mode: "NFM",
    span: 0.2,
    gain: 28,
    bandwidth: 12,
    squelch: -55,
    running: true,
    bookmarks: readStorage(storageKeys.bookmarks),
    logs: readStorage(storageKeys.logs),
    animationFrame: 0,
    sweep: 0,
    waterfallSeeded: false,
    audioEnabled: false,
    audioUnavailable: false,
    audioMessage: "Checking receiver helper",
    audioUrl: "/audio.mp3?freq=162.550&mode=NFM",
    audioUrlDirty: false,
    receiverHealth: null,
    volume: 0.38,
  };

  const audioPlayer = new Audio();
  let lastAudioActivation = 0;

  const els = {
    sourceStatus: document.getElementById("sourceStatus"),
    presetList: document.getElementById("presetList"),
    frequencyInput: document.getElementById("frequencyInput"),
    modeSelect: document.getElementById("modeSelect"),
    spanSelect: document.getElementById("spanSelect"),
    gainSlider: document.getElementById("gainSlider"),
    bandwidthSlider: document.getElementById("bandwidthSlider"),
    squelchSlider: document.getElementById("squelchSlider"),
    volumeSlider: document.getElementById("volumeSlider"),
    audioStreamInput: document.getElementById("audioStreamInput"),
    scanToggle: document.getElementById("scanToggle"),
    audioToggle: document.getElementById("audioToggle"),
    bookmarkButton: document.getElementById("bookmarkButton"),
    bookmarkList: document.getElementById("bookmarkList"),
    logForm: document.getElementById("logForm"),
    logNote: document.getElementById("logNote"),
    logList: document.getElementById("logList"),
    signalName: document.getElementById("signalName"),
    signalUse: document.getElementById("signalUse"),
    signalBandwidth: document.getElementById("signalBandwidth"),
    signalNext: document.getElementById("signalNext"),
    audioStatus: document.getElementById("audioStatus"),
    signalGuide: document.getElementById("signalGuide"),
    matchStrip: document.getElementById("matchStrip"),
    identifyBand: document.getElementById("identifyBand"),
    identifyWidth: document.getElementById("identifyWidth"),
    identifySound: document.getElementById("identifySound"),
    identifyPattern: document.getElementById("identifyPattern"),
    receiverFilter: document.getElementById("receiverFilter"),
    receiverList: document.getElementById("receiverList"),
    mapCanvas: document.getElementById("mapCanvas"),
    spectrumCanvas: document.getElementById("spectrumCanvas"),
    waterfallCanvas: document.getElementById("waterfallCanvas"),
  };

  const contexts = {
    spectrum: els.spectrumCanvas.getContext("2d"),
    waterfall: els.waterfallCanvas.getContext("2d", { willReadFrequently: true }),
  };

  function init() {
    renderPresets();
    renderGuide();
    renderReceivers();
    setupAudioPlayer();
    bindEvents();
    syncControls();
    renderStorage();
    identifySignal();
    void checkReceiverHealth();
    startVisualization();
  }

  function bindEvents() {
    document.querySelectorAll(".mode-tab").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    document.querySelectorAll(".segment").forEach((button) => {
      button.addEventListener("click", () => setSource(button.dataset.source));
    });

    els.frequencyInput.addEventListener("input", () => {
      state.frequency = Number(els.frequencyInput.value) || state.frequency;
      syncSuggestedAudioUrl();
      identifySignal();
    });

    els.modeSelect.addEventListener("change", () => {
      state.mode = els.modeSelect.value;
      syncSuggestedAudioUrl();
      identifySignal();
    });

    els.spanSelect.addEventListener("change", () => {
      state.span = Number(els.spanSelect.value);
    });

    els.gainSlider.addEventListener("input", () => {
      state.gain = Number(els.gainSlider.value);
    });

    els.bandwidthSlider.addEventListener("input", () => {
      state.bandwidth = Number(els.bandwidthSlider.value);
      identifySignal();
    });

    els.squelchSlider.addEventListener("input", () => {
      state.squelch = Number(els.squelchSlider.value);
    });

    els.volumeSlider.addEventListener("input", () => {
      state.volume = Number(els.volumeSlider.value) / 100;
      audioPlayer.volume = state.volume;
    });

    els.audioStreamInput.addEventListener("input", () => {
      state.audioUrlDirty = true;
      state.audioUrl = els.audioStreamInput.value.trim();
      if (state.audioEnabled) stopReceiverAudio("Stream changed. Reconnect audio.");
    });

    els.scanToggle.addEventListener("click", toggleScan);
    if (window.PointerEvent) {
      document.addEventListener("pointerdown", handleAudioActivation);
    } else {
      document.addEventListener("click", handleAudioActivation);
    }
    document.addEventListener("keydown", handleAudioKeydown);
    els.bookmarkButton.addEventListener("click", addBookmark);

    els.logForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addLog();
    });

    [els.identifyBand, els.identifyWidth, els.identifySound, els.identifyPattern].forEach(
      (select) => select.addEventListener("change", renderMatches)
    );

    els.receiverFilter.addEventListener("change", renderReceivers);

    window.addEventListener("resize", () => {
      drawSpectrum();
      drawWaterfall();
    });
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".mode-tab").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    document.querySelectorAll(".view-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `${view}View`);
    });
  }

  function setSource(source) {
    state.source = source;
    document.querySelectorAll(".segment").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.source === source);
    });
    const labels = {
      synthetic: "Demo waterfall only",
      rtl: "RTL-SDR local helper",
      public: "Public receiver stream",
    };
    if (source !== "public" && !state.audioUrlDirty) syncSuggestedAudioUrl();
    if (source === "public" && !state.audioUrlDirty) {
      state.audioUrl = "";
      state.audioMessage = "Paste a public receiver audio stream URL";
    } else if (!state.audioEnabled) {
      state.audioMessage = receiverStatusMessage();
    }
    if (state.audioEnabled) stopReceiverAudio("Source changed. Reconnect audio.");
    els.sourceStatus.textContent = labels[source];
    syncControls();
  }

  function renderPresets() {
    els.presetList.replaceChildren(
      ...presets.map((preset) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "preset-card";
        button.innerHTML = `
          <strong>${escapeHtml(preset.name)}</strong>
          <span>${escapeHtml(preset.label)} | ${escapeHtml(preset.mode)}</span>
          <small>${escapeHtml(preset.summary)}</small>
        `;
        button.addEventListener("click", () => applyPreset(preset));
        return button;
      })
    );
  }

  function applyPreset(preset) {
    state.frequency = preset.frequency;
    state.mode = preset.mode;
    state.span = preset.span;
    syncSuggestedAudioUrl();
    if (state.audioEnabled) stopReceiverAudio("Preset changed. Reconnect audio.");
    syncControls();
    identifySignal();
    setView("listen");
  }

  function syncControls() {
    els.frequencyInput.value = state.frequency.toFixed(state.frequency >= 1000 ? 0 : 3);
    els.modeSelect.value = state.mode;
    els.spanSelect.value = String(state.span);
    els.gainSlider.value = String(state.gain);
    els.bandwidthSlider.value = String(state.bandwidth);
    els.squelchSlider.value = String(state.squelch);
    els.volumeSlider.value = String(Math.round(state.volume * 100));
    els.audioStreamInput.value = state.audioUrl;
    els.scanToggle.classList.toggle("is-running", state.running);
    els.scanToggle.setAttribute("aria-label", state.running ? "Pause scan" : "Start scan");
    els.scanToggle.title = state.running ? "Pause scan" : "Start scan";
    els.scanToggle.firstElementChild.textContent = state.running ? "||" : ">";
    els.audioToggle.classList.toggle("is-audio-on", state.audioEnabled);
    els.audioToggle.setAttribute("aria-label", state.audioEnabled ? "Stop audio" : "Connect audio");
    els.audioToggle.title = state.audioEnabled ? "Stop audio" : "Connect audio";
    els.audioToggle.firstElementChild.textContent = state.audioEnabled ? "||" : ">";
    els.audioToggle.lastChild.textContent = state.audioEnabled ? " Stop audio" : " Connect audio";
    document.documentElement.dataset.audio = state.audioUnavailable
      ? "unavailable"
      : state.audioEnabled
        ? "on"
        : "off";
    els.audioStatus.textContent = state.audioMessage;
  }

  function toggleScan() {
    state.running = !state.running;
    syncControls();
    if (state.running) startVisualization();
  }

  function handleAudioActivation(event) {
    const rawTarget = event.target;
    const target =
      rawTarget instanceof Element
        ? rawTarget
        : rawTarget && "parentElement" in rawTarget
          ? rawTarget.parentElement
          : null;
    const button = target ? target.closest("#audioToggle") : null;
    if (!button) return;
    event.preventDefault();
    const now = Date.now();
    if (now - lastAudioActivation < 350) return;
    lastAudioActivation = now;
    void toggleAudio();
  }

  function handleAudioKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    handleAudioActivation(event);
  }

  async function toggleAudio() {
    if (state.audioEnabled) {
      stopReceiverAudio("Audio stopped");
      return;
    }
    await connectReceiverAudio();
  }

  function identifySignal() {
    const guide = scoreGuide({
      frequency: state.frequency,
      mode: state.mode,
      bandwidth: state.bandwidth,
    })[0];

    els.signalName.textContent = guide.name;
    els.signalUse.textContent = guide.use;
    els.signalBandwidth.textContent = guide.bandwidth;
    els.signalNext.textContent = guide.next;
  }

  function setupAudioPlayer() {
    audioPlayer.preload = "none";
    audioPlayer.volume = state.volume;
    audioPlayer.addEventListener("playing", () => {
      state.audioEnabled = true;
      state.audioUnavailable = false;
      state.audioMessage = "Playing receiver stream";
      syncControls();
    });
    audioPlayer.addEventListener("waiting", () => {
      if (!state.audioEnabled) return;
      state.audioMessage = "Receiver stream buffering";
      syncControls();
    });
    audioPlayer.addEventListener("ended", () => {
      stopReceiverAudio("Receiver stream ended");
    });
    audioPlayer.addEventListener("error", () => {
      state.audioEnabled = false;
      state.audioUnavailable = true;
      state.audioMessage = "Audio stream failed or is not reachable";
      syncControls();
    });
  }

  async function connectReceiverAudio() {
    const url = state.audioUrl.trim();
    if (!url) {
      state.audioEnabled = false;
      state.audioUnavailable = true;
      state.audioMessage = "Enter a receiver audio stream URL";
      syncControls();
      return;
    }

    state.audioEnabled = false;
    state.audioUnavailable = false;
    state.audioMessage = "Connecting receiver stream";
    syncControls();

    try {
      audioPlayer.pause();
      audioPlayer.src = url;
      audioPlayer.volume = state.volume;
      await audioPlayer.play();
      state.audioEnabled = true;
      state.audioMessage = "Playing receiver stream";
    } catch (error) {
      state.audioEnabled = false;
      state.audioUnavailable = true;
      state.audioMessage = "Audio stream failed or was blocked";
    }
    syncControls();
  }

  function stopReceiverAudio(message) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    state.audioEnabled = false;
    state.audioMessage = message;
    syncControls();
  }

  function syncSuggestedAudioUrl() {
    if (state.audioUrlDirty || state.source === "public") return;
    const params = new URLSearchParams({
      freq: formatFrequency(state.frequency),
      mode: state.mode,
    });
    state.audioUrl = `/audio.mp3?${params.toString()}`;
  }

  async function checkReceiverHealth() {
    if (window.location.protocol === "file:") {
      state.receiverHealth = null;
      state.audioMessage = "Run node scripts/dev.mjs for receiver audio";
      syncControls();
      return;
    }

    try {
      const response = await fetch("/health", { cache: "no-store" });
      if (!response.ok) throw new Error(`health ${response.status}`);
      state.receiverHealth = await response.json();
      if (!state.audioEnabled && state.source !== "public") {
        state.audioMessage = receiverStatusMessage();
        syncControls();
      }
    } catch {
      state.receiverHealth = null;
      if (!state.audioEnabled && state.source !== "public") {
        state.audioMessage = "Run node scripts/dev.mjs for receiver audio";
        syncControls();
      }
    }
  }

  function receiverStatusMessage() {
    if (state.source === "synthetic") return "Demo waterfall only";
    if (!state.receiverHealth) return "Checking receiver helper";
    if (state.receiverHealth.ok) return "Receiver helper ready";
    if (!state.receiverHealth.rtl_fm && !state.receiverHealth.ffmpeg) {
      return "Install rtl_fm and ffmpeg, then restart dev server";
    }
    if (!state.receiverHealth.rtl_fm) return "Install rtl_fm, then restart dev server";
    if (!state.receiverHealth.ffmpeg) return "Install ffmpeg, then restart dev server";
    if (state.receiverHealth.device && state.receiverHealth.device.ok === false) {
      return "Plug in an RTL-SDR dongle, then refresh";
    }
    if (state.receiverHealth.device && state.receiverHealth.device.ok === null) {
      return "Install rtl_test for device detection";
    }
    return "Receiver helper not ready";
  }

  function scoreGuide(input) {
    return signalGuide
      .map((signal) => {
        let score = 0;
        if (signal.mode.includes(input.mode)) score += 3;
        if (input.bandwidth < 30 && signal.width === "narrow") score += 1;
        if (input.bandwidth >= 100 && signal.width === "wide") score += 2;
        if (input.frequency > 108 && input.frequency < 174 && signal.band === "vhf") score += 2;
        if (input.frequency > 400 && input.frequency < 1300 && signal.band === "uhf") score += 2;
        if (input.frequency < 30 && signal.band === "hf") score += 2;
        if (input.frequency >= 118 && input.frequency <= 137 && signal.band === "air") score += 4;
        if (Math.abs(input.frequency - 162.55) < 0.2 && signal.name.includes("NOAA")) score += 6;
        if (Math.abs(input.frequency - 1090) < 2 && signal.name === "ADS-B") score += 6;
        if (Math.abs(input.frequency - 144.39) < 0.1 && signal.name === "APRS Packet") score += 6;
        return { ...signal, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  function renderStorage() {
    renderBookmarks();
    renderLogs();
  }

  function addBookmark() {
    const match = scoreGuide({
      frequency: state.frequency,
      mode: state.mode,
      bandwidth: state.bandwidth,
    })[0];
    const bookmark = {
      id: uniqueId(),
      name: match.name,
      frequency: state.frequency,
      mode: state.mode,
      createdAt: new Date().toISOString(),
    };
    state.bookmarks.unshift(bookmark);
    writeStorage(storageKeys.bookmarks, state.bookmarks);
    renderBookmarks();
  }

  function renderBookmarks() {
    if (!state.bookmarks.length) {
      els.bookmarkList.innerHTML = '<p class="empty-state">No bookmarks yet.</p>';
      return;
    }

    els.bookmarkList.replaceChildren(
      ...state.bookmarks.map((bookmark) => {
        const item = document.createElement("article");
        item.className = "entry-card";
        item.innerHTML = `
          <strong>${escapeHtml(bookmark.name)}</strong>
          <dl>
            <div>
              <dt>Frequency</dt>
              <dd>${formatFrequency(bookmark.frequency)} MHz</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>${escapeHtml(bookmark.mode)}</dd>
            </div>
          </dl>
          <div class="entry-actions">
            <button class="entry-button" type="button" data-action="tune">Tune</button>
            <button class="entry-button" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector('[data-action="tune"]').addEventListener("click", () => {
          state.frequency = bookmark.frequency;
          state.mode = bookmark.mode;
          syncControls();
          identifySignal();
        });
        item.querySelector('[data-action="delete"]').addEventListener("click", () => {
          state.bookmarks = state.bookmarks.filter((entry) => entry.id !== bookmark.id);
          writeStorage(storageKeys.bookmarks, state.bookmarks);
          renderBookmarks();
        });
        return item;
      })
    );
  }

  function addLog() {
    const note = els.logNote.value.trim();
    if (!note) return;
    const log = {
      id: uniqueId(),
      note,
      frequency: state.frequency,
      mode: state.mode,
      createdAt: new Date().toISOString(),
    };
    state.logs.unshift(log);
    els.logNote.value = "";
    writeStorage(storageKeys.logs, state.logs);
    renderLogs();
  }

  function renderLogs() {
    if (!state.logs.length) {
      els.logList.innerHTML = '<p class="empty-state">No log entries yet.</p>';
      return;
    }

    els.logList.replaceChildren(
      ...state.logs.map((log) => {
        const item = document.createElement("article");
        item.className = "entry-card";
        item.innerHTML = `
          <strong>${formatFrequency(log.frequency)} MHz | ${escapeHtml(log.mode)}</strong>
          <p>${escapeHtml(log.note)}</p>
          <div class="entry-actions">
            <button class="entry-button" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector('[data-action="delete"]').addEventListener("click", () => {
          state.logs = state.logs.filter((entry) => entry.id !== log.id);
          writeStorage(storageKeys.logs, state.logs);
          renderLogs();
        });
        return item;
      })
    );
  }

  function renderGuide() {
    els.signalGuide.replaceChildren(
      ...signalGuide.map((signal, index) => {
        const card = document.createElement("article");
        card.className = "signal-card";
        card.innerHTML = `
          <div class="tag-row">${renderTags(signal.tags, index)}</div>
          <h3>${escapeHtml(signal.name)}</h3>
          <p>${escapeHtml(signal.description)}</p>
          <p><strong>${escapeHtml(signal.mode)}</strong> | ${escapeHtml(signal.bandwidth)}</p>
        `;
        return card;
      })
    );
    renderMatches();
  }

  function renderMatches() {
    const observation = {
      band: els.identifyBand.value,
      width: els.identifyWidth.value,
      sound: els.identifySound.value,
      pattern: els.identifyPattern.value,
    };
    const matches = signalGuide
      .map((signal) => {
        const score = ["band", "width", "sound", "pattern"].reduce(
          (total, key) => total + (signal[key] === observation[key] ? 1 : 0),
          0
        );
        return { ...signal, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    els.matchStrip.replaceChildren(
      ...matches.map((match) => {
        const card = document.createElement("article");
        card.className = "match-card";
        card.innerHTML = `
          <h3>${escapeHtml(match.name)}</h3>
          <p>${escapeHtml(match.use)}</p>
          <p>${escapeHtml(match.next)}</p>
        `;
        return card;
      })
    );
  }

  function renderReceivers() {
    const filter = els.receiverFilter.value;
    const filtered = receivers.filter(
      (receiver) => filter === "all" || receiver.bands.includes(filter)
    );

    els.mapCanvas.replaceChildren(
      ...filtered.map((receiver) => {
        const pin = document.createElement("button");
        pin.type = "button";
        pin.className = "receiver-pin";
        pin.style.left = `${receiver.x}%`;
        pin.style.top = `${receiver.y}%`;
        pin.dataset.band = receiver.bands[0];
        pin.setAttribute("aria-label", receiver.name);
        pin.title = receiver.name;
        pin.addEventListener("click", () => tuneReceiver(receiver));
        return pin;
      })
    );

    els.receiverList.replaceChildren(
      ...filtered.map((receiver) => {
        const card = document.createElement("article");
        card.className = "receiver-card";
        card.innerHTML = `
          <div class="receiver-meta">${renderTags(receiver.bands, receiver.bands.length)}</div>
          <h3>${escapeHtml(receiver.name)}</h3>
          <p>${escapeHtml(receiver.place)} | ${escapeHtml(receiver.status)}</p>
          <p>${escapeHtml(receiver.note)}</p>
        `;
        card.addEventListener("click", () => tuneReceiver(receiver));
        return card;
      })
    );
  }

  function tuneReceiver(receiver) {
    const bandToPreset = {
      HF: presets.find((preset) => preset.tags.includes("HF")),
      VHF: presets.find((preset) => preset.tags.includes("VHF")),
      UHF: presets.find((preset) => preset.tags.includes("UHF")),
    };
    const preset = bandToPreset[receiver.bands[0]] || presets[0];
    applyPreset(preset);
    setSource("public");
  }

  function startVisualization() {
    cancelAnimationFrame(state.animationFrame);
    const tick = () => {
      if (!state.running) return;
      state.sweep += 0.018;
      drawSpectrum();
      drawWaterfall();
      state.animationFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  function drawSpectrum() {
    const { width, height } = els.spectrumCanvas;
    const ctx = contexts.spectrum;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111414";
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx, width, height, 8, 4);

    const points = 260;
    ctx.beginPath();
    for (let i = 0; i < points; i += 1) {
      const x = (i / (points - 1)) * width;
      const level = spectrumLevel(i / (points - 1));
      const y = height - level * height * 0.86 - 18;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#96f2d7";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, "rgba(150, 242, 215, 0.38)");
    fill.addColorStop(1, "rgba(150, 242, 215, 0.04)");
    ctx.fillStyle = fill;
    ctx.fill();

    drawFrequencyTicks(ctx, width, height);
  }

  function drawWaterfall() {
    const canvas = els.waterfallCanvas;
    const ctx = contexts.waterfall;
    const { width, height } = canvas;
    if (!state.waterfallSeeded) {
      const image = ctx.createImageData(width, height);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const level = spectrumLevel(x / (width - 1), y * 0.018);
          const color = heatColor(level);
          const index = (y * width + x) * 4;
          image.data[index] = color[0];
          image.data[index + 1] = color[1];
          image.data[index + 2] = color[2];
          image.data[index + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      state.waterfallSeeded = true;
      return;
    }

    const previous = ctx.getImageData(0, 0, width, height - 2);
    ctx.putImageData(previous, 0, 2);
    const row = ctx.createImageData(width, 2);
    for (let x = 0; x < width; x += 1) {
      const level = spectrumLevel(x / (width - 1));
      const color = heatColor(level);
      for (let y = 0; y < 2; y += 1) {
        const index = (y * width + x) * 4;
        row.data[index] = color[0];
        row.data[index + 1] = color[1];
        row.data[index + 2] = color[2];
        row.data[index + 3] = 255;
      }
    }
    ctx.putImageData(row, 0, 0);
  }

  function spectrumLevel(position, phaseOffset = 0) {
    const phase = state.sweep + phaseOffset;
    const center = 0.5;
    const noise =
      0.06 * Math.sin(position * 58 + phase * 3) +
      0.04 * Math.sin(position * 131 + phase * 1.7);
    const signalWidth = Math.max(0.012, Math.min(0.16, state.bandwidth / 800));
    const primary = gaussian(position, center + Math.sin(phase) * 0.012, signalWidth);
    const secondary = gaussian(position, 0.24, 0.018) * signalPresence("APRS Packet");
    const third = gaussian(position, 0.72, 0.035) * signalPresence("Airband AM");
    const wide = gaussian(position, 0.48, 0.13) * (state.mode === "WFM" ? 0.55 : 0);
    const gain = state.gain / 62;
    return clamp(0.12 + noise + primary * gain + secondary * 0.44 + third * 0.3 + wide, 0, 1);
  }

  function signalPresence(name) {
    const likely = scoreGuide({
      frequency: state.frequency,
      mode: state.mode,
      bandwidth: state.bandwidth,
    }).find((signal) => signal.name === name);
    return likely ? likely.score / 12 : 0;
  }

  function drawGrid(ctx, width, height, columns, rows) {
    ctx.strokeStyle = "rgba(203, 213, 207, 0.16)";
    ctx.lineWidth = 1;
    for (let column = 1; column < columns; column += 1) {
      const x = (column / columns) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let row = 1; row < rows; row += 1) {
      const y = (row / rows) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawFrequencyTicks(ctx, width, height) {
    const left = state.frequency - state.span / 2;
    const right = state.frequency + state.span / 2;
    ctx.fillStyle = "rgba(251, 252, 248, 0.78)";
    ctx.font = "700 18px Inter, system-ui, sans-serif";
    ctx.fillText(`${formatFrequency(left)} MHz`, 18, height - 20);
    ctx.textAlign = "center";
    ctx.fillText(`${formatFrequency(state.frequency)} MHz`, width / 2, height - 20);
    ctx.textAlign = "right";
    ctx.fillText(`${formatFrequency(right)} MHz`, width - 18, height - 20);
    ctx.textAlign = "left";
  }

  function heatColor(level) {
    if (level > 0.76) return [242, 202, 100];
    if (level > 0.56) return [242, 106, 141];
    if (level > 0.34) return [150, 242, 215];
    if (level > 0.18) return [0, 143, 140];
    return [20, 25, 24];
  }

  function gaussian(x, mean, width) {
    const distance = (x - mean) / width;
    return Math.exp(-0.5 * distance * distance);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function renderTags(tags, seed) {
    const colors = ["teal", "rose", "amber", "violet"];
    return tags
      .map((tag, index) => {
        const color = colors[(index + seed) % colors.length];
        return `<span class="tag ${color}">${escapeHtml(tag)}</span>`;
      })
      .join("");
  }

  function formatFrequency(frequency) {
    if (frequency >= 1000) return frequency.toFixed(0);
    if (frequency >= 100) return frequency.toFixed(3);
    if (frequency >= 10) return frequency.toFixed(3);
    return frequency.toFixed(4);
  }

  function uniqueId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `rf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[char];
    });
  }

  init();
})();
