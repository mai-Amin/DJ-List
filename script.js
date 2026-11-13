// استيراد الدوال الحديثة من مكتبة Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addTimestamp, // غير مستخدمة مباشرة لكن كمرجع
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// إعدادات Firebase الخاصة بكِ
const firebaseConfig = {
  apiKey: "AIzaSyCJJQbfPe1H9R-x16_4NJ1YOZ2mo2iXY2A",
  authDomain: "dj-list-8f546.firebaseapp.com",
  projectId: "dj-list-8f546",
  storageBucket: "dj-list-8f546.firebasestorage.app",
  messagingSenderId: "421085765811",
  appId: "1:421085765811:web:f288a41239ea27dc11d0c6",
  measurementId: "G-YN1KPY8DF2"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // ربط قاعدة البيانات

const form = document.getElementById("song-form");
const songsInput = document.getElementById("songs");
const nameInput = document.getElementById("guest-name");
const songList = document.getElementById("song-list");
const songCount = document.getElementById("song-count");
const feedback = document.getElementById("feedback");

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toast-icon");
const toastTitle = document.getElementById("toast-title");
const toastMessage = document.getElementById("toast-message");
const toastClose = document.getElementById("toast-close");
const adminToggle = document.getElementById("admin-toggle");

// عناصر نافذة تسجيل دخول الأدمن
const adminModal = document.getElementById("admin-modal");
const adminPasswordInput = document.getElementById("admin-password-input");
const adminConfirmBtn = document.getElementById("admin-confirm-btn");
const adminCancelBtn = document.getElementById("admin-cancel-btn");

// عناصر نافذة تأكيد الحذف
const deleteModal = document.getElementById("delete-modal");
const deleteModalDesc = document.getElementById("delete-modal-desc");
const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");

const ADMIN_PASS = "1234"; // كلمة مرور الأدمن
let songRequests = [];
let isAdmin = sessionStorage.getItem("is-admin") === "true";
let toastTimer;

function updateAdminUI() {
  if (!adminToggle) return;
  if (isAdmin) {
    adminToggle.textContent = "Exit Admin 🔓";
    adminToggle.classList.add("admin-active");
  } else {
    adminToggle.textContent = "Admin Login 🔒";
    adminToggle.classList.remove("admin-active");
  }
}

if (adminToggle) {
  adminToggle.addEventListener("click", () => {
    if (isAdmin) {
      isAdmin = false;
      sessionStorage.removeItem("is-admin");
      feedback.textContent = "Admin mode disabled.";
      showToast("Admin Mode", "You have logged out of admin mode.", true);
      updateAdminUI();
      renderSongs();
    } else {
      adminPasswordInput.value = "";
      adminModal.classList.add("show");
      setTimeout(() => adminPasswordInput.focus(), 50);
    }
  });
}

adminCancelBtn.addEventListener("click", () => {
  adminModal.classList.remove("show");
});

adminConfirmBtn.addEventListener("click", () => {
  const pass = adminPasswordInput.value;
  adminModal.classList.remove("show");

  if (pass === ADMIN_PASS) {
    isAdmin = true;
    sessionStorage.setItem("is-admin", "true");
    feedback.textContent = "Admin mode enabled.";
    showToast("Admin Mode", "Welcome back, Admin!");
    updateAdminUI();
    renderSongs();
  } else {
    showToast("Access Denied", "Incorrect password entered.", true);
  }
});

adminPasswordInput.onkeydown = (e) => {
  if (e.key === "Enter") {
    adminConfirmBtn.click();
  }
};

function normalizeSong(song) {
  return song.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function showToast(title, message, isDuplicate = false) {
  clearTimeout(toastTimer);
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toastIcon.textContent = isDuplicate ? "!" : "✓";
  toast.classList.toggle("duplicate", isDuplicate);
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 4500);
}

toastClose.addEventListener("click", () => {
  clearTimeout(toastTimer);
  toast.classList.remove("show");
});

// --- الاستماع للتغييرات لحظياً (Real-time) بالطريقة الحديثة ---
const q = query(collection(db, "songs"), orderBy("addedAt", "asc"));
onSnapshot(q, (snapshot) => {
  songRequests = [];
  snapshot.forEach((doc) => {
    songRequests.push({ id: doc.id, ...doc.data() });
  });
  renderSongs();
});

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

    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", `Remove ${request.song}`);
      deleteButton.title = "Remove song";
      
      deleteButton.addEventListener("click", () => {
        deleteModalDesc.textContent = `Are you sure you want to remove "${request.song}" from the playlist?`;
        deleteModal.classList.add("show");

        const newDeleteBtn = deleteConfirmBtn.cloneNode(true);
        deleteConfirmBtn.parentNode.replaceChild(newDeleteBtn, deleteConfirmBtn);
        const activeDeleteBtn = document.getElementById("delete-confirm-btn");

        activeDeleteBtn.addEventListener("click", async () => {
          deleteModal.classList.remove("show");
          try {
            // الحذف بالطريقة الحديثة
            await deleteDoc(doc(db, "songs", request.id));
            feedback.textContent = "Song removed from the list.";
            showToast("Song removed", `"${request.song}" has been removed from the playlist.`, true);
          } catch (error) {
            console.error("Error removing document: ", error);
          }
        });
      });

      actions.append(deleteButton);
    }

    info.append(title, requester);
    item.append(number, info, actions);
    songList.appendChild(item);
  });
}

deleteCancelBtn.addEventListener("click", () => {
  deleteModal.classList.remove("show");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submittedSongs = songsInput.value
    .split("\n")
    .map(song => song.trim())
    .filter(Boolean);

  if (submittedSongs.length === 0) {
    feedback.textContent = "Please enter at least one song.";
    return;
  }

  const knownSongs = new Set(songRequests.map(request => normalizeSong(request.song)));
  const addedSongs = [];
  const duplicateSongs = [];

  submittedSongs.forEach(song => {
    const key = normalizeSong(song);
    if (knownSongs.has(key)) {
      duplicateSongs.push(song);
    } else {
      knownSongs.add(key);
      addedSongs.push(song);
    }
  });

  const name = nameInput.value.trim();

  if (addedSongs.length > 0) {
    try {
      // الإضافة بالطريقة الحديثة لـ Firebase
      const batchPromises = addedSongs.map(song => {
        return addDoc(collection(db, "songs"), {
          song,
          name,
          addedAt: new Date().toISOString()
        });
      });

      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Error adding documents: ", error);
    }
  }

  songsInput.value = "";

  if (addedSongs.length > 0 && duplicateSongs.length === 0) {
    feedback.textContent = `${addedSongs.length} song(s) added successfully.`;
    showToast(
      "Your songs have been added!",
      `${addedSongs.length} ${addedSongs.length === 1 ? "song is" : "songs are"} now on the playlist.`
    );
  } else if (addedSongs.length > 0 && duplicateSongs.length > 0) {
    feedback.textContent = `${addedSongs.length} added · ${duplicateSongs.length} duplicate(s) skipped.`;
    showToast(
      "Songs added — duplicates skipped",
      `Added ${addedSongs.length}; skipped ${duplicateSongs.length} song(s) already on the list.`,
      true
    );
  } else {
    feedback.textContent = "No new songs added. These songs are already on the list.";
    showToast(
      "These songs are already there",
      "No duplicates were added to the playlist.",
      true
    );
  }
});

updateAdminUI();
