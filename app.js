document.addEventListener("DOMContentLoaded", function(){
 if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(function(){});
 }
 var deferredPrompt;
 window.addEventListener("beforeinstallprompt", function(e){
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installAppBtn").style.display = "inline-block";
 });
 document.getElementById("installAppBtn").onclick = async function(){
  if(deferredPrompt){
   deferredPrompt.prompt();
   await deferredPrompt.userChoice;
   deferredPrompt = null;
   document.getElementById("installAppBtn").style.display = "none";
  }
 };

 var tracks = [
  {name:"Ek Naam Tha",file:"Ek Naam Tha.mp3",cover:"Ek Naam Tha.png",mood:"romantic",desc:"Romantic • Emotional",youtube:""},
  {name:"RIHAI",file:"RIHAI.mp3",cover:"RIHAI.png",mood:"sad",desc:"Sad • Emotional • Lofi",youtube:""}
 ];

 var savedFavorites = [];
 var customPlaylists = {};
 try{
  savedFavorites = JSON.parse(localStorage.getItem("rlofi_favorites") || "[]");
  customPlaylists = JSON.parse(localStorage.getItem("rlofi_playlists") || "{}");
 }catch(e){}

 var index = 0;
 var currentMood = "all";
 var activePlaylistFilter = "liked";
 var isShuffle = false;
 var isLoop = false;
 var saveTargetSong = "";

 var audio = document.getElementById("audio");
 var playBtn = document.getElementById("play");
 var miniPlayBtn = document.getElementById("miniPlayBtn");
 var playerBox = document.getElementById("playerBox");
 var playerDownload = document.getElementById("playerDownload");
 var coverBox = document.getElementById("cover");

 function switchTab(tab){
  document.querySelectorAll(".tab-view").forEach(function(v){ v.classList.remove("active"); });
  document.querySelectorAll(".nav-item").forEach(function(n){ n.classList.remove("active"); });
  document.getElementById("tab-" + tab).classList.add("active");
  document.getElementById("nav-" + tab).classList.add("active");
  window.scrollTo({top: 0, behavior: "smooth"});
  if(tab === "search") renderSearch();
  if(tab === "library") renderLibrary();
 }

 document.querySelectorAll(".nav-item").forEach(function(btn){
  btn.onclick = function(){ switchTab(btn.getAttribute("data-tab")); };
 });

 /* Full Player Open, Minimize & Swipe Down */
 var fpModal = document.getElementById("fullPlayerModal");
 function openFullPlayer(){
  fpModal.style.display = "flex";
  updateFavButtonUI();
 }
 function closeFullPlayer(){
  fpModal.style.display = "none";
 }

 document.getElementById("miniOpenArea").onclick = openFullPlayer;
 document.getElementById("fpDragHandle").onclick = closeFullPlayer;
 document.getElementById("miniCloseBtn").onclick = function(){
  audio.pause();
  setPlayingState(false);
  document.getElementById("miniPlayer").style.display = "none";
 };

 var touchStartY = 0;
 fpModal.addEventListener("touchstart", function(e){
  touchStartY = e.touches[0].clientY;
 }, {passive: true});
 fpModal.addEventListener("touchend", function(e){
  var touchEndY = e.changedTouches[0].clientY;
  if(touchEndY - touchStartY > 95 && fpModal.scrollTop <= 10){
   closeFullPlayer();
  }
 }, {passive: true});

 /* Double Tap + Single Tap Hinglish Hint */
 var lastTapTime = 0;
 var lastTapIdx = -1;
 var toastTimer;

 function showHinglishHint(msg){
  var toast = document.getElementById("toastHint");
  toast.textContent = msg;
  toast.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toast.style.display = "none"; }, 2500);
 }

 function handleThumbTap(i){
  var now = Date.now();
  if(lastTapIdx === i && (now - lastTapTime) < 380){
   var ytUrl = (tracks[i] && tracks[i].youtube) ? tracks[i].youtube : "https://youtube.com/@rlofi01";
   window.open(ytUrl, "_blank");
   lastTapTime = 0;
  }else{
   lastTapTime = now;
   lastTapIdx = i;
   showHinglishHint("💡 YouTube par video dekhne ke liye thumbnail par double tap karein");
  }
 }

 coverBox.onclick = function(){ handleThumbTap(index); };

 /* Liked Songs & Custom Playlists ("Save to...") */
 function isFavorite(songName){
  return savedFavorites.indexOf(songName) !== -1;
 }

 function saveStorage(){
  try{
   localStorage.setItem("rlofi_favorites", JSON.stringify(savedFavorites));
   localStorage.setItem("rlofi_playlists", JSON.stringify(customPlaylists));
  }catch(e){}
 }

 function toggleFavorite(i){
  if(!tracks[i]) return;
  var name = tracks[i].name;
  if(isFavorite(name)){
   savedFavorites = savedFavorites.filter(function(s){ return s !== name; });
   showHinglishHint("💔 Liked Songs se remove kiya gaya");
  }else{
   savedFavorites.push(name);
   showHinglishHint("❤️ Liked Songs mein save ho gaya!");
  }
  saveStorage();
  updateFavButtonUI();
  renderSongs();
  renderSearch();
  renderLibrary();
 }

 document.getElementById("fpFavBtn").onclick = function(){ toggleFavorite(index); };

 function updateFavButtonUI(){
  var btn = document.getElementById("fpFavBtn");
  btn.textContent = (tracks[index] && isFavorite(tracks[index].name)) ? "❤️" : "🤍";
 }

 function openSaveModal(songName){
  saveTargetSong = songName;
  document.getElementById("saveModalSongName").textContent = songName;
  renderPlaylistOptions();
  document.getElementById("saveModal").style.display = "flex";
 }

 function closeSaveModal(){
  document.getElementById("saveModal").style.display = "none";
 }

 document.getElementById("closeSaveModalBtn").onclick = closeSaveModal;
 document.getElementById("saveModal").onclick = function(e){
  if(e.target === this) closeSaveModal();
 };
 document.getElementById("fpSavePlaylistBtn").onclick = function(){
  if(tracks[index]) openSaveModal(tracks[index].name);
 };

 document.getElementById("createPlaylistBtn").onclick = function(){
  var pName = prompt("Apne naye folder / playlist ka naam likhein:");
  if(pName && pName.trim()){
   var cleanName = pName.trim();
   if(!customPlaylists[cleanName]) customPlaylists[cleanName] = [];
   if(saveTargetSong && customPlaylists[cleanName].indexOf(saveTargetSong) === -1){
    customPlaylists[cleanName].push(saveTargetSong);
   }
   saveStorage();
   renderPlaylistOptions();
   renderLibrary();
   showHinglishHint('📁 "' + cleanName + '" mein save ho gaya!');
  }
 };

 function renderPlaylistOptions(){
  var container = document.getElementById("playlistOptionsList");
  container.innerHTML = "";
  var keys = Object.keys(customPlaylists);
  if(keys.length === 0){
   container.innerHTML = '<p class="sub" style="text-align:center;margin:15px 0">Abhi koi folder nahi bana hai. Niche "+ New playlist" dabayein!</p>';
   return;
  }
  keys.forEach(function(folder){
   var list = customPlaylists[folder] || [];
   var exists = list.indexOf(saveTargetSong) !== -1;
   var row = document.createElement("div");
   row.className = "pl-row";
   row.innerHTML = '<div><strong>📁 ' + folder + '</strong><br><small style="color:#bcaacb">' + list.length + ' songs</small></div><span style="font-size:20px">' + (exists ? "✅" : "🔖") + '</span>';
   row.onclick = function(){
    if(exists){
     customPlaylists[folder] = list.filter(function(s){ return s !== saveTargetSong; });
     showHinglishHint('Removed from "' + folder + '"');
    }else{
     customPlaylists[folder].push(saveTargetSong);
     showHinglishHint('Saved to "' + folder + '" ✅');
    }
    saveStorage();
    renderPlaylistOptions();
    renderLibrary();
   };
   container.appendChild(row);
  });
 }

 fetch("https://api.counterapi.dev/v1/rlofi01/visits/up").catch(function(){});
 function trackPlay(){ fetch("https://api.counterapi.dev/v1/rlofi01/plays/up").catch(function(){}); }
 playerDownload.onclick = trackPlay;

 fetch("config.json?v=" + Date.now())
  .then(function(r){ return r.json(); })
  .then(function(cfg){
   if(cfg.youtubeId){
    document.getElementById("ytIframe").src = "https://www.youtube.com/embed/" + cfg.youtubeId;
   }
   if(cfg.profileImg){
    document.getElementById("navLogo").src = cfg.profileImg;
    document.getElementById("heroProfileImg").src = cfg.profileImg;
   }
   if(cfg.bgImg){
    document.getElementById("home").style.background = "linear-gradient(to bottom,rgba(16,11,25,0.65),rgba(16,11,25,0.92)),url('" + cfg.bgImg + "') center/cover no-repeat";
   }
   if(cfg.bgVideo){
    var vid = document.getElementById("heroVideo");
    vid.src = cfg.bgVideo;
    vid.style.display = "block";
   }
  }).catch(function(){});

 function createCardElement(t, i){
  var card = document.createElement("div");
  card.className = "card";

  var art = document.createElement("div");
  art.className = "art";
  art.innerHTML = (t.cover ? '<img src="' + t.cover + '" alt="' + t.name + '">' : '🎵') + '<span class="yt-tag">▶ 2x Tap YT</span>';
  art.onclick = function(){ handleThumbTap(i); };

  var favBtn = document.createElement("button");
  favBtn.className = "fav-tag";
  favBtn.textContent = isFavorite(t.name) ? "❤️" : "🤍";
  favBtn.onclick = function(e){ e.stopPropagation(); toggleFavorite(i); };
  art.appendChild(favBtn);

  var title = document.createElement("h3");
  title.textContent = t.name;

  var desc = document.createElement("p");
  desc.textContent = t.desc;

  var btns = document.createElement("div");
  btns.className = "card-btns";

  var pBtn = document.createElement("button");
  pBtn.className = "play-btn";
  pBtn.textContent = "▶ Play";
  pBtn.onclick = function(){ playSong(i); };

  var saveFolderBtn = document.createElement("button");
  saveFolderBtn.className = "share-btn";
  saveFolderBtn.textContent = "➕ Save";
  saveFolderBtn.onclick = function(){ openSaveModal(t.name); };

  var dBtn = document.createElement("a");
  dBtn.className = "dl-btn";
  dBtn.href = t.file;
  dBtn.download = t.name + " - R LOFI 01.mp3";
  dBtn.textContent = "⬇ Download";
  dBtn.onclick = trackPlay;

  var sBtn = document.createElement("button");
  sBtn.className = "share-btn";
  sBtn.textContent = "🔗 Share";
  sBtn.onclick = function(){ shareSong(t.name); };

  btns.appendChild(pBtn);
  btns.appendChild(saveFolderBtn);
  btns.appendChild(dBtn);
  btns.appendChild(sBtn);

  card.appendChild(art);
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(btns);
  return card;
 }

 function renderSongs(){
  var list = document.getElementById("songList");
  var noResult = document.getElementById("noResult");
  list.innerHTML = "";
  var count = 0;

  tracks.forEach(function(t, i){
   if(currentMood === "all" || t.mood === currentMood){
    count++;
    list.appendChild(createCardElement(t, i));
   }
  });
  noResult.style.display = count === 0 ? "block" : "none";
 }

 function renderSearch(){
  var q = document.getElementById("searchInput").value.toLowerCase().trim();
  var box = document.getElementById("searchResults");
  box.innerHTML = "";
  tracks.forEach(function(t, i){
   if(!q || t.name.toLowerCase().indexOf(q) !== -1 || t.mood.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1){
    box.appendChild(createCardElement(t, i));
   }
  });
 }

 document.getElementById("searchInput").oninput = renderSearch;

 function renderLibrary(){
  var tabsBar = document.getElementById("libraryFoldersBar");
  tabsBar.innerHTML = "";

  var likedChip = document.createElement("button");
  likedChip.className = "mood-btn" + (activePlaylistFilter === "liked" ? " active" : "");
  likedChip.textContent = "❤️ Liked (" + savedFavorites.length + ")";
  likedChip.onclick = function(){ activePlaylistFilter = "liked"; renderLibrary(); };
  tabsBar.appendChild(likedChip);

  var folders = Object.keys(customPlaylists);
  folders.forEach(function(f){
   var chip = document.createElement("button");
   chip.className = "mood-btn" + (activePlaylistFilter === f ? " active" : "");
   chip.textContent = "📁 " + f + " (" + customPlaylists[f].length + ")";
   chip.onclick = function(){ activePlaylistFilter = f; renderLibrary(); };
   tabsBar.appendChild(chip);
  });

  var box = document.getElementById("libraryList");
  var emptyMsg = document.getElementById("emptyLibrary");
  box.innerHTML = "";
  var count = 0;

  var targetList = activePlaylistFilter === "liked" ? savedFavorites : (customPlaylists[activePlaylistFilter] || []);
  tracks.forEach(function(t, i){
   if(targetList.indexOf(t.name) !== -1){
    count++;
    box.appendChild(createCardElement(t, i));
   }
  });
  emptyMsg.style.display = count === 0 ? "block" : "none";
 }

 fetch("songs.json?v=" + Date.now())
  .then(function(r){ return r.json(); })
  .then(function(data){
   if(Array.isArray(data) && data.length > 0){
    tracks = data;
    renderSongs();
    loadTrackUI(0);
   }
  })
  .catch(function(){ renderSongs(); });

 renderSongs();

 function loadTrackUI(i){
  index = i;
  audio.src = tracks[index].file;
  document.getElementById("songName").textContent = tracks[index].name;
  coverBox.innerHTML = tracks[index].cover ? '<img src="' + tracks[index].cover + '" alt="' + tracks[index].name + '">' : "🎵";
  playerDownload.href = tracks[index].file;
  playerDownload.download = tracks[index].name + " - R LOFI 01.mp3";

  document.getElementById("miniTitle").textContent = tracks[index].name;
  if(tracks[index].cover) document.getElementById("miniCover").src = tracks[index].cover;
  updateFavButtonUI();
 }

 function setPlayingState(isPlaying){
  playBtn.textContent = isPlaying ? "Ⅱ" : "▶";
  miniPlayBtn.textContent = isPlaying ? "Ⅱ" : "▶";
  playerBox.classList.toggle("playing", isPlaying);
 }

 function playSong(i){
  loadTrackUI(i);
  trackPlay();
  document.getElementById("miniPlayer").style.display = "flex";
  audio.play().then(function(){ setPlayingState(true); }).catch(function(){
   setPlayingState(false);
   showHinglishHint("⏳ Song load ho raha hai, thodi der baad try karein.");
  });
 }

 document.getElementById("heroListenBtn").onclick = function(){ playSong(0); };

 function togglePlay(){
  if(audio.paused){
   trackPlay();
   document.getElementById("miniPlayer").style.display = "flex";
   audio.play().then(function(){ setPlayingState(true); }).catch(function(){ showHinglishHint("⏳ Song load ho raha hai."); });
  }else{
   audio.pause();
   setPlayingState(false);
  }
 }

 function nextTrack(){
  if(isShuffle && tracks.length > 1){
   var rand = Math.floor(Math.random() * tracks.length);
   playSong(rand);
  }else{
   playSong((index + 1) % tracks.length);
  }
 }
 function prevTrack(){ playSong((index - 1 + tracks.length) % tracks.length); }

 document.getElementById("shuffleBtn").onclick = function(){
  isShuffle = !isShuffle;
  this.classList.toggle("active-ctrl", isShuffle);
  showHinglishHint(isShuffle ? "🔀 Shuffle On" : "🔀 Shuffle Off");
 };

 document.getElementById("loopBtn").onclick = function(){
  isLoop = !isLoop;
  audio.loop = isLoop;
  this.classList.toggle("active-ctrl", isLoop);
  showHinglishHint(isLoop ? "🔁 Repeat Song On" : "🔁 Repeat Off");
 };

 document.querySelectorAll(".mood-btn").forEach(function(btn){
  btn.onclick = function(){
   currentMood = btn.getAttribute("data-mood");
   document.querySelectorAll(".mood-btn").forEach(function(b){ b.classList.remove("active"); });
   btn.classList.add("active");
   renderSongs();
  };
 });

 function shareSong(songTitle){
  var shareText = '🎧 Listen & Download "' + songTitle + '" by R LOFI 01:\nhttps://rlofi01-glitch.github.io/';
  if(navigator.share){
   navigator.share({title: songTitle + " - R LOFI 01", text: shareText, url: "https://rlofi01-glitch.github.io/"}).catch(function(){});
  }else{
   window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(shareText), "_blank");
  }
 }

 document.getElementById("fpShareBtn").onclick = function(){ shareSong(tracks[index].name); };

 var sleepInterval = null;
 var sleepSecondsLeft = 0;

 document.getElementById("sleepBtn").onclick = function(){
  var menu = document.getElementById("sleepMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
 };

 document.querySelectorAll(".sleep-opt").forEach(function(opt){
  opt.onclick = function(){
   var mins = parseInt(opt.getAttribute("data-mins"), 10);
   clearInterval(sleepInterval);
   document.getElementById("sleepMenu").style.display = "none";
   var btn = document.getElementById("sleepBtn");

   if(mins === 0){
    sleepSecondsLeft = 0;
    btn.textContent = "🌙 Sleep";
    showHinglishHint("🌙 Sleep Timer off kar diya gaya");
    return;
   }

   sleepSecondsLeft = mins * 60;
   showHinglishHint("🌙 Sleep Timer set: " + mins + " minutes");
   var initialVol = parseFloat(document.getElementById("volume").value) || 0.8;

   sleepInterval = setInterval(function(){
    sleepSecondsLeft--;
    var m = Math.floor(sleepSecondsLeft / 60);
    var s = String(sleepSecondsLeft % 60).padStart(2, "0");
    btn.textContent = "🌙 " + m + ":" + s;

    if(sleepSecondsLeft <= 10 && sleepSecondsLeft > 0){
     audio.volume = Math.max(0.05, initialVol * (sleepSecondsLeft / 10));
    }

    if(sleepSecondsLeft <= 0){
     clearInterval(sleepInterval);
     audio.pause();
     audio.volume = initialVol;
     setPlayingState(false);
     btn.textContent = "🌙 Sleep";
     showHinglishHint("😴 Sleep Timer khatam — Music band ho gaya");
    }
   }, 1000);
  };
 });

 playBtn.onclick = togglePlay;
 miniPlayBtn.onclick = togglePlay;
 document.getElementById("miniNextBtn").onclick = nextTrack;
 document.getElementById("prev").onclick = prevTrack;
 document.getElementById("next").onclick = nextTrack;
 audio.onended = function(){ if(!isLoop) nextTrack(); };

 audio.ontimeupdate = function(){
  if(audio.duration){
   document.getElementById("seek").value = (audio.currentTime / audio.duration) * 100;
   document.getElementById("current").textContent = formatTime(audio.currentTime);
  }
 };
 audio.onloadedmetadata = function(){ document.getElementById("duration").textContent = formatTime(audio.duration); };
 document.getElementById("seek").oninput = function(e){ if(audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration; };
 document.getElementById("volume").oninput = function(e){ audio.volume = e.target.value; };

 function formatTime(t){
  if(!isFinite(t)) return "0:00";
  return Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
 }
 audio.volume = 0.8;
});
 
