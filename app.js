let songs = [];
let originalSongs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isRandom = false;
let favoriteSongs = JSON.parse(localStorage.getItem('fav_songs') || '[]');

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

async function initSite() {
  try {
    const cfgRes = await fetch('config.json?t=' + Date.now()).catch(() => null);
    if (cfgRes && cfgRes.ok) {
      const cfg = await cfgRes.json();
      if (cfg.title) document.getElementById('siteTitle').textContent = cfg.title;
      if (cfg.bio) document.getElementById('siteBio').textContent = cfg.bio;
      if (cfg.avatar) document.getElementById('avatarImg').src = cfg.avatar;

      if (cfg.accent) {
        document.documentElement.style.setProperty('--accent', cfg.accent);
        document.documentElement.style.setProperty('--accent-glow', cfg.accent + '59');
      }
      if (cfg.iconSize) {
        document.documentElement.style.setProperty('--icon-size', cfg.iconSize + 'px');
      }
      if (cfg.icons) {
        if (cfg.icons.dedicate) customDedicateIcon = cfg.icons.dedicate;
        if (cfg.icons.download) customDownloadIcon = cfg.icons.download;
      }

      document.getElementById('radioActiveBadge').style.display = cfg.showRadioBadge !== false ? 'inline-flex' : 'none';
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
        desc: s.desc || s.description || s.subtitle || "R LOFI 01",
        mood: s.mood || s.category || "Lofi",
        ytUrl: s.ytUrl || s.youtube || s.yt || ""
      }));
      originalSongs = [...songs];
      renderTracks(songs);
      if (songs.length > 0) loadSong(0);
    }
  } catch (e) {
    console.error('Failed to load songs:', e);
  }
}

function renderTracks(tracks) {
  if (!tracksList) return;
  if (tracks.length === 0) {
    tracksList.innerHTML = `<p class="no-tracks">কোনো গান পাওয়া যায়নি</p>`;
    return;
  }

  tracksList.innerHTML = tracks.map((song, i) => {
    const isFav = favoriteSongs.includes(song.id);
    const dlIconHtml = customDownloadIcon
      ? `<img src="${customDownloadIcon}" style="width:var(--icon-size, 20px); height:var(--icon-size, 20px); object-fit:contain;">`
      : `⬇️`;
    const dedIconHtml = customDedicateIcon
      ? `<img src="${customDedicateIcon}" style="width:var(--icon-size, 20px); height:var(--icon-size, 20px); object-fit:contain;">`
      : `💌`;

    return `
      <div class="song-card ${currentSongIndex === i && isPlaying ? 'active' : ''}" onclick="playSongFromList(${i})">
        <img src="${song.cover || 'rlofi 01.png'}" class="song-card-img" alt="${song.title}">
        <div class="song-card-info">
          <div class="song-card-title">${song.title}</div>
          <div class="song-card-sub">${song.mood} • ${song.desc}</div>
        </div>
        <div class="song-card-actions" onclick="event.stopPropagation();">
          <button class="action-btn fav-card-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${song.id}', this)">❤️</button>
          ${song.ytUrl ? `<a href="${song.ytUrl}" target="_blank" class="action-btn">▶️</a>` : ''}
          <a href="${song.audio}" download="${song.title}.mp3" class="action-btn download-btn">${dlIconHtml}</a>
          <button class="action-btn dedicate-btn" onclick="openDedicateModal('${song.id}')">${dedIconHtml}</button>
        </div>
      </div>
    `;
  }).join('');
}

function loadSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentSongIndex = index;
  const song = songs[index];

  songTitle.textContent = song.title;
  songMood.textContent = song.mood;
  songCover.src = song.cover || 'rlofi 01.png';
  audio.src = song.audio;

  favBtn.classList.toggle('active', favoriteSongs.includes(song.id));

  document.querySelectorAll('.song-card').forEach((card, idx) => {
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

prevBtn.addEventListener('click', () => {
  playSongFromList((currentSongIndex - 1 + songs.length) % songs.length);
});

nextBtn.addEventListener('click', () => {
  if (isRandom) {
    playSongFromList(Math.floor(Math.random() * songs.length));
  } else {
    playSongFromList((currentSongIndex + 1) % songs.length);
  }
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
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  if (mood === 'all') songs = [...originalSongs];
  else if (mood === 'favorites') songs = originalSongs.filter(s => favoriteSongs.includes(s.id));
  else songs = originalSongs.filter(s => s.mood.toLowerCase() === mood.toLowerCase());
  renderTracks(songs);
};

window.toggleFavorite = function(songId, el) {
  if (favoriteSongs.includes(songId)) {
    favoriteSongs = favoriteSongs.filter(id => id !== songId);
    if (el) el.classList.remove('active');
  } else {
    favoriteSongs.push(songId);
    if (el) el.classList.add('active');
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
          <p class="ded-text"><strong>${data.from}</strong> এই গানটি <strong>${data.to}</strong> কে ডেডিকেট করেছেন।</p>
          ${data.msg ? `<blockquote class="ded-msg">"${data.msg}"</blockquote>` : ''}
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

window.toggleSearchView = function() {
  const wrapper = document.getElementById('searchWrapper');
  wrapper.style.display = (wrapper.style.display === 'none' || wrapper.style.display === '') ? 'flex' : 'none';
  if (wrapper.style.display === 'flex') searchInput.focus();
};
      
