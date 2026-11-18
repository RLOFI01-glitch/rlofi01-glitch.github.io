let allSongs = [];
let filteredSongs = [];
let currentIndex = 0;
let isLooping = false;
let currentMood = "all";
let sleepTimerId = null;
let sleepMinutes = 0;
let saveTargetSongId = null;

// Stored User Data (Zero pre-made folders)
let favorites = JSON.parse(localStorage.getItem("rlofi_favs") || "[]");
let userPlaylists = JSON.parse(localStorage.getItem("rlofi_playlists") || "[]");

const audio = new Audio();
audio.preload = "metadata";

const ambientAudios = {
  rain: new Audio(),
  vinyl: new Audio(),
  night: new Audio()
};
Object.values(ambientAudios).forEach(a => { a.loop = true; a.volume = 0; });

const SVG = {
  playMini: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pauseMini: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  playBig: `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pauseBig: `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  playPill: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pausePill: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  heartOutline: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  heartFill: `<svg width="15" height="15" viewBox="0 0 24 24" fill="#f43f5e"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  bookmarkOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  bookmarkOn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#a855f7" stroke="#a855f7" stroke-width="2.2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
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
const RAW_BASE = "https://raw.githubusercontent.com/RLOFI01-glitch/rlofi01-glitch.github.io/main/";

async function fetchFreshJson(fileName) {
  const urls = [
    `${RAW_BASE}${fileName}?t=${Date.now()}`,
    `${fileName}?t=${Date.now()}`
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      let txt = await res.text();
      // Remove any accidental BOM or invalid control characters
      txt = txt.replace(/^\uFEFF/, "").trim();
      return JSON.parse(txt);
    } catch (e) {}
  }
  throw new Error("Failed to parse " + fileName);
}

async function loadSiteConfig() {
  try {
    const cfg = await fetchFreshJson("config.json");

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
      const avatarUrl = cfg.avatar.startsWith("http") ? cfg.avatar : RAW_BASE + cfg.avatar;
      document.getElementById("avatarImg").src = avatarUrl;
      document.getElementById("topLogoImg").src = avatarUrl;
    }
    if (cfg.banner) {
      const bannerUrl = cfg.banner.startsWith("http") ? cfg.banner : RAW_BASE + cfg.banner;
      document.getElementById("heroBanner").style.backgroundImage =
        `linear-gradient(rgba(7,7,13,0.48), rgba(7,7,13,0.92)), url('${bannerUrl}')`;
    }

    if (cfg.icons) {
      if (cfg.icons.home) document.getElementById("pillHome").innerHTML = `<img src="${cfg.icons.home}" class="bnav-icon-img" alt="Home">`;
      if (cfg.icons.search) document.getElementById("pillSearch").innerHTML = `<img src="${cfg.icons.search}" class="bnav-icon-img" alt="Search">`;
      if (cfg.icons.library) document.getElementById("pillLibrary").innerHTML = `<img src="${cfg.icons.library}" class="bnav-icon-img" alt="Library">`;
      window.customDownloadIcon = cfg.icons.download || "";
    }

    if (cfg.ambient) {
      if (cfg.ambient.rain) ambientAudios.rain.src = cfg.ambient.rain.startsWith("http") ? cfg.ambient.rain : RAW_BASE + cfg.ambient.rain;
      if (cfg.ambient.vinyl) ambientAudios.vinyl.src = cfg.ambient.vinyl.startsWith("http") ? cfg.ambient.vinyl : RAW_BASE + cfg.ambient.vinyl;
      if (cfg.ambient.night) ambientAudios.night.src = cfg.ambient.night.startsWith("http") ? cfg.ambient.night : RAW_BASE + cfg.ambient.night;
    }

    const ambSec = document.getElementById("ambientSection");
    if (ambSec) ambSec.style.display = cfg.showAmbientStudio === false ? "none" : "block";

    const reqSec = document.getElementById("requestBoxSection");
    if (reqSec) reqSec.style.display = cfg.showRequestBox === false ? "none" : "block";
  } catch (e) {}
}

async function loadSongs() {
  try {
    const rawList = await fetchFreshJson("songs.json");
    allSongs = rawList.map(song => ({
      ...song,
      file: song.file && !song.file.startsWith("http") ? RAW_BASE + song.file : song.file,
      cover: song.cover && !song.cover.startsWith("http") ? RAW_BASE + song.cover : song.cover
    }));
    filteredSongs = [...allSongs];
    renderSongs(filteredSongs);
    if (allSongs.length > 0) loadTrackIntoUI(0, false);
  } catch (err) {
    document.getElementById("tracksList").innerHTML =
      `<p style="text-align:center;color:#94a3b8;padding:24px;">Upload your first song from Admin Panel</p>`;
  }
}


function isSongInAnyPlaylist(songId) {
  return userPlaylists.some(pl => pl.songIds.includes(songId));
}

// Render Exact Reference Premium Card (Zero Emojis, Single Tap Safe)
function renderSongs(list) {
  const container = document.getElementById("tracksList");
  if (!list || list.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:20px;">No songs found.</p>`;
    return;
  }

  const dlIconHtml = window.customDownloadIcon
    ? `<img src="${window.customDownloadIcon}" style="width:14px;height:14px;object-fit:contain;">`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`;

  container.innerHTML = list.map((song, idx) => {
    const isFav = favorites.includes(song.id);
    const isSavedInFolder = isSongInAnyPlaylist(song.id);
    const isCurrent = allSongs[currentIndex] && allSongs[currentIndex].id === song.id;
    const isPlayingThis = isCurrent && !audio.paused;

    return `
      <article class="galaxy-song-card ${isCurrent ? "active" : ""}" id="card_${song.id}">
        <div class="thumb-box" onclick="handleThumbDoubleTapOnly('${song.youtube || ""}')">
          <img src="${song.cover}" alt="${song.name}" loading="lazy">
          <button class="thumb-fav-circle ${isFav ? "fav-on" : ""}" onclick="event.stopPropagation(); toggleFav('${song.id}')" title="Favorite">
            ${isFav ? SVG.heartFill : SVG.heartOutline}
          </button>
          ${song.youtube ? `
            <span class="yt-2x-pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              2x Tap YT
            </span>` : ""}
        </div>

        <div class="card-body">
          <h3 class="card-title">${song.name}</h3>
          <p class="card-desc">${song.desc || ""}</p>

          <div class="card-pills-wrap">
            <button class="pill-play-solid" onclick="playOrToggleFromCard(${idx})">
              ${isPlayingThis ? `${SVG.pausePill} Pause` : `${SVG.playPill} Play`}
            </button>

            <button class="pill-outline-glow ${isSavedInFolder ? "saved-state" : ""}" onclick="openSaveModal('${song.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              ${isSavedInFolder ? "Saved" : "Save"}
            </button>

            <a href="${song.file}" download class="pill-outline-glow">
              ${dlIconHtml}
              Download
            </a>

            <button class="pill-outline-glow" onclick="shareSongByIndex(${idx})">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Share
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Single tap does NOTHING so song never accidentally restarts; Double tap opens YouTube
let lastTapTime = 0;
function handleThumbDoubleTapOnly(ytUrl) {
  const now = Date.now();
  if (now - lastTapTime < 340 && ytUrl) {
    window.open(ytUrl, "_blank");
  }
  lastTapTime = now;
}

// Smart Play/Pause Button: Resumes if same song, never restarts unintentionally
function playOrToggleFromCard(filteredIdx) {
  const song = filteredSongs[filteredIdx];
  if (!song) return;
  const realIdx = allSongs.findIndex(s => s.id === song.id);
  if (realIdx < 0) return;

  if (currentIndex === realIdx && audio.src) {
    togglePlay();
  } else {
    loadTrackIntoUI(realIdx, true);
  }
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
    song.lyrics && song.lyrics.trim() ? song.lyrics : "Lyrics not added yet.";

  updateFavButtons(song.id);

  audio.src = song.file;
  audio.load();

  if (autoPlay) {
    audio.play().then(() => {
      updatePlayIcons(true);
    }).catch(() => {
      updatePlayIcons(false);
    });
  } else {
    renderSongs(filteredSongs);
  }
    }
function updatePlayIcons(isPlaying) {
  document.getElementById("playBtn").innerHTML = isPlaying ? SVG.pauseMini : SVG.playMini;
  document.getElementById("fpPlayBigBtn").innerHTML = isPlaying ? SVG.pauseBig : SVG.playBig;
  const wave = document.getElementById("fpWaveform");
  if (wave) isPlaying ? wave.classList.add("playing") : wave.classList.remove("playing");
  renderSongs(filteredSongs);
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
  showToast("Player stopped");
}

function toggleLoop() {
  isLooping = !isLooping;
  audio.loop = isLooping;
  const btn = document.getElementById("loopBtn");
  isLooping ? btn.classList.add("active-ctrl") : btn.classList.remove("active-ctrl");
  showToast(isLooping ? "Repeat: ON" : "Repeat: OFF");
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
  showToast("Shuffle Play");
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
  if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration;
});

document.getElementById("volumeBar").addEventListener("input", (e) => {
  audio.volume = e.target.value / 100;
});

// Favorites
function updateFavButtons(songId) {
  const isFav = favorites.includes(songId);
  document.getElementById("fpFavBtn").innerHTML = isFav ? SVG.heartFill : SVG.heartOutline;
  const isSaved = isSongInAnyPlaylist(songId);
  const saveBtn = document.getElementById("fpSaveBtn");
  saveBtn.textContent = isSaved ? "Saved" : "+ Save";
  isSaved ? saveBtn.classList.add("active-pill") : saveBtn.classList.remove("active-pill");
}

function toggleFav(songId) {
  if (favorites.includes(songId)) {
    favorites = favorites.filter(id => id !== songId);
    showToast("Removed from Favorites");
  } else {
    favorites.push(songId);
    showToast("Added to Favorites");
  }
  localStorage.setItem("rlofi_favs", JSON.stringify(favorites));
  if (allSongs[currentIndex]) updateFavButtons(allSongs[currentIndex].id);
  applyFilters();
}

function toggleCurrentFav() {
  if (allSongs[currentIndex]) toggleFav(allSongs[currentIndex].id);
}

// Custom "Save to..." Playlist Folder System (Starts completely empty)
function savePlaylistsStorage() {
  localStorage.setItem("rlofi_playlists", JSON.stringify(userPlaylists));
}

function openSaveModal(songId) {
  saveTargetSongId = songId || (allSongs[currentIndex] ? allSongs[currentIndex].id : null);
  document.getElementById("newPlaylistForm").style.display = userPlaylists.length === 0 ? "flex" : "none";
  renderSaveSheetList();
  document.getElementById("saveSheetBackdrop").classList.add("open");
}

function closeSaveModal() {
  document.getElementById("saveSheetBackdrop").classList.remove("open");
  document.getElementById("newPlaylistInput").value = "";
}

function toggleNewPlaylistInput() {
  const box = document.getElementById("newPlaylistForm");
  box.style.display = box.style.display === "flex" ? "none" : "flex";
  if (box.style.display === "flex") document.getElementById("newPlaylistInput").focus();
}

function createNewPlaylistFolder() {
  const input = document.getElementById("newPlaylistInput");
  const name = input.value.trim();
  if (!name) return showToast("Enter a playlist name");

  const newFolder = {
    id: "pl_" + Date.now(),
    name,
    songIds: saveTargetSongId ? [saveTargetSongId] : []
  };
  userPlaylists.unshift(newFolder);
  savePlaylistsStorage();
  input.value = "";
  document.getElementById("newPlaylistForm").style.display = "none";

  renderSaveSheetList();
  renderLibraryFolders();
  if (allSongs[currentIndex]) updateFavButtons(allSongs[currentIndex].id);
  renderSongs(filteredSongs);
  showToast(`Saved to "${name}"`);
}

function toggleSongInPlaylist(plId) {
  if (!saveTargetSongId) return;
  const pl = userPlaylists.find(p => p.id === plId);
  if (!pl) return;

  if (pl.songIds.includes(saveTargetSongId)) {
    pl.songIds = pl.songIds.filter(id => id !== saveTargetSongId);
    showToast(`Removed from "${pl.name}"`);
  } else {
    pl.songIds.push(saveTargetSongId);
    showToast(`Saved to "${pl.name}"`);
  }
  savePlaylistsStorage();
  renderSaveSheetList();
  renderLibraryFolders();
  if (allSongs[currentIndex]) updateFavButtons(allSongs[currentIndex].id);
  renderSongs(filteredSongs);
}

function renderSaveSheetList() {
  const container = document.getElementById("playlistSheetList");
  if (userPlaylists.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#94a3b8;font-size:13px;padding:18px 8px;">No playlists created yet. Create your first playlist below.</p>`;
    return;
  }

  container.innerHTML = userPlaylists.map(pl => {
    const firstSong = allSongs.find(s => s.id === pl.songIds[0]);
    const thumb = firstSong ? firstSong.cover : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%232e1065'/></svg>";
    const isChecked = saveTargetSongId && pl.songIds.includes(saveTargetSongId);

    return `
      <div class="pl-item-row" onclick="toggleSongInPlaylist('${pl.id}')">
        <div class="pl-item-left">
          <img src="${thumb}" alt="Folder">
          <div>
            <h4>${pl.name}</h4>
            <span>${pl.songIds.length} songs</span>
          </div>
        </div>
        <div>${isChecked ? SVG.bookmarkOn : SVG.bookmarkOff}</div>
      </div>
    `;
  }).join("");
}

function renderLibraryFolders() {
  const grid = document.getElementById("folderGridContainer");
  if (!grid) return;
  if (userPlaylists.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;color:#94a3b8;font-size:12.5px;padding:10px 0;">No custom playlists yet. Tap + Save on any song to create folders.</p>`;
    return;
  }
  grid.innerHTML = userPlaylists.map(pl => {
    const firstSong = allSongs.find(s => s.id === pl.songIds[0]);
    const thumb = firstSong ? firstSong.cover : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%232e1065'/></svg>";
    return `
      <div class="folder-card" onclick="openFolderSongs('${pl.id}')">
        <div class="folder-thumb"><img src="${thumb}" alt="${pl.name}"></div>
        <div class="folder-meta">
          <h4>${pl.name}</h4>
          <span>${pl.songIds.length} songs</span>
        </div>
      </div>
    `;
  }).join("");
}

function openFolderSongs(plId) {
  const pl = userPlaylists.find(p => p.id === plId);
  if (!pl) return;
  document.getElementById("mainSectionTitle").textContent = pl.name;
  filteredSongs = allSongs.filter(s => pl.songIds.includes(s.id));
  renderSongs(filteredSongs);
  document.getElementById("tracksList").scrollIntoView({ behavior: "smooth" });
}

// Sleep Timer Cycle
function cycleSleepTimer() {
  clearTimeout(sleepTimerId);
  const steps = [0, 15, 30, 60];
  sleepMinutes = steps[(steps.indexOf(sleepMinutes) + 1) % steps.length];

  const btn = document.getElementById("fpSleepBtn");
  const moonSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  if (sleepMinutes === 0) {
    btn.innerHTML = `${moonSvg} Sleep`;
    btn.classList.remove("active-pill");
    showToast("Sleep Timer: OFF");
  } else {
    btn.innerHTML = `${moonSvg} ${sleepMinutes}m`;
    btn.classList.add("active-pill");
    showToast(`Sleep Timer: ${sleepMinutes} mins`);
    sleepTimerId = setTimeout(() => {
      audio.pause();
      updatePlayIcons(false);
      sleepMinutes = 0;
      btn.innerHTML = `${moonSvg} Sleep`;
      btn.classList.remove("active-pill");
    }, sleepMinutes * 60000);
  }
}

function shareSongByIndex(idx) {
  const song = filteredSongs[idx];
  const shareUrl = song && song.youtube ? song.youtube : window.location.href;
  if (navigator.share) {
    navigator.share({ title: song ? song.name : "R LOFI 01", url: shareUrl });
  } else {
    navigator.clipboard.writeText(shareUrl);
    showToast("Link copied!");
  }
}

function shareCurrentSong() {
  const song = allSongs[currentIndex];
  const shareUrl = song && song.youtube ? song.youtube : window.location.href;
  if (navigator.share) {
    navigator.share({ title: song ? song.name : "R LOFI 01", url: shareUrl });
  } else {
    navigator.clipboard.writeText(shareUrl);
    showToast("Link copied!");
  }
}

// Fullscreen Open, Close & Swipe Down
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
  let startY = 0, currentY = 0, dragging = false;

  function onStart(e) {
    if (modal.scrollTop > 5) return;
    startY = e.touches[0].clientY;
    dragging = true;
    modal.style.transition = "none";
  }
  function onMove(e) {
    if (!dragging) return;
    currentY = e.touches[0].clientY - startY;
    if (currentY > 0) modal.style.transform = `translateY(${currentY}px)`;
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
  document.getElementById("mainSectionTitle").textContent = mood === "favorites" ? "Favorites" : "Latest Releases";
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

// Bottom Navigation Tabs
function switchBottomTab(tab) {
  document.querySelectorAll(".bnav-btn").forEach(b => b.classList.remove("active"));
  const searchWrap = document.getElementById("searchWrapper");
  const libView = document.getElementById("libraryFoldersView");

  if (tab === "home") {
    document.getElementById("navHome").classList.add("active");
    searchWrap.style.display = "none";
    libView.style.display = "none";
    filterMood("all", document.querySelector('[data-mood="all"]'));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tab === "search") {
    document.getElementById("navSearch").classList.add("active");
    libView.style.display = "none";
    searchWrap.style.display = "flex";
    searchWrap.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("searchInput").focus();
  } else if (tab === "library") {
    document.getElementById("navLibrary").classList.add("active");
    searchWrap.style.display = "none";
    libView.style.display = "block";
    renderLibraryFolders();
    filterMood("favorites", document.querySelector('[data-mood="favorites"]'));
    libView.scrollIntoView({ behavior: "smooth" });
  }
}

// Ambient MP3 Loop Controller
function bindAmbientSlider(sliderId, typeKey, labelName) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  slider.addEventListener("input", (e) => {
    const val = Number(e.target.value) / 100;
    const track = ambientAudios[typeKey];
    if (!track.src) {
      if (val > 0) {
        showToast(`Upload ${labelName} MP3 in Admin Panel`);
        e.target.value = 0;
      }
      return;
    }
    track.volume = val;
    if (val > 0 && track.paused) track.play().catch(() => {});
    else if (val === 0 && !track.paused) track.pause();
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
  showToast("Request submitted!");
});

loadSiteConfig();
loadSongs();
