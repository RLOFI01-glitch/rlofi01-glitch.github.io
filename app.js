// R LOFI 01 - Main Application Logic (v8)
const DATA_URL = "songs.json";
const CONFIG_URL = "config.json";
const REQUESTS_URL = "requests.json";

let songs = [];
let filteredSongs = [];
let currentIdx = -1;
let currentMood = "All";
let likedSongs = JSON.parse(localStorage.getItem("rlofi_likes") || "[]");
let siteConfig = {
  title: "R LOFI 01",
  bio: "Late night lofi, sad melodies & emotional Hinglish vibes.",
  avatar: "",
  accent: "#a855f7",
  iconSize: 32,
  ytUrl: "https://youtube.com",
  instaUrl: "https://instagram.com",
  showRadioBadge: true,
  showAmbientStudio: true,
  showDedicateBtn: true,
  showRequestBox: true,
  icons: {}
};

const audio = document.getElementById("audioPlayer");

// 1. Initialize App
async function initApp() {
  await loadConfig();
  await loadSongs();
  checkDedicationURL();
  bindEvents();
}

// 2. Load Site Configuration & Custom Icons
async function loadConfig() {
  try {
    const res = await fetch(`${CONFIG_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      siteConfig = { ...siteConfig, ...data };
    }
  } catch (e) { console.log("Using default config"); }

  // Apply Theme & Icon Size
  document.documentElement.style.setProperty("--accent", siteConfig.accent || "#a855f7");
  document.documentElement.style.setProperty("--accent-glow", hexToGlow(siteConfig.accent || "#a855f7"));
  document.documentElement.style.setProperty("--icon-size", (siteConfig.iconSize || 32) + "px");

  // Apply Hero Content
  document.getElementById("siteTitle").textContent = siteConfig.title || "R LOFI 01";
  document.getElementById("siteBio").textContent = siteConfig.bio || "";
  if (siteConfig.avatar) document.getElementById("siteAvatar").src = siteConfig.avatar;
  if (siteConfig.ytUrl) document.getElementById("ytChannelLink").href = siteConfig.ytUrl;
  if (siteConfig.instaUrl) document.getElementById("instaLink").href = siteConfig.instaUrl;

  // Apply Feature Toggles from Admin Panel
  document.getElementById("radioBadge").style.display = siteConfig.showRadioBadge !== false ? "inline-flex" : "none";
  document.getElementById("ambientSection").style.display = siteConfig.showAmbientStudio !== false ? "block" : "none";
  document.getElementById("requestSection").style.display = siteConfig.showRequestBox !== false ? "block" : "none";
  document.getElementById("fullDedicateBtn").style.display = siteConfig.showDedicateBtn !== false ? "inline-block" : "none";
}

function hexToGlow(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) || 168;
  const g = parseInt(c.substring(2, 4), 16) || 85;
  const b = parseInt(c.substring(4, 6), 16) || 247;
  return `rgba(${r}, ${g}, ${b}, 0.35)`;
}

// Helper for Custom Icon or Emoji Fallback
function getIconHTML(key, fallbackEmoji) {
  const customUrl = siteConfig.icons && siteConfig.icons[key];
  if (customUrl) {
    return `<img src="${customUrl}" class="custom-icon" alt="${key}">`;
  }
  return fallbackEmoji;
}

// 3. Load Songs List
async function loadSongs() {
  try {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (res.ok) {
      songs = await res.json();
    }
  } catch (e) { songs = []; }
  renderSongs();
}

function renderSongs() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();
  filteredSongs = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(query) || (s.mood || "").toLowerCase().includes(query);
    if (currentMood === "All") return matchesSearch;
    if (currentMood === "Saved") return matchesSearch && likedSongs.includes(s.id);
    return matchesSearch && (s.mood || "").toLowerCase() === currentMood.toLowerCase();
  });

  const listEl = document.getElementById("songList");
  document.getElementById("songCount").textContent = `${filteredSongs.length} tracks`;

  if (filteredSongs.length === 0) {
    listEl.innerHTML = `<div class="glass" style="padding:24px; text-align:center; color:var(--muted); font-size:13.5px;">No tracks found in this mood.</div>`;
    return;
  }

  listEl.innerHTML = filteredSongs.map((song, idx) => {
    const isPlaying = currentIdx >= 0 && songs[currentIdx] && songs[currentIdx].id === song.id && !audio.paused;
    const devoteBtn = siteConfig.showDedicateBtn !== false
      ? `<button class="icon-btn" onclick="openDedicate('${song.id}')" title="Dedicate Song">${getIconHTML("dedicate", "💌")}</button>`
      : "";

    return `
      <div class="song-card glass ${isPlaying ? "playing" : ""}">
        <div class="thumb-box" onclick="playSongById('${song.id}')">
          <img src="${song.cover}" alt="${song.title}">
          <div class="play-overlay">${isPlaying ? "⏸️" : "▶️"}</div>
        </div>
        <div class="song-info" onclick="playSongById('${song.id}')">
          <div class="song-title">${song.title}</div>
          <div class="song-meta">
            <span class="mood-tag">${song.mood || "Lofi"}</span>
            <span>${song.desc ? song.desc.slice(0, 28) + (song.desc.length > 28 ? "..." : "") : "R LOFI 01"}</span>
          </div>
        </div>
        <div class="card-actions">
          ${devoteBtn}
          <a href="${song.audio}" download="${song.title}.mp3" class="icon-btn" title="Download">${getIconHTML("download", "⬇️")}</a>
        </div>
      </div>
    `;
  }).join("");
}
// 4. Player Controls & Double-Tap YouTube
function playSongById(id) {
  const index = songs.findIndex(s => s.id === id);
  if (index === -1) return;

  if (currentIdx === index) {
    togglePlay();
    return;
  }

  currentIdx = index;
  const song = songs[currentIdx];
  audio.src = song.audio;
  audio.play();
  updatePlayerUI();
  renderSongs();
}

function togglePlay() {
  if (currentIdx === -1 && songs.length > 0) {
    playSongById(songs[0].id);
    return;
  }
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
  updatePlayerUI();
  renderSongs();
}

function updatePlayerUI() {
  if (currentIdx < 0 || !songs[currentIdx]) return;
  const song = songs[currentIdx];
  const isPaused = audio.paused;

  document.getElementById("miniPlayer").style.display = "flex";
  document.getElementById("miniThumb").src = song.cover;
  document.getElementById("miniTitle").textContent = song.title;
  document.getElementById("miniSub").textContent = `${song.mood || "Lofi"} • R LOFI 01`;
  document.getElementById("miniPlayBtn").textContent = isPaused ? "▶️" : "⏸️";

  document.getElementById("fullCover").src = song.cover;
  document.getElementById("fullTitle").textContent = song.title;
  document.getElementById("fullMood").textContent = `${song.mood || "Lofi"} • R LOFI 01`;
  document.getElementById("fullPlayBtn").textContent = isPaused ? "▶️" : "⏸️";
  document.getElementById("fullYtBtn").href = song.ytUrl || siteConfig.ytUrl || "https://youtube.com";

  // Lyrics Box
  const lyricsBox = document.getElementById("lyricsBox");
  if (song.lyrics && song.lyrics.trim() !== "") {
    lyricsBox.textContent = song.lyrics;
  } else {
    lyricsBox.textContent = getAutoHinglishShayari(song);
  }

  // Like Button State
  const isLiked = likedSongs.includes(song.id);
  document.getElementById("likeBtn").textContent = isLiked ? "❤️ Liked" : "🤍 Like";
}

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// 5. Web Audio API: Built-in Rain & Vinyl Crackle Synthesizer (No MP3 needed!)
let audioCtx = null;
let rainGain = null;
let vinylGain = null;

function initAmbientAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  // Rain Generator (Filtered Pink/Brown Noise)
  const bufferSize = 2 * audioCtx.sampleRate;
  const rainBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const rainData = rainBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    rainData[i] = (lastOut + (0.04 * white)) / 1.04;
    lastOut = rainData[i];
    rainData[i] *= 2.8;
  }
  const rainSource = audioCtx.createBufferSource();
  rainSource.buffer = rainBuffer;
  rainSource.loop = true;

  const rainFilter = audioCtx.createBiquadFilter();
  rainFilter.type = "lowpass";
  rainFilter.frequency.value = 950;

  rainGain = audioCtx.createGain();
  rainGain.gain.value = 0;
  rainSource.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(audioCtx.destination);
  rainSource.start(0);

  // Vinyl Crackle Generator (Sparse Impulse Pops + Warm Hum)
  const vinylBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const vinylData = vinylBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const r = Math.random();
    vinylData[i] = r > 0.9982 ? (Math.random() * 2 - 1) * 0.65 : (Math.random() * 2 - 1) * 0.015;
  }
  const vinylSource = audioCtx.createBufferSource();
  vinylSource.buffer = vinylBuffer;
  vinylSource.loop = true;

  const vinylFilter = audioCtx.createBiquadFilter();
  vinylFilter.type = "bandpass";
  vinylFilter.frequency.value = 1800;

  vinylGain = audioCtx.createGain();
  vinylGain.gain.value = 0;
  vinylSource.connect(vinylFilter);
  vinylFilter.connect(vinylGain);
  vinylGain.connect(audioCtx.destination);
  vinylSource.start(0);
}

function updateAmbientLevels() {
  const rainVal = Number(document.getElementById("rainSlider").value);
  const vinylVal = Number(document.getElementById("vinylSlider").value);

  if (rainVal > 0 || vinylVal > 0) {
    initAmbientAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  if (rainGain) rainGain.gain.setTargetAtTime((rainVal / 100) * 0.45, audioCtx.currentTime, 0.05);
  if (vinylGain) vinylGain.gain.setTargetAtTime((vinylVal / 100) * 0.55, audioCtx.currentTime, 0.05);

  // Show/Hide Smart Mute Pill inside Mini & Full Player
  const isActive = rainVal > 0 || vinylVal > 0;
  document.getElementById("miniAmbientMute").style.display = isActive ? "inline-flex" : "none";
  document.getElementById("fullAmbientMute").style.display = isActive ? "inline-flex" : "none";
}

function muteAllAmbient() {
  document.getElementById("rainSlider").value = 0;
  document.getElementById("vinylSlider").value = 0;
  updateAmbientLevels();
    }
// 6. Auto Hinglish Shayari & Instagram Story Card Generator
function getAutoHinglishShayari(song) {
  if (song.lyrics && song.lyrics.trim()) {
    return song.lyrics.trim().split("\n").slice(0, 3).join("\n");
  }
  if (song.desc && song.desc.trim()) {
    return `"${song.desc.trim()}"`;
  }
  const mood = (song.mood || "Lofi").toLowerCase();
  if (mood.includes("sad")) {
    return `"Kuch baatein adhoori reh jaati hain,\nPar unki yaadein har raat geet ban jaati hain..."`;
  }
  if (mood.includes("romantic")) {
    return `"Teri khamoshi bhi ek dhun si lagti hai,\nHar shaam ab bas tere naam se sajti hai..."`;
  }
  return `"Raat ki khamoshi aur ye halki si dhun,\nDil ke har dard ko sukoon de jaati hai..."`;
}

function generateStoryCard() {
  if (currentIdx < 0 || !songs[currentIdx]) return;
  const song = songs[currentIdx];
  const canvas = document.getElementById("storyCanvas");
  const ctx = canvas.getContext("2d");

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 720, 1280);
  grad.addColorStop(0, "#0b0918");
  grad.addColorStop(0.5, "#1d1035");
  grad.addColorStop(1, "#07070c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 1280);

  // Subtle Glow Circle
  const rad = ctx.createRadialGradient(360, 420, 40, 360, 420, 340);
  rad.addColorStop(0, "rgba(168, 85, 247, 0.35)");
  rad.addColorStop(1, "transparent");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 720, 1280);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    // Draw Rounded Cover
    ctx.save();
    roundRect(ctx, 135, 180, 450, 450, 36);
    ctx.clip();
    ctx.drawImage(img, 135, 180, 450, 450);
    ctx.restore();

    // Border around cover
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 3;
    roundRect(ctx, 135, 180, 450, 450, 36);
    ctx.stroke();

    // Song Title & Mood
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(song.title, 360, 705);

    ctx.fillStyle = "#c084fc";
    ctx.font = "500 24px Outfit, sans-serif";
    ctx.fillText(`${(song.mood || "LOFI").toUpperCase()} • ${siteConfig.title || "R LOFI 01"}`, 360, 750);

    // Hinglish Lines
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "italic 28px Outfit, sans-serif";
    const lines = getAutoHinglishShayari(song).split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line.slice(0, 44), 360, 845 + i * 44);
    });

    // Footer Watermark
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 22px Outfit, sans-serif";
    ctx.fillText("🎧 Listen Now on R LOFI 01 Official", 360, 1170);

    document.getElementById("storyModal").style.display = "flex";
  };
  img.src = song.cover;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 7. Dedicate This Song Feature
let dedicateSongId = null;

function openDedicate(id) {
  const song = songs.find(s => s.id === id);
  if (!song) return;
  dedicateSongId = id;
  document.getElementById("dedicateSongName").textContent = `Song: "${song.title}"`;
  document.getElementById("dedicateModal").style.display = "flex";
}

function checkDedicationURL() {
  const params = new URLSearchParams(window.location.search);
  const songId = params.get("song");
  const toName = params.get("to");
  const note = params.get("note");

  if (toName || note) {
    const banner = document.getElementById("dedicationBanner");
    banner.style.display = "block";
    document.getElementById("dedicateHeader").textContent = toName
      ? `💌 Specially Dedicated For ${toName}`
      : `💌 A Special Song Dedicated For You`;
    document.getElementById("dedicateMessage").textContent = note ? `"${note}"` : "";
  }
  if (songId) {
    setTimeout(() => playSongById(songId), 400);
  }
}

// 8. Song Request Submission (Stored in localStorage + ready for GitHub sync)
function submitSongRequest() {
  const name = document.getElementById("reqName").value.trim() || "Anonymous Listener";
  const text = document.getElementById("reqText").value.trim();
  const statusEl = document.getElementById("reqStatus");

  if (!text) {
    statusEl.style.display = "block";
    statusEl.style.color = "#fca5a5";
    statusEl.textContent = "Please write a song or mood idea first!";
    return;
  }

  const saved = JSON.parse(localStorage.getItem("rlofi_requests") || "[]");
  saved.unshift({
    id: "req_" + Date.now(),
    name,
    text,
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem("rlofi_requests", JSON.stringify(saved));

  document.getElementById("reqName").value = "";
  document.getElementById("reqText").value = "";
  statusEl.style.display = "block";
  statusEl.style.color = "#6ee7b7";
  statusEl.textContent = "✅ Request sent! Thank you for sharing your vibe.";
}

// 9. Bind All Events
function bindEvents() {
  document.getElementById("searchInput").addEventListener("input", renderSongs);

  document.querySelectorAll("#moodBar .pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#moodBar .pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMood = btn.dataset.mood;
      renderSongs();
    });
  });

  document.getElementById("miniPlayBtn").addEventListener("click", togglePlay);
  document.getElementById("fullPlayBtn").addEventListener("click", togglePlay);

  document.getElementById("openFullBtn").addEventListener("click", () => {
    document.getElementById("fullPlayerModal").style.display = "flex";
  });
  document.getElementById("miniThumb").addEventListener("click", () => {
    document.getElementById("fullPlayerModal").style.display = "flex";
  });
  document.getElementById("closeFullBtn").addEventListener("click", () => {
    document.getElementById("fullPlayerModal").style.display = "none";
  });

  // Double-tap Cover to Open YouTube
  let lastTap = 0;
  document.getElementById("fullCover").addEventListener("click", () => {
    const now = Date.now();
    if (now - lastTap < 350 && currentIdx >= 0) {
      window.open(songs[currentIdx].ytUrl || siteConfig.ytUrl, "_blank");
    }
    lastTap = now;
  });

  document.getElementById("prevBtn").addEventListener("click", () => {
    if (songs.length === 0) return;
    const next = (currentIdx - 1 + songs.length) % songs.length;
    playSongById(songs[next].id);
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (songs.length === 0) return;
    const next = (currentIdx + 1) % songs.length;
    playSongById(songs[next].id);
  });

  audio.addEventListener("ended", () => {
    if (songs.length > 0) {
      const next = (currentIdx + 1) % songs.length;
      playSongById(songs[next].id);
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById("seekBar").value = pct;
    document.getElementById("curTime").textContent = formatTime(audio.currentTime);
    document.getElementById("durTime").textContent = formatTime(audio.duration);
  });

  document.getElementById("seekBar").addEventListener("input", e => {
    if (audio.duration) {
      audio.currentTime = (e.target.value / 100) * audio.duration;
    }
  });

  // Like, Lyrics, Story, Dedicate
  document.getElementById("likeBtn").addEventListener("click", () => {
    if (currentIdx < 0) return;
    const id = songs[currentIdx].id;
    if (likedSongs.includes(id)) {
      likedSongs = likedSongs.filter(x => x !== id);
    } else {
      likedSongs.push(id);
    }
    localStorage.setItem("rlofi_likes", JSON.stringify(likedSongs));
    updatePlayerUI();
  });

  document.getElementById("lyricsToggleBtn").addEventListener("click", () => {
    const box = document.getElementById("lyricsBox");
    box.style.display = box.style.display === "block" ? "none" : "block";
  });

  document.getElementById("storyCardBtn").addEventListener("click", generateStoryCard);
  document.getElementById("closeStoryBtn").addEventListener("click", () => {
    document.getElementById("storyModal").style.display = "none";
  });
  document.getElementById("downloadStoryBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "R-LOFI-01-Story.png";
    link.href = document.getElementById("storyCanvas").toDataURL("image/png");
    link.click();
  });

  document.getElementById("fullDedicateBtn").addEventListener("click", () => {
    if (currentIdx >= 0) openDedicate(songs[currentIdx].id);
  });
  document.getElementById("closeDedicateBtn").addEventListener("click", () => {
    document.getElementById("dedicateModal").style.display = "none";
  });
  document.getElementById("copyDedicateBtn").addEventListener("click", () => {
    const to = encodeURIComponent(document.getElementById("dedicateToName").value.trim());
    const note = encodeURIComponent(document.getElementById("dedicateNote").value.trim());
    const base = window.location.origin + window.location.pathname;
    const shareUrl = `${base}?song=${dedicateSongId}&to=${to}&note=${note}`;
    navigator.clipboard.writeText(shareUrl);
    alert("💌 Special Dedication Link Copied! Now share it on WhatsApp or Instagram.");
    document.getElementById("dedicateModal").style.display = "none";
  });

  // Ambient Sound Studio Sliders & Smart Mute Pills
  document.getElementById("rainSlider").addEventListener("input", updateAmbientLevels);
  document.getElementById("vinylSlider").addEventListener("input", updateAmbientLevels);
  document.getElementById("miniAmbientMute").addEventListener("click", muteAllAmbient);
  document.getElementById("fullAmbientMute").addEventListener("click", muteAllAmbient);

  // Song Request Button
  document.getElementById("sendReqBtn").addEventListener("click", submitSongRequest);
}

initApp();
    
