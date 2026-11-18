let songs = [];
let originalSongs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isRandom = false;
let favoriteSongs = JSON.parse(localStorage.getItem('fav_songs') || '[]');
let deferredPrompt = null;
let lastTapTime = 0;
let lastTapSongIdx = -1;

const audio = new Audio();
let customDedicateIcon = "";
let customDownloadIcon = "";

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const favBtn = document.getElementById('favBtn');
const songTitle = document.getElementById('songTitle');
const songMood = document.getElementById('songMood');
const songCover = document.getElementById('songCover');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalDurationEl = document.getElementById('totalDuration');
const tracksList = document.getElementById('tracksList');
const searchInput = document.getElementById('searchInput');

// Toast Notification Helper
function showToast(msg) {
  const toast = document.getElementById('toastNotif');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// Safely encode local file paths with | or emojis or spaces
function safeMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.split('/').map(part => encodeURIComponent(part)).join('/');
}

// PWA App Install Button Logic
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

document.getElementById('installAppBtn').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  } else {
    showToast("ব্রাউজার মেনু (⋮) থেকে 'Add to Home screen' চাপুন 📲");
  }
});

async function initSite() {
  try {
    const cfgRes = await fetch('config.json?t=' + Date.now()).catch(() => null);
    if (cfgRes && cfgRes.ok) {
      const cfg = await cfgRes.json();
      if (cfg.title) {
        document.getElementById('siteTitle').textContent = cfg.title;
        document.getElementById('topBrandName').textContent = cfg.title;
      }
      if (cfg.bio) document.getElementById('siteBio').textContent = cfg.bio;
      if (cfg.avatar) {
        document.getElementById('avatarImg').src = safeMediaUrl(cfg.avatar);
        document.getElementById('topLogoImg').src = safeMediaUrl(cfg.avatar);
      }
      if (cfg.youtubeUrl) {
        document.getElementById('topYtBtn').href = cfg.youtubeUrl;
        document.getElementById('heroYtBtn').href = cfg.youtubeUrl;
      }
      if (cfg.accent) {
        document.documentElement.style.setProperty('--accent', cfg.accent);
        document.documentElement.style.setProperty('--accent-glow', cfg.accent + '66');
      }
      if (cfg.iconSize) {
        document.documentElement.style.setProperty('--icon-size', cfg.iconSize + 'px');
      }
      if (cfg.icons) {
        if (cfg.icons.dedicate) customDedicateIcon = safeMediaUrl(cfg.icons.dedicate);
        if (cfg.icons.download) customDownloadIcon = safeMediaUrl(cfg.icons.download);
      }
      document.getElementById('ambientSection').style.display = cfg.showAmbientStudio !== false ? 'block' : 'none';
      document.getElementById('requestBoxSection').style.display = cfg.showRequestBox !== false ? 'block' : 'none';
    }
  } catch (e) {}

  try {
    const songsRes = await fetch('songs.json?t=' + Date.now());
    if (songsRes.ok) {
      const rawSongs = await songsRes.json();
      songs = rawSongs.map((s, idx) => {
        const rawFile = s.file || s.audio || s.mp3 || "";
        const rawCover = s.cover || s.image || "";
        return {
          ...s,
          id: s.id || ('song_' + idx),
          title: s.name || s.title || "Untitled Track",
          audio: safeMediaUrl(rawFile),
          rawFileName: rawFile,
          cover: safeMediaUrl(rawCover) || 'profile_1794970581989.png',
          desc: s.desc || s.description || "R LOFI 01 Original",
          mood: s.mood || "Lofi",
          ytUrl: s.youtube || s.ytUrl || ""
        };
      });
      originalSongs = [...songs];
      renderTracks(songs);
      if (songs.length > 0) loadSong(0);
    }
  } catch (e) {}
}

// Render Big Thumbnail Cards
function renderTracks(tracks) {
  if (!tracksList) return;
  if (tracks.length === 0) {
    tracksList.innerHTML = `
      <div style="text-align:center; padding:30px 16px; background:rgba(255,255,255,0.03); border-radius:18px; border:1px solid rgba(255,255,255,0.08);">
        <p style="color:#cbd5e1; margin-bottom:12px;">এখানে কোনো গান পাওয়া যায়নি (প্রথমে কোনো গানে ❤️ Fav দিন)</p>
        <button onclick="switchBottomTab('home')" class="btn-listen" style="padding:8px 18px; font-size:12.5px;">সব গান দেখুন 🎵</button>
      </div>`;
    return;
  }

  tracksList.innerHTML = tracks.map((song, i) => {
    const isFav = favoriteSongs.includes(song.id);
    const dlIcon = customDownloadIcon
      ? `<img src="${customDownloadIcon}" style="width:var(--icon-size, 18px); height:var(--icon-size, 18px); object-fit:contain;">`
      : `⬇️`;
    const dedIcon = customDedicateIcon
      ? `<img src="${customDedicateIcon}" style="width:var(--icon-size, 18px); height:var(--icon-size, 18px); object-fit:contain;">`
      : `💌`;

    return `
      <div id="songCard_${i}" class="big-song-card ${currentSongIndex === i && isPlaying ? 'active' : ''}">
        <div class="big-thumb-wrap" onclick="handleThumbTap(${i}, '${song.ytUrl}')">
          <img src="${song.cover}" alt="${song.title}">
          <span class="mood-tag">${song.mood}</span>
          <span class="dtap-badge">Double tap for YouTube</span>
          <button class="play-overlay-btn">▶️</button>
        </div>
        <div class="big-card-body">
          <div class="big-card-title">${song.title}</div>
          <div class="big-card-desc">${song.desc}</div>
          <div class="big-card-footer">
            <div class="card-act-group">
              <button class="icon-pill ${isFav ? 'fav-active' : ''}" onclick="toggleFavorite('${song.id}', this)">❤️ Fav</button>
              <button class="icon-pill" onclick="openDedicateModal('${song.id}')">${dedIcon} Dedicate</button>
            </div>
            <div class="card-act-group">
              ${song.ytUrl ? `<a href="${song.ytUrl}" target="_blank" class="icon-pill">▶️ Video</a>` : ''}
              <a href="${song.audio}" download="${song.rawFileName || (song.title + '.mp3')}" class="icon-pill">${dlIcon}</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mobile-friendly Single Tap (Play) & Double Tap (Open YouTube with Notification)
window.handleThumbTap = function(index, ytUrl) {
  const now = Date.now();
  if (lastTapSongIdx === index && (now - lastTapTime) < 350) {
    // Double tap detected!
    lastTapTime = 0;
    if (ytUrl) {
      showToast("▶️ Opening YouTube Video...");
      setTimeout(() => window.open(ytUrl, '_blank'), 350);
    } else {
      showToast("এই গানের ইউটিউব লিংক যুক্ত করা নেই");
    }
  } else {
    // Single tap -> Play song
    lastTapTime = now;
    lastTapSongIdx = index;
    playSongFromList(index);
  }
};

// Click Mini Player -> Scroll to active song card
window.focusCurrentSongCard = function() {
  const card = document.getElementById('songCard_' + currentSongIndex);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast("🎵 " + (songs[currentSongIndex]?.title || "Playing"));
  }
};

function loadSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentSongIndex = index;
  const song = songs[index];

  songTitle.textContent = song.title;
  songMood.textContent = song.mood;
  songCover.src = song.cover;
  audio.src = song.audio;
  audio.load();

  favBtn.classList.toggle('active', favoriteSongs.includes(song.id));
  document.querySelectorAll('.big-song-card').forEach((card, idx) => {
    card.classList.toggle('active', idx === index);
  });
}

function togglePlay() {
  if (songs.length === 0) return;
  if (isPlaying) {
    audio.pause();
    playBtn.innerHTML = '▶️';
    isPlaying = false;
  } else {
    audio.play().then(() => {
      playBtn.innerHTML = '⏸️';
      isPlaying = true;
    }).catch(err => {
      console.error(err);
      showToast("⚠️ গানটি লোড হতে সমস্যা হচ্ছে, আবার চাপুন");
    });
  }
}

function playSongFromList(index) {
  loadSong(index);
  isPlaying = false;
  togglePlay();
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progressBar.value = (audio.currentTime / audio.duration) * 100;
  const curMin = Math.floor(audio.currentTime / 60);
  const curSec = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
  currentTimeEl.textContent = `${curMin}:${curSec}`;

  const durMin = Math.floor(audio.duration / 60);
  const durSec = Math.floor(audio.duration % 60).toString().padStart(2, '0');
  totalDurationEl.textContent = `${durMin}:${durSec}`;
});

progressBar.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration;
});

prevBtn.addEventListener('click', () => playSongFromList((currentSongIndex - 1 + songs.length) % songs.length));
nextBtn.addEventListener('click', () => {
  if (isRandom) playSongFromList(Math.floor(Math.random() * songs.length));
  else playSongFromList((currentSongIndex + 1) % songs.length);
});
audio.addEventListener('ended', () => nextBtn.click());

randomBtn.addEventListener('click', () => {
  isRandom = !isRandom;
  randomBtn.classList.toggle('active', isRandom);
  showToast(isRandom ? "🔀 Shuffle On" : "🔀 Shuffle Off");
});

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    songs = val === ''
      ? [...originalSongs]
      : originalSongs.filter(s =>
          s.title.toLowerCase().includes(val) ||
          s.mood.toLowerCase().includes(val) ||
          s.desc.toLowerCase().includes(val)
        );
    renderTracks(songs);
  });
}

window.filterMood = function(mood, el) {
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  if (mood === 'all') songs = [...originalSongs];
  else if (mood === 'favorites') songs = originalSongs.filter(s => favoriteSongs.includes(s.id));
  else songs = originalSongs.filter(s => s.mood.toLowerCase() === mood.toLowerCase());
  renderTracks(songs);
};

window.switchBottomTab = function(tab) {
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const searchBox = document.getElementById('searchWrapper');

  if (tab === 'home') {
    document.getElementById('navHome').classList.add('active');
    searchBox.style.display = 'none';
    filterMood('all', document.querySelector('[data-mood="all"]'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (tab === 'search') {
    document.getElementById('navSearch').classList.add('active');
    searchBox.style.display = 'flex';
    searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchInput.focus();
  } else if (tab === 'library') {
    document.getElementById('navLibrary').classList.add('active');
    searchBox.style.display = 'none';
    songs = originalSongs.filter(s => favoriteSongs.includes(s.id));
    renderTracks(songs);
    document.getElementById('tracksList').scrollIntoView({ behavior: 'smooth' });
  }
};

window.toggleFavorite = function(songId, el) {
  if (favoriteSongs.includes(songId)) {
    favoriteSongs = favoriteSongs.filter(id => id !== songId);
    if (el) el.classList.remove('fav-active');
    showToast("💔 Removed from Favorites");
  } else {
    favoriteSongs.push(songId);
    if (el) el.classList.add('fav-active');
    showToast("❤️ Added to Library / Favorites");
  }
  localStorage.setItem('fav_songs', JSON.stringify(favoriteSongs));
};

favBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  const currentSongId = songs[currentSongIndex].id;
  toggleFavorite(currentSongId);
  favBtn.classList.toggle('active', favoriteSongs.includes(currentSongId));
  renderTracks(songs);
});

window.openDedicateModal = function(songId) {
  const fromWho = prompt("আপনার নাম (From):");
  if (!fromWho) return;
  const toWho = prompt("কাকে উৎসর্গ করতে চান (To):");
  if (!toWho) return;
  const message = prompt("কোনো বিশেষ বার্তা (Message):");

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({
    songId, from: fromWho, to: toWho, msg: message || ""
  }))));
  const shareLink = `${location.origin}${location.pathname}?dedicate=${encoded}`;

  navigator.clipboard.writeText(shareLink).catch(() => {});
  alert(`💖 ডেডিকেশন লিংক কপি হয়েছে! প্রিয়জনকে পাঠান:\n\n${shareLink}`);
};

function checkDedication() {
  const dedB64 = new URLSearchParams(window.location.search).get('dedicate');
  if (!dedB64) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(dedB64))));
    const songIdx = originalSongs.findIndex(s => s.id === data.songId);
    if (songIdx !== -1) {
      loadSong(songIdx);
      const overlay = document.createElement('div');
      overlay.className = 'dedication-overlay';
      overlay.innerHTML = `
        <div class="dedication-modal-content">
          <h2>💖 বিশেষ উৎসর্গ 💖</h2>
          <p style="margin:12px 0;"><strong>${data.from}</strong> এই গানটি <strong>${data.to}</strong> কে ডেডিকেট করেছেন।</p>
          ${data.msg ? `<blockquote style="font-style:italic; color:#c4b5fd;">"${data.msg}"</blockquote>` : ''}
          <button onclick="this.parentElement.parentElement.remove(); togglePlay();" class="play-ded-btn">গানটি শুনুন 🎵</button>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  } catch (e) {}
}

const reqForm = document.getElementById('requestForm');
if (reqForm) {
  reqForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reqName').value.trim();
    const text = document.getElementById('reqVibe').value.trim();
    if (!name || !text) return;

    const existing = JSON.parse(localStorage.getItem('rlofi_requests') || '[]');
    existing.unshift({
      id: "req_" + Date.now(),
      name,
      text,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
    localStorage.setItem('rlofi_requests', JSON.stringify(existing));
    showToast("📩 গানের অনুরোধ সফলভাবে জমা হয়েছে!");
    reqForm.reset();
  });
}

// Built-in Web Audio API Ambient Generator (কোনো এক্সটার্নাল লিংক ছাড়াই রিয়েল বৃষ্টি ও ভিনাইল শব্দ)
function initAmbient() {
  let audioCtx = null;
  let rainGain = null;
  let vinylGain = null;

  function ensureAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // 1. Soft Rain Generator (Pink/Brown filtered noise)
      const bufferSize = audioCtx.sampleRate * 3;
      const rainBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const rainData = rainBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        rainData[i] = (lastOut + (0.04 * white)) / 1.04;
        lastOut = rainData[i];
        rainData[i] *= 2.5;
      }
      const rainSource = audioCtx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const rainFilter = audioCtx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 950;

      rainGain = audioCtx.createGain();
      rainGain.gain.value = 0;

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(audioCtx.destination);
      rainSource.start();

      // 2. Vinyl Crackle Generator
      const vinylBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const vinylData = vinylBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        vinylData[i] = Math.random() > 0.996 ? (Math.random() * 2 - 1) * 0.7 : (Math.random() * 2 - 1) * 0.015;
      }
      const vinylSource = audioCtx.createBufferSource();
      vinylSource.buffer = vinylBuffer;
      vinylSource.loop = true;

      const vinylFilter = audioCtx.createBiquadFilter();
      vinylFilter.type = 'bandpass';
      vinylFilter.frequency.value = 1800;

      vinylGain = audioCtx.createGain();
      vinylGain.gain.value = 0;

      vinylSource.connect(vinylFilter);
      vinylFilter.connect(vinylGain);
      vinylGain.connect(audioCtx.destination);
      vinylSource.start();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  const rainSlider = document.getElementById('ambientRain');
  const vinylSlider = document.getElementById('ambientVinyl');

  if (rainSlider) {
    rainSlider.addEventListener('input', (e) => {
      ensureAudioCtx();
      rainGain.gain.value = (e.target.value / 100) * 0.45;
    });
  }

  if (vinylSlider) {
    vinylSlider.addEventListener('input', (e) => {
      ensureAudioCtx();
      vinylGain.gain.value = (e.target.value / 100) * 0.55;
    });
  }
}

initSite().then(() => {
  checkDedication();
  initAmbient();
});
      
