const chatKey = "chat_messages_v1";
const youtubeKey = "youtube_links_v1";

const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const youtubeForm = document.getElementById("youtube-form");
const ytTitleInput = document.getElementById("yt-title");
const ytUrlInput = document.getElementById("yt-url");
const youtubeList = document.getElementById("youtube-list");

const videoPicker = document.getElementById("video-picker");
const musicPicker = document.getElementById("music-picker");
const videoList = document.getElementById("video-list");
const musicList = document.getElementById("music-list");

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

function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  msg.textContent = `${role === "user" ? "You" : "Assistant"}: ${text}`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function buildBotReply(input) {
  const lower = input.toLowerCase();
  if (lower.includes("playlist")) {
    return "Try making a mood playlist: focus, workout, chill, and travel tracks.";
  }
  if (lower.includes("offline") || lower.includes("download")) {
    return "For offline use, add your legal local video/audio files below so they are saved on your device.";
  }
  if (lower.includes("youtube")) {
    return "Save YouTube links in the planner section, then open them when online.";
  }
  return "Got it. I can help you organize chat notes, watch-later links, and local media.";
}

function loadChat() {
  const items = getStoredJSON(chatKey);
  if (!items.length) {
    addMessage("bot", "Hi! Ask me about music, offline watching, or organizing links.");
    return;
  }

  items.forEach((entry) => addMessage(entry.role, entry.text));
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) {
    return;
  }

  const bot = buildBotReply(text);
  addMessage("user", text);
  addMessage("bot", bot);

  const chatItems = [...getStoredJSON(chatKey), { role: "user", text }, { role: "bot", text: bot }];
  setStoredJSON(chatKey, chatItems);
  chatInput.value = "";
});

function renderYoutube() {
  const links = getStoredJSON(youtubeKey);
  youtubeList.innerHTML = "";

  links.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.title}</strong><br /><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a>`;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      const updated = getStoredJSON(youtubeKey);
      updated.splice(index, 1);
      setStoredJSON(youtubeKey, updated);
      renderYoutube();
    });

    li.appendChild(removeButton);
    youtubeList.appendChild(li);
  });
}

youtubeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = ytTitleInput.value.trim();
  const url = ytUrlInput.value.trim();
  if (!title || !url) {
    return;
  }

  const links = getStoredJSON(youtubeKey);
  links.push({ title, url });
  setStoredJSON(youtubeKey, links);

  ytTitleInput.value = "";
  ytUrlInput.value = "";
  renderYoutube();
});

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
  const store = tx.objectStore("media");
  const request = store.getAll();

  const records = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return records;
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

async function renderMedia() {
  const records = await readAllMedia();
  videoList.innerHTML = "";
  musicList.innerHTML = "";

  records.forEach((record) => {
    const container = document.createElement("div");
    container.className = "media-item";

    const title = document.createElement("div");
    title.textContent = record.name;
    container.appendChild(title);

    const sourceUrl = URL.createObjectURL(record.blob);
    const player = document.createElement(record.type === "video" ? "video" : "audio");
    player.controls = true;
    player.src = sourceUrl;
    container.appendChild(player);

    const actions = document.createElement("div");
    actions.className = "media-actions";

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      await removeMedia(record.id);
      renderMedia();
    });

    actions.appendChild(remove);
    container.appendChild(actions);

    if (record.type === "video") {
      videoList.appendChild(container);
    } else {
      musicList.appendChild(container);
    }
  });
}

videoPicker.addEventListener("change", async () => {
  if (!videoPicker.files?.length) {
    return;
  }
  await saveMediaFiles(Array.from(videoPicker.files), "video");
  videoPicker.value = "";
  await renderMedia();
});

musicPicker.addEventListener("change", async () => {
  if (!musicPicker.files?.length) {
    return;
  }
  await saveMediaFiles(Array.from(musicPicker.files), "audio");
  musicPicker.value = "";
  await renderMedia();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

loadChat();
renderYoutube();
renderMedia();
