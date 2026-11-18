let songs = [];
let originalSongs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isRandom = false;
let favoriteSongs = JSON.parse(localStorage.getItem('fav_songs') || '[]');
let deferredPrompt = null;

const audio = new Audio();
let ambientRain = null;
let ambientVinyl = null;
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
    alert("ব্রাউজারের ওপরে ডানদিকের ৩টি ডট (⋮) মেনুতে চাপ দিয়ে 'Add to Home screen' বা 'Install app' সিলেক্ট করুন!");
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
        document.getElementById('avatarImg').src = cfg.avatar;
        document.getElementById('topLogoImg').src = cfg.avatar;
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
        if (cfg.icons.dedicate) customDedicateIcon = cfg.icons.dedicate;
        if (cfg.icons.download) customDownloadIcon = cfg.icons.download;
      }
      document.getElementById('ambientSection').style.display = cfg.showAmbientStudio !== false ? 'block' : 'none';
      document.getElementById('requestBoxSection').style.display = cfg.showRequestBox !== false ? 'block' : 'none';
    }
  } catch (e) {}

  try {
    const songsRes = await fetch('songs.json?t=' + Date.now());
    if (songsRes.ok) {
      const rawSongs = await songsRes.json();
      songs = rawSongs.map((s, idx) => ({
        ...s,
        id: s.id || ('song_' + idx),
        title: s.title || s.name || s.songName || (s.audio ? s.audio.replace(/\.[^/.]+$/, "") : "Untitled Track"),
        desc: s.desc || s.description || s.subtitle || "R LOFI 01 Original",
        mood: s.mood || s.category || "Lofi",
        ytUrl: s.ytUrl || s.youtube || s.yt || ""
      }));
      originalSongs = [...songs];
      renderTracks(songs);
      if (songs.length > 0) loadSong(0);
    }
  } catch (e) {}
}

// বড় থাম্বনেইল কার্ড রেন্ডার (আগের ডিজাইনের মতো)
function renderTracks(tracks) {
  if (!tracksList) return;
  if (tracks.length === 0) {
    tracksList.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:24px;">কোনো গান পাওয়া যায়নি</p>`;
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
      <div class="big-song-card ${currentSongIndex === i && isPlaying ? 'active' : ''}">
        <div class="big-thumb-wrap" ondblclick="openYouTubeVideo('${song.ytUrl}')" onclick="playSongFromList(${i})">
          <img src="${song.cover || 'profile_1794970581989.png'}" alt="${song.title}">
          <span class="mood-tag">${song.mood}</span>
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
              <a href="${song.audio}" download="${song.title}.mp3" class="icon-pill">${dlIcon}</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.openYouTubeVideo = function(url) {
  if (url) window.open(url, '_blank');
};

function loadSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentSongIndex = index;
  const song = songs[index];

  songTitle.textContent = song.title;
  songMood.textContent = song.mood;
  songCover.src = song.cover || 'profile_1794970581989.png';
  audio.src = song.audio;

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
    audio.play();
    playBtn.innerHTML = '⏸️';
    isPlaying = true;
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

// Bottom Nav Switcher (Home / Search / Library)
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
  } else {
    favoriteSongs.push(songId);
    if (el) el.classList.add('fav-active');
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
    alert("আপনার গানের অনুরোধ সফলভাবে জমা নেওয়া হয়েছে! 📩");
    reqForm.reset();
  });
}

function initAmbient() {
  const rainSlider = document.getElementById('ambientRain');
  const vinylSlider = document.getElementById('ambientVinyl');

  if (rainSlider) {
    rainSlider.addEventListener('input', (e) => {
      const v = e.target.value / 100;
      if (!ambientRain) {
        ambientRain = new Audio('https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav');
        ambientRain.loop = true;
      }
      if (v > 0) {
        ambientRain.volume = v;
        if (ambientRain.paused) ambientRain.play().catch(() => {});
      } else ambientRain.pause();
    });
  }

  if (vinylSlider) {
    vinylSlider.addEventListener('input', (e) => {
      const v = e.target.value / 100;
      if (!ambientVinyl) {
        ambientVinyl = new Audio('https://www.soundjay.com/misc/sounds/vintage-record-player-crackles-01.mp3');
        ambientVinyl.loop = true;
      }
      if (v > 0) {
        ambientVinyl.volume = v * 0.8;
        if (ambientVinyl.paused) ambientVinyl.play().catch(() => {});
      } else ambientVinyl.pause();
    });
  }
}

initSite().then(() => {
  checkDedication();
  initAmbient();
});
