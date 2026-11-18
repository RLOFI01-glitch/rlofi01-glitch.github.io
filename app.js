let songs = [];
let originalSongs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isRandom = false;
let favoriteSongs = JSON.parse(localStorage.getItem('fav_songs') || '[]');

const audio = new Audio();
let ambientRain = null;
let ambientVinyl = null;

// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
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

// Load Site configurations and Songs
async function initSite() {
  try {
    // ১. কনফিগ লোড
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

      // কাস্টম আইকন সাইজ ও ছবি
      if (cfg.iconSize) {
        document.documentElement.style.setProperty('--icon-size', cfg.iconSize + 'px');
      }
      if (cfg.icons) {
        if (cfg.icons.dedicate) {
          document.querySelectorAll('.dedicate-icon').forEach(img => img.src = cfg.icons.dedicate);
        }
        if (cfg.icons.download) {
          document.querySelectorAll('.download-icon').forEach(img => img.src = cfg.icons.download);
        }
      }

      // ফিচার টগলস
      document.getElementById('radioActiveBadge').style.display = cfg.showRadioBadge !== false ? 'inline-flex' : 'none';
      document.getElementById('ambientSection').style.display = cfg.showAmbientStudio !== false ? 'block' : 'none';
      document.getElementById('requestBoxSection').style.display = cfg.showRequestBox !== false ? 'block' : 'none';
    }
  } catch (e) { console.log('Config failed, using defaults'); }

  try {
    // ২. গান লোড ও পাথ ফিক্স (রুটে থাকা গান ও কভার সাপোর্ট)
    const songsRes = await fetch('songs.json?t=' + Date.now());
    if (songsRes.ok) {
      const rawSongs = await songsRes.json();
      songs = rawSongs.map(s => {
        // যদি ফোল্ডার পাথ না থাকে, তবে সরাসরি রুট ফাইলের পাথ সেট করো
        let sCover = s.cover;
        if (sCover && !sCover.startsWith('http') && !sCover.startsWith('assets/')) {
          sCover = sCover; // directly 'Ek Naam Tha.png' etc
        }
        let sAudio = s.audio;
        if (sAudio && !sAudio.startsWith('http') && !sAudio.startsWith('assets/')) {
          sAudio = sAudio;
        }
        return { ...s, cover: sCover, audio: sAudio };
      });
      originalSongs = [...songs];
      renderTracks(songs);
      if (songs.length > 0) {
        loadSong(0);
      }
    }
  } catch (e) {
    console.error('Failed to load songs:', e);
  }
}

// Render Tracks (হোমস্ক্রিনের গানের লিস্ট)
function renderTracks(tracks) {
  if (!tracksList) return;
  if (tracks.length === 0) {
    tracksList.innerHTML = `<p class="no-tracks">কোনো গান পাওয়া যায়নি</p>`;
    return;
  }

  tracksList.innerHTML = tracks.map((song, i) => {
    const isFav = favoriteSongs.includes(song.id);
    return `
      <div class="song-card ${currentSongIndex === i && isPlaying ? 'active' : ''}" onclick="playSongFromList(${i})">
        <img src="${song.cover || 'assets/default.png'}" class="song-card-img" alt="${song.title}">
        <div class="song-card-info">
          <div class="song-card-title">${song.title}</div>
          <div class="song-card-sub">${song.mood || 'Lofi'} • ${song.desc || 'R LOFI 01'}</div>
        </div>
        <div class="song-card-actions" onclick="event.stopPropagation();">
          <button class="action-btn fav-card-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${song.id}', this)">
            ❤️
          </button>
          ${song.ytUrl ? `
            <a href="${song.ytUrl}" target="_blank" class="action-btn">
              ▶️
            </a>
          ` : ''}
          <a href="${song.audio}" download="${song.title}.mp3" class="action-btn download-btn">
            <img class="download-icon" src="assets/icons/download.png" onerror="this.src='⬇️'" style="width:var(--icon-size, 20px); height:var(--icon-size, 20px); object-fit:contain;">
          </a>
          <button class="action-btn dedicate-btn" onclick="openDedicateModal('${song.id}')">
            <img class="dedicate-icon" src="assets/icons/dedicate.png" onerror="this.src='💌'" style="width:var(--icon-size, 20px); height:var(--icon-size, 20px); object-fit:contain;">
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Load Song
function loadSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentSongIndex = index;
  const song = songs[index];
  
  songTitle.textContent = song.title;
  songMood.textContent = song.mood || 'Lofi';
  songCover.src = song.cover || 'assets/default.png';
  audio.src = song.audio;
  
  // Fav status update
  if (favoriteSongs.includes(song.id)) {
    favBtn.classList.add('active');
  } else {
    favBtn.classList.remove('active');
  }

  // Active state in list visual update
  document.querySelectorAll('.song-card').forEach((card, idx) => {
    if (idx === index) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Play-Pause
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

// Progress and Time
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const progress = (audio.currentTime / audio.duration) * 100;
  progressBar.value = progress;
  
  // Formatted Current Time
  const curMin = Math.floor(audio.currentTime / 60);
  const curSec = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
  currentTimeEl.textContent = `${curMin}:${curSec}`;

  // Formatted Duration
  const durMin = Math.floor(audio.duration / 60);
  const durSec = Math.floor(audio.duration % 60).toString().padStart(2, '0');
  totalDurationEl.textContent = `${durMin}:${durSec}`;
});

progressBar.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
});

// Controls Action
prevBtn.addEventListener('click', () => {
  let prevIndex = currentSongIndex - 1;
  if (prevIndex < 0) prevIndex = songs.length - 1;
  playSongFromList(prevIndex);
});

nextBtn.addEventListener('click', () => {
  if (isRandom) {
    let randIndex = Math.floor(Math.random() * songs.length);
    playSongFromList(randIndex);
  } else {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= songs.length) nextIndex = 0;
    playSongFromList(nextIndex);
  }
});

audio.addEventListener('ended', () => {
  nextBtn.click();
});

randomBtn.addEventListener('click', () => {
  isRandom = !isRandom;
  randomBtn.classList.toggle('active', isRandom);
});

// Search & filter feature
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (val === '') {
      songs = [...originalSongs];
    } else {
      songs = originalSongs.filter(s => 
        s.title.toLowerCase().includes(val) || 
        (s.mood && s.mood.toLowerCase().includes(val)) ||
        (s.desc && s.desc.toLowerCase().includes(val))
      );
    }
    renderTracks(songs);
  });
}

// Filter Navigation Tabs
window.filterMood = function(mood, el) {
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  if (mood === 'all') {
    songs = [...originalSongs];
  } else if (mood === 'favorites') {
    songs = originalSongs.filter(s => favoriteSongs.includes(s.id));
  } else {
    songs = originalSongs.filter(s => s.mood && s.mood.toLowerCase() === mood.toLowerCase());
  }
  renderTracks(songs);
};

// Favorites Toggle
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

// Toggle Current Playing Fav
favBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  const currentSongId = songs[currentSongIndex].id;
  toggleFavorite(currentSongId);
  favBtn.classList.toggle('active', favoriteSongs.includes(currentSongId));
  renderTracks(songs);
});

// Dedication Dialog Box
window.openDedicateModal = function(songId) {
  const song = originalSongs.find(s => s.id === songId);
  if (!song) return;
  const fromWho = prompt("আপনার নাম (Dedicator):");
  if (!fromWho) return;
  const toWho = prompt("কাকে উৎসর্গ করতে চান (To Who):");
  if (!toWho) return;
  const message = prompt("কোনো বিশেষ বার্তা বা অনুভূতি (Message):");
  
  const dedicationData = {
    songId: songId,
    from: fromWho,
    to: toWho,
    msg: message || ""
  };

  // Dedication Link generation
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(dedicationData))));
  const shareLink = `${location.origin}${location.pathname}?dedicate=${encoded}`;
  
  // Show dedicated Link to copy
  alert(`💖 ডেডিকেশন লিংক তৈরি হয়েছে! কপি করে প্রিয়জনকে পাঠান:\n\n${shareLink}`);
  navigator.clipboard.writeText(shareLink).then(() => {
    alert("লিংকটি কপি করা হয়েছে! 💌");
  });
};

// Check for incoming dedication Link
function checkDedication() {
  const params = new URLSearchParams(window.location.search);
  const dedB64 = params.get('dedicate');
  if (dedB64) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(dedB64))));
      // Find the song
      const songIdx = originalSongs.findIndex(s => s.id === data.songId);
      if (songIdx !== -1) {
        loadSong(songIdx);
        
        // Show dedicatons overlay message box
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
    } catch (e) { console.log('Invalid dedication format'); }
  }
}

// Listener Song Request Form Box submission locally
const reqForm = document.getElementById('requestForm');
if (reqForm) {
  reqForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reqName').value.trim();
    const text = document.getElementById('reqVibe').value.trim();
    
    if (!name || !text) return;
    
    // Save to LocalStorage for Admin to review in Inbox
    const existing = JSON.parse(localStorage.getItem('rlofi_requests') || '[]');
    existing.unshift({
      id: "req_" + Date.now(),
      name: name,
      text: text,
      date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'})
    });
    localStorage.setItem('rlofi_requests', JSON.stringify(existing));
    
    alert("আপনার গানের অনুরোধ সফলভাবে জমা নেওয়া হয়েছে! 📩");
    reqForm.reset();
  });
}

// Ambient Mixer Studio controls
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
        if (ambientRain.paused) ambientRain.play().catch(e=>console.log(e));
      } else {
        ambientRain.pause();
      }
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
        ambientVinyl.volume = v * 0.8; // Limit Vinyl Volume max
        if (ambientVinyl.paused) ambientVinyl.play().catch(e=>console.log(e));
      } else {
        ambientVinyl.pause();
      }
    });
  }
}

// Start everything up
initSite().then(() => {
  checkDedication();
  initAmbient();
});

// Toggle Main search visual bar on bottom click
window.toggleSearchView = function() {
  const wrapper = document.getElementById('searchWrapper');
  wrapper.style.display = (wrapper.style.display === 'none' || wrapper.style.display === '') ? 'flex' : 'none';
  if (wrapper.style.display === 'flex') {
    searchInput.focus();
  }
};
