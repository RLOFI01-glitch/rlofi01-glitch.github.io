
/* Default Pro Vector SVGs (Zero Emoji) */
const DEFAULT_SVGS = {
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,5 15,12 5,19"/><rect x="17" y="5" width="2.5" height="14"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="19,5 9,12 19,19"/><rect x="4.5" y="5" width="2.5" height="14"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  sleep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

let customIconsMap = {};
function renderIconHTML(name){
  if(customIconsMap && customIconsMap[name]) return `<img src="${customIconsMap[name]}" alt="${name}">`;
  return DEFAULT_SVGS[name] || "";
}
function refreshAllIcons(root = document){
  root.querySelectorAll(".ui-ico[data-icon]").forEach(el => {
    const key = el.getAttribute("data-icon");
    el.innerHTML = renderIconHTML(key);
  });
}

let songs = [
  { name: "Ek Naam Tha", file: "Ek Naam Tha.mp3", cover: "Ek Naam Tha.png", mood: "romantic", desc: "Romantic • Emotional", youtube: "https://youtube.com/@rlofi01" },
  { name: "RIHAI", file: "RIHAI.mp3", cover: "RIHAI.png", mood: "sad", desc: "Sad • Emotional • Lofi", youtube: "https://youtube.com/@rlofi01" },
  { name: "SAJDA KIYA", file: "SAJDA KIYA.mp3", cover: "SAJDA KIYA.png", mood: "romantic", desc: "Romantic • Soulful • Lofi", youtube: "https://youtube.com/@rlofi01" },
  { name: "Tere Jaane Ke Baad", file: "Tere Jaane Ke Baad.mp3", cover: "Tere Jaane Ke Baad.png", mood: "sad", desc: "Sad • Heartbreak • Lofi", youtube: "https://youtube.com/@rlofi01" }
];

let index = 0, isShuffle = false, isRepeat = false, sleepTimer = null;
let likedSongs = JSON.parse(localStorage.getItem("rlofi_likes") || "[]");
let playlists = JSON.parse(localStorage.getItem("rlofi_playlists") || '{"Favorites":[]}');
let activeLibFolder = "liked";
let currentMoodFilter = "all";

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const miniPlayBtn = document.getElementById("miniPlayBtn");
const seek = document.getElementById("seek");

function showToast(msg){
  const t = document.getElementById("toastHint");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.display = "none", 3000);
}

function applySiteConfig(cfg){
  if(!cfg) return;
  if(cfg.profileImg){
    document.getElementById("navLogo").src = cfg.profileImg;
    document.getElementById("heroProfileImg").src = cfg.profileImg;
  }
  if(cfg.bgImg){
    document.getElementById("home").style.backgroundImage = `linear-gradient(to bottom,rgba(16,11,25,0.65),rgba(16,11,25,0.92)),url('${cfg.bgImg}')`;
  }
  if(cfg.bgVideo){
    const vid = document.getElementById("lowerBgVideo");
    vid.src = cfg.bgVideo;
    vid.style.display = "block";
    vid.play().catch(()=>{});
  }
  if(cfg.youtubeId){
    document.getElementById("ytIframe").src = `https://www.youtube.com/embed/${cfg.youtubeId}`;
  }
  if(cfg.texts){
    const T = cfg.texts;
    const setTxt = (id, val) => { const el = document.getElementById(id); if(el && val) el.textContent = val; };
    setTxt("txtBrandHeader", T.brandHeader);
    setTxt("txtHeaderYt", T.headerYt);
    setTxt("txtHeroTitle", T.heroTitle);
    setTxt("txtTagline1", T.tagline1);
    setTxt("txtTagline2", T.tagline2);
    setTxt("txtHeroListen", T.heroListen);
    setTxt("txtHeroYt", T.heroYt);
    setTxt("txtLatestHeading", T.latestHeading);
    setTxt("txtLatestSub", T.latestSub);
    setTxt("txtMoodAll", T.moodAll);
    setTxt("txtMoodRomantic", T.moodRomantic);
    setTxt("txtMoodSad", T.moodSad);
    setTxt("txtMoodLofi", T.moodLofi);
    setTxt("txtNavHome", T.navHome);
    setTxt("txtNavSearch", T.navSearch);
    setTxt("txtNavLibrary", T.navLibrary);
    if(T.ytUrl){
      document.getElementById("headerYtLink").href = T.ytUrl;
      document.getElementById("heroYtLink").href = T.ytUrl;
    }
  }
  if(cfg.colors){
    const C = cfg.colors;
    const root = document.documentElement.style;
    if(C.accent){
      root.setProperty("--accent", C.accent);
      root.setProperty("--accent-glow", C.accent + "99");
    }
    if(C.bgDark) root.setProperty("--bg-dark", C.bgDark);
    if(C.headingColor) root.setProperty("--heading-color", C.headingColor);
    if(C.textColor) root.setProperty("--text-color", C.textColor);
  }
  if(cfg.icons){
    customIconsMap = cfg.icons;
  }
  refreshAllIcons();
  renderSongs();
}

window.addEventListener("message", (ev) => {
  if(ev.data && ev.data.type === "RLOFI_LIVE_PREVIEW"){
    applySiteConfig(ev.data.cfg);
  }
});

async function initSiteData(){
  refreshAllIcons();
  try{
    const cRes = await fetch("config.json?t=" + Date.now());
    if(cRes.ok) applySiteConfig(await cRes.json());
  }catch(e){}

  try{
    const sRes = await fetch("songs.json?t=" + Date.now());
    if(sRes.ok){
      const data = await sRes.json();
      if(Array.isArray(data) && data.length > 0) songs = data;
    }
  }catch(e){}
  renderSongs();
  updateFavUI();
}
function buildSongCard(s, idx){
  const isLiked = likedSongs.includes(s.name);
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="art">
      <img src="${s.cover}" alt="${s.name}">
      <button class="fav-tag ${isLiked ? "liked" : ""}" title="Like"><span class="ui-ico" data-icon="heart"></span></button>
      <span class="yt-tag"><span class="ui-ico" style="width:12px;height:12px" data-icon="play"></span><span>2x Tap YT</span></span>
    </div>
    <h3>${s.name}</h3>
    <p>${s.desc || "Original Music • R LOFI 01"}</p>
    <div class="card-btns">
      <button class="play-btn"><span class="ui-ico" data-icon="play"></span><span>Play</span></button>
      <button class="share-btn save-card-btn"><span class="ui-ico" data-icon="save"></span><span>Save</span></button>
      <a class="dl-btn" href="${s.file}" download="${s.name} - R LOFI 01.mp3"><span class="ui-ico" data-icon="download"></span><span>Download</span></a>
      <button class="share-btn share-card-btn"><span class="ui-ico" data-icon="share"></span><span>Share</span></button>
    </div>
  `;
  refreshAllIcons(card);

  let lastTap = 0;
  const art = card.querySelector(".art");
  art.addEventListener("click", (e) => {
    if(e.target.closest(".fav-tag")) return;
    const now = Date.now();
    if(now - lastTap < 320){
      window.open(s.youtube || "https://youtube.com/@rlofi01", "_blank");
    }else{
      playSongByIndex(idx, true);
    }
    lastTap = now;
  });

  card.querySelector(".fav-tag").onclick = (e) => { e.stopPropagation(); toggleLike(s.name); };
  card.querySelector(".play-btn").onclick = () => playSongByIndex(idx, true);
  card.querySelector(".save-card-btn").onclick = () => openSaveModal(s.name);
  card.querySelector(".share-card-btn").onclick = () => shareSong(s.name);
  return card;
}

function renderSongs(){
  const listEl = document.getElementById("songList");
  listEl.innerHTML = "";
  let count = 0;
  songs.forEach((s, i) => {
    if(currentMoodFilter === "all" || (s.mood && s.mood.toLowerCase() === currentMoodFilter)){
      listEl.appendChild(buildSongCard(s, i));
      count++;
    }
  });
  document.getElementById("noResult").style.display = count === 0 ? "block" : "none";
}

document.querySelectorAll("#moodFilters .mood-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#moodFilters .mood-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMoodFilter = btn.dataset.mood;
    renderSongs();
  };
});

function playSongByIndex(i, openModal = false){
  index = i;
  const s = songs[index];
  if(!s) return;
  audio.src = s.file;
  document.getElementById("songName").textContent = s.name;
  document.getElementById("cover").innerHTML = `<img src="${s.cover}" alt="${s.name}">`;
  document.getElementById("playerDownload").href = s.file;
  document.getElementById("playerDownload").download = `${s.name} - R LOFI 01.mp3`;

  document.getElementById("miniCover").src = s.cover;
  document.getElementById("miniTitle").textContent = s.name;
  document.getElementById("miniPlayer").style.display = "flex";

  audio.play().catch(()=>{});
  setPlayingUI(true);
  updateFavUI();
  if(openModal) document.getElementById("fullPlayerModal").style.display = "flex";
  fetch("https://api.counterapi.dev/v1/rlofi01/plays/up").catch(()=>{});
}

function setPlayingUI(playing){
  const ico = playing ? "pause" : "play";
  playBtn.querySelector(".ui-ico").setAttribute("data-icon", ico);
  miniPlayBtn.querySelector(".ui-ico").setAttribute("data-icon", ico);
  refreshAllIcons(playBtn);
  refreshAllIcons(miniPlayBtn);
  document.getElementById("playerBox").classList.toggle("playing", playing);
}

playBtn.onclick = () => {
  if(audio.paused){ audio.play(); setPlayingUI(true); }
  else { audio.pause(); setPlayingUI(false); }
};
miniPlayBtn.onclick = (e) => { e.stopPropagation(); playBtn.onclick(); };
document.getElementById("heroListenBtn").onclick = () => playSongByIndex(0, true);

function playNext(){
  if(isShuffle) index = Math.floor(Math.random() * songs.length);
  else index = (index + 1) % songs.length;
  playSongByIndex(index, false);
}
function playPrev(){
  index = (index - 1 + songs.length) % songs.length;
  playSongByIndex(index, false);
}
document.getElementById("next").onclick = playNext;
document.getElementById("prev").onclick = playPrev;
document.getElementById("miniNextBtn").onclick = (e) => { e.stopPropagation(); playNext(); };
document.getElementById("miniCloseBtn").onclick = (e) => {
  e.stopPropagation();
  audio.pause();
  setPlayingUI(false);
  document.getElementById("miniPlayer").style.display = "none";
};

audio.onended = () => { if(isRepeat){ audio.currentTime = 0; audio.play(); } else playNext(); };
audio.ontimeupdate = () => {
  if(!audio.duration) return;
  seek.value = (audio.currentTime / audio.duration) * 100;
  document.getElementById("current").textContent = formatTime(audio.currentTime);
  document.getElementById("duration").textContent = formatTime(audio.duration);
};
seek.oninput = () => { if(audio.duration) audio.currentTime = (seek.value / 100) * audio.duration; };
document.getElementById("volume").oninput = (e) => audio.volume = e.target.value;
function formatTime(sec){
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

document.getElementById("shuffleBtn").onclick = function(){
  isShuffle = !isShuffle;
  this.classList.toggle("active-ctrl", isShuffle);
  showToast(isShuffle ? "Shuffle ON" : "Shuffle OFF");
};
document.getElementById("loopBtn").onclick = function(){
  isRepeat = !isRepeat;
  this.classList.toggle("active-ctrl", isRepeat);
  showToast(isRepeat ? "Repeat ON" : "Repeat OFF");
};

document.getElementById("sleepBtn").onclick = () => {
  const m = document.getElementById("sleepMenu");
  m.style.display = m.style.display === "flex" ? "none" : "flex";
};
document.querySelectorAll(".sleep-opt").forEach(btn => {
  btn.onclick = () => {
    const mins = parseInt(btn.dataset.mins);
    clearTimeout(sleepTimer);
    document.getElementById("sleepMenu").style.display = "none";
    if(mins > 0){
      sleepTimer = setTimeout(() => { audio.pause(); setPlayingUI(false); showToast("Sleep Timer: Music Stopped"); }, mins * 60000);
      showToast(`Sleep Timer set for ${mins} mins`);
    }else showToast("Sleep Timer OFF");
  };
});

const fpModal = document.getElementById("fullPlayerModal");
document.getElementById("miniOpenArea").onclick = () => fpModal.style.display = "flex";
document.getElementById("fpDragHandle").onclick = () => fpModal.style.display = "none";
let touchStartY = 0;
fpModal.addEventListener("touchstart", e => touchStartY = e.touches[0].clientY, {passive:true});
fpModal.addEventListener("touchend", e => {
  if(e.changedTouches[0].clientY - touchStartY > 90 && fpModal.scrollTop === 0) fpModal.style.display = "none";
}, {passive:true});

function toggleLike(name){
  const pos = likedSongs.indexOf(name);
  if(pos > -1) likedSongs.splice(pos, 1);
  else likedSongs.push(name);
  localStorage.setItem("rlofi_likes", JSON.stringify(likedSongs));
  renderSongs();
  updateFavUI();
  renderLibrary();
}
function updateFavUI(){
  const s = songs[index];
  if(!s) return;
  const liked = likedSongs.includes(s.name);
  document.getElementById("fpFavBtn").classList.toggle("active-pill", liked);
}
document.getElementById("fpFavBtn").onclick = () => { if(songs[index]) toggleLike(songs[index].name); };

let songToSave = "";
function openSaveModal(name){
  songToSave = name;
  document.getElementById("saveModalSongName").textContent = name;
  const list = document.getElementById("playlistOptionsList");
  list.innerHTML = "";
  Object.keys(playlists).forEach(pl => {
    const has = playlists[pl].includes(name);
    const row = document.createElement("div");
    row.className = "pl-row";
    row.innerHTML = `<span>${pl} (${playlists[pl].length})</span><strong>${has ? "Saved" : "+ Add"}</strong>`;
    row.onclick = () => {
      if(has) playlists[pl] = playlists[pl].filter(x => x !== name);
      else playlists[pl].push(name);
      localStorage.setItem("rlofi_playlists", JSON.stringify(playlists));
      openSaveModal(name);
      renderLibrary();
    };
    list.appendChild(row);
  });
  document.getElementById("saveModal").style.display = "flex";
}
document.getElementById("fpSavePlaylistBtn").onclick = () => { if(songs[index]) openSaveModal(songs[index].name); };
document.getElementById("closeSaveModalBtn").onclick = () => document.getElementById("saveModal").style.display = "none";
document.getElementById("createPlaylistBtn").onclick = () => {
  const name = prompt("New folder / playlist name:");
  if(name && name.trim()){
    if(!playlists[name.trim()]) playlists[name.trim()] = [];
    localStorage.setItem("rlofi_playlists", JSON.stringify(playlists));
    openSaveModal(songToSave);
    renderLibrary();
  }
};

function shareSong(name){
  const url = window.location.href;
  if(navigator.share) navigator.share({ title: name + " - R LOFI 01", url }).catch(()=>{});
  else { navigator.clipboard.writeText(url); showToast("Website link copied!"); }
}
document.getElementById("fpShareBtn").onclick = () => { if(songs[index]) shareSong(songs[index].name); };

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if(btn.dataset.tab === "library") renderLibrary();
    if(btn.dataset.tab === "search") renderSearch("");
  };
});

function renderSearch(q){
  const box = document.getElementById("searchResults");
  box.innerHTML = "";
  const term = q.toLowerCase().trim();
  songs.forEach((s, i) => {
    if(!term || s.name.toLowerCase().includes(term) || (s.mood && s.mood.toLowerCase().includes(term))){
      box.appendChild(buildSongCard(s, i));
    }
  });
}
document.getElementById("searchInput").oninput = (e) => renderSearch(e.target.value);

function renderLibrary(){
  const bar = document.getElementById("libraryFoldersBar");
  bar.innerHTML = "";
  const likedBtn = document.createElement("button");
  likedBtn.className = "mood-btn" + (activeLibFolder === "liked" ? " active" : "");
  likedBtn.textContent = `Liked (${likedSongs.length})`;
  likedBtn.onclick = () => { activeLibFolder = "liked"; renderLibrary(); };
  bar.appendChild(likedBtn);

  Object.keys(playlists).forEach(pl => {
    const b = document.createElement("button");
    b.className = "mood-btn" + (activeLibFolder === pl ? " active" : "");
    b.textContent = `${pl} (${playlists[pl].length})`;
    b.onclick = () => { activeLibFolder = pl; renderLibrary(); };
    bar.appendChild(b);
  });

  const targetNames = activeLibFolder === "liked" ? likedSongs : (playlists[activeLibFolder] || []);
  const list = document.getElementById("libraryList");
  list.innerHTML = "";
  let found = 0;
  songs.forEach((s, i) => {
    if(targetNames.includes(s.name)){
      list.appendChild(buildSongCard(s, i));
      found++;
    }
  });
  document.getElementById("emptyLibrary").style.display = found === 0 ? "block" : "none";
}

let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installAppBtn").style.display = "inline-flex";
});
document.getElementById("installAppBtn").onclick = async () => {
  if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
};

fetch("https://api.counterapi.dev/v1/rlofi01/visits/up").catch(()=>{});
initSiteData();
 
