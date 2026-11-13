const form = document.getElementById("song-form");
const songsInput = document.getElementById("songs");
const nameInput = document.getElementById("guest-name");
const songList = document.getElementById("song-list");
const songCount = document.getElementById("song-count");
const feedback = document.getElementById("feedback");
const adminToggle = document.getElementById("admin-toggle"); 

const STORAGE_KEY = "our-night-song-requests";
const ADMIN_PASS = "13579Admin";

let songRequests = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let isAdmin = sessionStorage.getItem("is-admin") === "true"; // التحقق من حالة الأدمن

// تحديث شكل ونص زر الأدمن
function updateAdminUI() {
  if (!adminToggle) return;
  adminToggle.textContent = isAdmin ? "Exit Admin Mode" : "Admin Login";
}

// التحكم في الدخول والخروج من وضع الأدمن
if (adminToggle) {
  adminToggle.addEventListener("click", () => {
    if (isAdmin) {
      isAdmin = false;
      sessionStorage.removeItem("is-admin");
      feedback.textContent = "Admin mode disabled.";
    } else {
      const pass = window.prompt("Enter admin password:");
      if (pass === ADMIN_PASS) {
        isAdmin = true;
        sessionStorage.setItem("is-admin", "true");
        feedback.textContent = "Admin mode enabled.";
      } else if (pass !== null) {
        alert("Wrong password!");
        return;
      }
    }
    updateAdminUI();
    renderSongs(); // إعادة رسم القائمة لإظهار أو إخفاء أزرار الحذف
  });
}

function saveSongs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songRequests));
}

function renderSongs() {
  songList.innerHTML = "";
  songCount.textContent = `${songRequests.length} ${songRequests.length === 1 ? "song" : "songs"}`;

  if (songRequests.length === 0) {
    songList.innerHTML = '<p class="empty-state">No songs yet. Be the first! ♡</p>';
    return;
  }

  songRequests.forEach((request, index) => {
    const item = document.createElement("article");
    item.className = "song-item";

    const number = document.createElement("div");
    number.className = "song-number";
    number.textContent = String(index + 1);

    const info = document.createElement("div");
    info.className = "song-info";

    const title = document.createElement("div");
    title.className = "song-title";
    title.textContent = request.song;

    const requester = document.createElement("div");
    requester.className = "song-requester";
    requester.textContent = request.name ? `Requested by ${request.name}` : "Guest request";

    const link = document.createElement("a");
    link.className = "spotify-link";
    link.href = `https://open.spotify.com/search/${encodeURIComponent(request.song)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Find on Spotify ↗";

    const actions = document.createElement("div");
    actions.className = "song-actions";
    actions.append(link);

    // إضافة زر الحذف فقط في حالة تفعيل وضع الأدمن
    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", `Remove ${request.song}`);
      deleteButton.title = "Remove song";
      deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(`Remove "${request.song}" from your song list?`);
        if (!confirmed) return;

        songRequests.splice(index, 1);
        saveSongs();
        renderSongs();
        feedback.textContent = "Song removed from your list.";
        if (typeof showToast === "function") {
          showToast("Song removed", `"${request.song}" has been removed from your list.`);
        }
      });

      actions.append(deleteButton);
    }

    info.append(title, requester);
    item.append(number, info, actions);
    songList.appendChild(item);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const songs = songsInput.value
    .split("\n")
    .map(song => song.trim())
    .filter(Boolean);

  if (songs.length === 0) {
    feedback.textContent = "Please enter at least one song.";
    return;
  }

  const name = nameInput.value.trim();
  const newRequests = songs.map(song => ({
    song,
    name,
    addedAt: new Date().toISOString()
  }));

  songRequests = [...songRequests, ...newRequests];
  saveSongs();
  renderSongs();

  songsInput.value = "";
  feedback.textContent = `${newRequests.length} ${newRequests.length === 1 ? "song" : "songs"} added to the list.`;
});

updateAdminUI();
renderSongs();
