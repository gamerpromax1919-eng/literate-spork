const youtubeKey = "youtube_links_v2";

const youtubeForm = document.getElementById("youtube-form");
const ytTitleInput = document.getElementById("yt-title");
const ytUrlInput = document.getElementById("yt-url");

const videoPicker = document.getElementById("video-picker");
const musicPicker = document.getElementById("music-picker");

const searchInput = document.getElementById("search-input");
const libraryList = document.getElementById("library-list");
const playerShell = document.getElementById("player-shell");
const nowPlayingTitle = document.getElementById("now-playing-title");

let currentFilter = "all";
let currentSearch = "";
let mediaRecords = [];
let youtubeRecords = [];

function getStoredJSON(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStoredJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeYoutubeUrl(url) {
  const regex = /(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{6,})/;
  const match = url.match(regex);
  if (!match) {
    return null;
  }

  return `https://www.youtube.com/embed/${match[1]}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("offline_media_hub", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMediaFiles(files, type) {
  const db = await openDb();
  const tx = db.transaction("media", "readwrite");
  const store = tx.objectStore("media");
  files.forEach((file) => store.add({ name: file.name, mime: file.type, type, blob: file }));

  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

async function readAllMedia() {
  const db = await openDb();
  const tx = db.transaction("media", "readonly");
  const request = tx.objectStore("media").getAll();

  const rows = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return rows;
}

async function removeMedia(id) {
  const db = await openDb();
  const tx = db.transaction("media", "readwrite");
  tx.objectStore("media").delete(id);
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function getCombinedLibrary() {
  const localItems = mediaRecords.map((record) => ({
    id: `local-${record.id}`,
    title: record.name,
    sourceType: record.type,
    kind: "local",
    blob: record.blob,
    mediaId: record.id
  }));

  const ytItems = youtubeRecords.map((record, index) => ({
    id: `yt-${index}`,
    title: record.title,
    sourceType: "youtube",
    kind: "youtube",
    url: record.url,
    index
  }));

  return [...ytItems, ...localItems];
}

function filterLibrary(items) {
  return items.filter((item) => {
    const matchesFilter = currentFilter === "all" || item.sourceType === currentFilter;
    const matchesSearch = item.title.toLowerCase().includes(currentSearch);
    return matchesFilter && matchesSearch;
  });
}

function playItem(item) {
  nowPlayingTitle.textContent = `${item.title} · ${item.sourceType}`;
  playerShell.innerHTML = "";

  if (item.kind === "youtube") {
    const embed = normalizeYoutubeUrl(item.url);
    if (!embed) {
      playerShell.innerHTML = `<p class="note">Cannot play this YouTube URL. Try a full watch URL or youtu.be link.</p>`;
      return;
    }

    const frame = document.createElement("iframe");
    frame.src = embed;
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    frame.allowFullscreen = true;
    playerShell.appendChild(frame);
    return;
  }

  const sourceUrl = URL.createObjectURL(item.blob);
  const player = document.createElement(item.sourceType === "video" ? "video" : "audio");
  player.controls = true;
  player.autoplay = true;
  player.src = sourceUrl;
  playerShell.appendChild(player);
}

function getTypeLabel(type) {
  if (type === "audio") return "Music";
  if (type === "video") return "Video";
  return "YouTube Video";
}

async function handleDelete(item) {
  if (item.kind === "youtube") {
    youtubeRecords.splice(item.index, 1);
    setStoredJSON(youtubeKey, youtubeRecords);
  } else {
    await removeMedia(item.mediaId);
    mediaRecords = await readAllMedia();
  }

  renderLibrary();
}

function renderLibrary() {
  const items = filterLibrary(getCombinedLibrary());
  libraryList.innerHTML = "";

  if (!items.length) {
    libraryList.innerHTML = `<li class="library-item"><span class="note">No results. Add songs/videos or YouTube links.</span></li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "library-item";

    li.innerHTML = `
      <div class="item-row">
        <div class="item-meta">
          <div class="item-title">${item.title}</div>
          <div class="item-type">${getTypeLabel(item.sourceType)}</div>
        </div>
        <div class="item-actions">
          <button type="button" data-action="play">Play</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      </div>
    `;

    li.querySelector('[data-action="play"]').addEventListener("click", () => playItem(item));
    li.querySelector('[data-action="delete"]').addEventListener("click", () => handleDelete(item));

    libraryList.appendChild(li);
  });
}

youtubeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = ytTitleInput.value.trim();
  const url = ytUrlInput.value.trim();
  if (!title || !url) {
    return;
  }

  youtubeRecords.push({ title, url });
  setStoredJSON(youtubeKey, youtubeRecords);
  ytTitleInput.value = "";
  ytUrlInput.value = "";
  renderLibrary();
});

videoPicker.addEventListener("change", async () => {
  if (!videoPicker.files?.length) {
    return;
  }

  await saveMediaFiles(Array.from(videoPicker.files), "video");
  videoPicker.value = "";
  mediaRecords = await readAllMedia();
  renderLibrary();
});

musicPicker.addEventListener("change", async () => {
  if (!musicPicker.files?.length) {
    return;
  }

  await saveMediaFiles(Array.from(musicPicker.files), "audio");
  musicPicker.value = "";
  mediaRecords = await readAllMedia();
  renderLibrary();
});

searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.trim().toLowerCase();
  renderLibrary();
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    renderLibrary();
  });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

async function init() {
  youtubeRecords = getStoredJSON(youtubeKey);
  mediaRecords = await readAllMedia();
  renderLibrary();
}

init();
