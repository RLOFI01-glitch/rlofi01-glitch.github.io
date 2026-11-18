let allSongs = [];
let filteredSongs = [];
let currentIndex = 0;
let isLooping = false;
let currentMood = "all";
let sleepTimerId = null;
let sleepMinutes = 0;
let favorites = JSON.parse(localStorage.getItem("rlofi_favs") || "[]");

const audio = new Audio();
audio.preload = "metadata";

// Custom Uploaded Ambient MP3 Loops
const ambientAudios = {
  rain: new Audio(),
  vinyl: new Audio(),
  night: new Audio()
};
Object.values(ambientAudios).forEach(a => { a.loop = true; a.volume = 0; });

const SVG_ICONS = {
  playMini: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pauseMini: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  playBig: `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pauseBig: `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
};

function showToast(msg) {
  const t = document.getElementById("toastNotif");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// 1. Load Site Config, Custom Icons & Ambient MP3 Files
async function loadSiteConfig() {
  try {
    const res = await fetch("config.json?t=" + Date.now());
    if (!res.ok) return;
    const cfg = await res.json();

    if (cfg.title) {
      document.getElementById("siteTitle").textContent = cfg.title;
      document.getElementById("topBrandName").textContent = cfg.title;
      document.title = cfg.title + " | Official Music";
    }
    if (cfg.tagline) document.getElementById("siteTagline").textContent = cfg.tagline;
    if (cfg.bio) document.getElementById("siteBio").textContent = cfg.bio;
    if (cfg.youtubeUrl) {
      document.getElementById("topYtBtn").href = cfg.youtubeUrl;
      document.getElementById("heroYtBtn").href = cfg.youtubeUrl;
    }
    if (cfg.accent) {
      document.documentElement.style.setProperty("--accent", cfg.accent);
      document.documentElement.style.setProperty("--accent-glow", cfg.accent + "88");
    }
    if (cfg.iconSize) {
      document.documentElement.style.setProperty("--icon-size", cfg.iconSize + "px");
    }
    if (cfg.avatar) {
      document.getElementById("avatarImg").src = cfg.avatar;
      document.getElementById("topLogoImg").src = cfg.avatar;
    }
    if (cfg.banner) {
      document.getElementById("heroBanner").style.backgroundImage =
        `linear-gradient(rgba(7,7,13,0.48), rgba(7,7,13,0.92)), url('${cfg.banner}')`;
    }

    // Custom Uploaded PNG Icons
    if (cfg.icons) {
      if (cfg.icons.home) {
        document.getElementById("pillHome").innerHTML = `<img src="${cfg.icons.home}" class="bnav-icon-img" alt="Home">`;
      }
      if (cfg.icons.search) {
        document.getElementById("pillSearch").innerHTML = `<img src="${cfg.icons.search}" class="bnav-icon-img" alt="Search">`;
      }
      if (cfg.icons.library) {
        document.getElementById("pillLibrary").innerHTML = `<img src="${cfg.icons.library}" class="bnav-icon-img" alt="Library">`;
      }
      window.customDownloadIcon = cfg.icons.download || "";
    }

    // Custom Uploaded Ambient MP3 Loops
    if (cfg.ambient) {
      if (cfg.ambient.rain) ambientAudios.rain.src = cfg.ambient.rain;
      if (cfg.ambient.vinyl) ambientAudios.vinyl.src = cfg.ambient.vinyl;
      if (cfg.ambient.night) ambientAudios.night.src = cfg.ambient.night;
    }

    const ambSec = document.getElementById("ambientSection");
    if (ambSec) ambSec.style.display = cfg.showAmbientStudio === false ? "none" : "block";

    const reqSec = document.getElementById("requestBoxSection");
    if (reqSec) reqSec.style.display = cfg.showRequestBox === false ? "none" : "block";
  } catch (e) {
    console.warn("Config load skipped:", e);
  }
}

// 2. Load Songs
async function loadSongs() {
  try {
    const res = await fetch("songs.json?t=" + Date.now());
    allSongs = await res.json();
    filteredSongs = [...allSongs];
    renderSongs(filteredSongs);

    if (allSongs.length > 0) {
      loadTrackIntoUI(0, false);
    }
  } catch (err) {
    document.getElementById("tracksList").innerHTML =
      `<p style="text-align:center;color:#94a3b8;padding:24px;">Admin Panel se pehla song upload karein 🎵</p>`;
  }
}

// 3. Render Galaxy Song Cards (No Dedicate Button, Subtle Double-Tap Hint)
function renderSongs(list) {
  const container = document.getElementById("tracksList");
  if (!list || list.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:20px;">Koi song nahi mila.</p>`;
    return;
  }

  const dlIconHtml = window.customDownloadIcon
    ? `<img src="${window.customDownloadIcon}" style="width:14px;height:14px;object-fit:contain;">`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

  container.innerHTML = list.map((song, idx) => {
    const isFav = favorites.includes(song.id);
    const isCurrent = allSongs[currentIndex] && allSongs[currentIndex].id === song.id;

    return `
      <article class="galaxy-song-card ${isCurrent ? "active" : ""}" id="card_${song.id}">
        <div class="thumb-box" onclick="handleThumbTap(event, ${idx}, '${song.youtube || ""}')">
          <img src="${song.cover}" alt="${song.name}" loading="lazy">
          <span class="mood-chip">${song.mood || "Lofi"}</span>
          <div class="thumb-play-circle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <div>
              <h3 class="card-title">${song.name}</h3>
              <span class="subtle-dtap-hint">Double tap thumbnail for YouTube</span>
            </div>
          </div>
          <p class="card-desc">${song.desc || ""}</p>
          <div class="card-actions">
            <button class="pill-act ${isFav ? "fav-on" : ""}" onclick="toggleFav('${song.id}')">
              ${isFav ? "❤️ Saved" : "🤍 Fav"}
            </button>
            <div style="display:flex; gap:8px;">
              ${song.youtube ? `<a href="${song.youtube}" target="_blank" class="pill-act">▶ Video</a>` : ""}
              <a href="${song.file}" download class="pill-act" title="Download MP3">${dlIconHtml}</a>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

let lastTapTime = 0;
function handleThumbTap(e, idx, ytUrl) {
  const now = Date.now();
  if (now - lastTapTime < 320 && ytUrl) {
    window.open(ytUrl, "_blank");
  } else {
    playSongFromList(idx);
  }
  lastTapTime = now;
}

function playSongFromList(filteredIdx) {
  const song = filteredSongs[filteredIdx];
  if (!song) return;
  const realIdx = allSongs.findIndex(s => s.id === song.id);
  loadTrackIntoUI(realIdx >= 0 ? realIdx : 0, true);
}

function loadTrackIntoUI(idx, autoPlay = true) {
  if (!allSongs[idx]) return;
  currentIndex = idx;
  const song = allSongs[idx];

  document.getElementById("songTitle").textContent = song.name;
  document.getElementById("songMood").textContent = "Tap to open Full Player • R LOFI 01";
  document.getElementById("songCover").src = song.cover;

  document.getElementById("fpSongTitle").textContent = song.name;
  document.getElementById("fpCoverImg").src = song.cover;
  document.getElementById("fpDownloadBtn").href = song.file;
  document.getElementById("fpLyricsBox").textContent =
    song.lyrics && song.lyrics.trim() ? song.lyrics : "🎵 এই গানের লিরিক্স এখনো যোগ করা হয়নি।";

  updateFavButtons(song.id);

  audio.src = song.file;
  audio.load();

  document.querySelectorAll(".galaxy-song-card").forEach(c => c.classList.remove("active"));
  const activeCard = document.getElementById("card_" + song.id);
  if (activeCard) activeCard.classList.add("active");

  if (autoPlay) {
    audio.play().then(() => {
      updatePlayIcons(true);
    }).catch(() => {
      updatePlayIcons(false);
    });
  }
}
function updatePlayIcons(isPlaying) {
  document.getElementById("playBtn").innerHTML = isPlaying ? SVG_ICONS.pauseMini : SVG_ICONS.playMini;
  document.getElementById("fpPlayBigBtn").innerHTML = isPlaying ? SVG_ICONS.pauseBig : SVG_ICONS.playBig;
  const wave = document.getElementById("fpWaveform");
  if (wave) {
    isPlaying ? wave.classList.add("playing") : wave.classList.remove("playing");
  }
}

function togglePlay() {
  if (!audio.src && allSongs.length > 0) {
    loadTrackIntoUI(0, true);
    return;
  }
  if (audio.paused) {
    audio.play().then(() => updatePlayIcons(true));
  } else {
    audio.pause();
    updatePlayIcons(false);
  }
}

function stopAndResetMini() {
  audio.pause();
  audio.currentTime = 0;
  updatePlayIcons(false);
  showToast("⏹️ Player stopped");
}

function toggleLoop() {
  isLooping = !isLooping;
  audio.loop = isLooping;
  const btn = document.getElementById("loopBtn");
  isLooping ? btn.classList.add("active-ctrl") : btn.classList.remove("active-ctrl");
  showToast(isLooping ? "🔁 Repeat: ON" : "➡️ Repeat: OFF");
}

document.getElementById("nextBtn").onclick = () => {
  if (allSongs.length === 0) return;
  loadTrackIntoUI((currentIndex + 1) % allSongs.length, true);
};

document.getElementById("prevBtn").onclick = () => {
  if (allSongs.length === 0) return;
  loadTrackIntoUI((currentIndex - 1 + allSongs.length) % allSongs.length, true);
};

document.getElementById("randomBtn").onclick = () => {
  if (allSongs.length === 0) return;
  const rnd = Math.floor(Math.random() * allSongs.length);
  loadTrackIntoUI(rnd, true);
  showToast("🔀 Shuffle Play");
};

audio.addEventListener("ended", () => {
  if (!isLooping && allSongs.length > 0) {
    loadTrackIntoUI((currentIndex + 1) % allSongs.length, true);
  }
});

// Progress & Volume
const progressBar = document.getElementById("progressBar");
audio.addEventListener("loadedmetadata", () => {
  document.getElementById("totalDuration").textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    document.getElementById("currentTime").textContent = formatTime(audio.currentTime);
    document.getElementById("totalDuration").textContent = formatTime(audio.duration);
  }
});
progressBar.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

document.getElementById("volumeBar").addEventListener("input", (e) => {
  audio.volume = e.target.value / 100;
});

// Favorites
function updateFavButtons(songId) {
  const isFav = favorites.includes(songId);
  document.getElementById("fpFavBtn").textContent = isFav ? "❤️" : "🤍";
  const saveBtn = document.getElementById("fpSaveBtn");
  saveBtn.textContent = isFav ? "✓ Saved" : "+ Save";
  isFav ? saveBtn.classList.add("active-pill") : saveBtn.classList.remove("active-pill");
}

function toggleFav(songId) {
  if (favorites.includes(songId)) {
    favorites = favorites.filter(id => id !== songId);
    showToast("💔 Removed from Favorites");
  } else {
    favorites.push(songId);
    showToast("❤️ Saved to Favorites");
  }
  localStorage.setItem("rlofi_favs", JSON.stringify(favorites));
  if (allSongs[currentIndex]) updateFavButtons(allSongs[currentIndex].id);
  applyFilters();
}

function toggleCurrentFav() {
  if (allSongs[currentIndex]) toggleFav(allSongs[currentIndex].id);
}

// Sleep Timer Cycle
function cycleSleepTimer() {
  clearTimeout(sleepTimerId);
  const steps = [0, 15, 30, 60];
  const nextIdx = (steps.indexOf(sleepMinutes) + 1) % steps.length;
  sleepMinutes = steps[nextIdx];

  const btn = document.getElementById("fpSleepBtn");
  if (sleepMinutes === 0) {
    btn.textContent = "🌙 Sleep";
    btn.classList.remove("active-pill");
    showToast("⏰ Sleep Timer: OFF");
  } else {
    btn.textContent = `🌙 ${sleepMinutes}m`;
    btn.classList.add("active-pill");
    showToast(`🌙 Sleep Timer: ${sleepMinutes} mins`);
    sleepTimerId = setTimeout(() => {
      audio.pause();
      updatePlayIcons(false);
      sleepMinutes = 0;
      btn.textContent = "🌙 Sleep";
      btn.classList.remove("active-pill");
    }, sleepMinutes * 60000);
  }
}

function shareCurrentSong() {
  const song = allSongs[currentIndex];
  const shareUrl = song && song.youtube ? song.youtube : window.location.href;
  if (navigator.share) {
    navigator.share({ title: song ? song.name : "R LOFI 01", url: shareUrl });
  } else {
    navigator.clipboard.writeText(shareUrl);
    showToast("🔗 Link copied!");
  }
}

// Fullscreen Open, Close & Touch Swipe Down Gesture
function openFullPlayer() {
  document.getElementById("fullPlayerModal").classList.add("open");
}
function closeFullPlayer() {
  document.getElementById("fullPlayerModal").classList.remove("open");
}

(function setupSwipeDown() {
  const modal = document.getElementById("fullPlayerModal");
  const dragZone = document.getElementById("fpDragZone");
  const card = document.getElementById("fpSwipeCard");
  let startY = 0;
  let currentY = 0;
  let dragging = false;

  function onStart(e) {
    if (modal.scrollTop > 5) return;
    startY = e.touches[0].clientY;
    dragging = true;
    modal.style.transition = "none";
  }

  function onMove(e) {
    if (!dragging) return;
    currentY = e.touches[0].clientY - startY;
    if (currentY > 0) {
      modal.style.transform = `translateY(${currentY}px)`;
    }
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    modal.style.transition = "transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)";
    if (currentY > 95) {
      closeFullPlayer();
      setTimeout(() => { modal.style.transform = ""; }, 350);
    } else {
      modal.style.transform = "";
    }
    currentY = 0;
  }

  [dragZone, card].forEach(el => {
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
  });
})();

function toggleLyricsPanel() {
  const panel = document.getElementById("fpLyricsBox");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

// Filters & Search
function filterMood(mood, btnEl) {
  currentMood = mood;
  document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  applyFilters();
}

function applyFilters() {
  const q = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  filteredSongs = allSongs.filter(song => {
    const matchMood =
      currentMood === "all" ||
      (currentMood === "favorites" && favorites.includes(song.id)) ||
      (song.mood && song.mood.toLowerCase() === currentMood.toLowerCase());
    const matchText =
      !q ||
      song.name.toLowerCase().includes(q) ||
      (song.desc && song.desc.toLowerCase().includes(q));
    return matchMood && matchText;
  });
  renderSongs(filteredSongs);
}
document.getElementById("searchInput").addEventListener("input", applyFilters);

// Bottom Navigation Tabs with Active Pill Highlight
function switchBottomTab(tab) {
  document.querySelectorAll(".bnav-btn").forEach(b => b.classList.remove("active"));
  const searchWrap = document.getElementById("searchWrapper");

  if (tab === "home") {
    document.getElementById("navHome").classList.add("active");
    searchWrap.style.display = "none";
    filterMood("all", document.querySelector('[data-mood="all"]'));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tab === "search") {
    document.getElementById("navSearch").classList.add("active");
    searchWrap.style.display = "flex";
    searchWrap.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("searchInput").focus();
  } else if (tab === "library") {
    document.getElementById("navLibrary").classList.add("active");
    searchWrap.style.display = "none";
    filterMood("favorites", document.querySelector('[data-mood="favorites"]'));
    document.getElementById("tracksList").scrollIntoView({ behavior: "smooth" });
  }
}

// Custom Uploaded Ambient MP3 Loop Controller
function bindAmbientSlider(sliderId, typeKey, labelName) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  slider.addEventListener("input", (e) => {
    const val = Number(e.target.value) / 100;
    const track = ambientAudios[typeKey];
    if (!track.src) {
      if (val > 0) {
        showToast(`⚠️ Admin Panel se ${labelName} MP3 upload karein`);
        e.target.value = 0;
      }
      return;
    }
    track.volume = val;
    if (val > 0 && track.paused) {
      track.play().catch(() => {});
    } else if (val === 0 && !track.paused) {
      track.pause();
    }
  });
}
bindAmbientSlider("ambientRain", "rain", "Rain & Thunder");
bindAmbientSlider("ambientVinyl", "vinyl", "Vinyl Crackle");
bindAmbientSlider("ambientNight", "night", "Night Ambience");

// Song Request Submit
document.getElementById("requestForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("reqName").value.trim();
  const text = document.getElementById("reqVibe").value.trim();
  if (!name || !text) return;

  const list = JSON.parse(localStorage.getItem("rlofi_requests") || "[]");
  list.unshift({ name, text, date: new Date().toLocaleDateString() });
  localStorage.setItem("rlofi_requests", JSON.stringify(list));
  e.target.reset();
  showToast("✅ Request bhej di gayi!");
});

loadSiteConfig();
loadSongs();
                   
