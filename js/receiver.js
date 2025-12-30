import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyDZfHMiQEHJ99MWXTSTGLJmjqjbcuY3M2Q",
  authDomain: "message-finder-80d79.firebaseapp.com",
  projectId: "message-finder-80d79",
  storageBucket: "message-finder-80d79.appspot.com",
  messagingSenderId: "113221971450",
  appId: "1:113221971450:web:4af8ad0c02dc4bdff84843"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM ELEMENTS */
const searchBtn = document.querySelector(".search-btn");
const nameInput = document.querySelector(".input");
const resultText = document.querySelector(".result-text");

const foundModal = document.querySelector(".found-modal");
const openBtn = document.querySelector(".open-btn");

const previewModal = document.querySelector(".preview-modal");
const previewHeader = document.getElementById("preview-header");
const previewContent = document.getElementById("preview-content");
const closePreviewBtn = previewModal.querySelector(".close-preview-btn");

const prevBtn = previewModal.querySelector(".prev-btn");
const nextBtn = previewModal.querySelector(".next-btn");
const counter = document.getElementById("message-counter");

const composeModal = document.querySelector(".compose-modal");
const toInput = document.getElementById("toInput");
const messageText = document.getElementById("messageText");

const confirmModal = document.querySelector(".confirm-modal");
const cancelBtn = document.querySelector(".cancel-btn");
const confirmSendBtn = document.querySelector(".confirm-send-btn");

const sentSuccessModal = document.querySelector(".success-modal");
const overlay = document.querySelector(".overlay");

const replyBtn = previewModal.querySelector(".delete-btn");

/* STATE */
let currentMessage = null;
let messages = [];
let currentIndex = 0;

/* Show/Hide Modal Helper Functions */
const show = modal => modal.classList.add("active");
const hide = modal => modal.classList.remove("active");

function openOverlay() {
  overlay.classList.remove("hidden");
  overlay.classList.add("active");
}

function closeOverlay() {
  overlay.classList.remove("active");
  overlay.classList.add("hidden");
}

/* SHOW MESSAGE */
function showMessage(index) {
  const msg = messages[index];
  if (!msg) return;

  currentMessage = msg;

  previewHeader.textContent = `From: ${msg.from}`;
  previewContent.value = msg.message || "";

  // --- AUTO RESIZE TEXTAREA ---
  previewContent.style.height = "150px"; 
  previewContent.style.height = previewContent.scrollHeight + "px";

  if (counter) {
    counter.textContent = `${index + 1} / ${messages.length}`;
  }

  if (prevBtn) prevBtn.disabled = index === 0;
  if (nextBtn) nextBtn.disabled = index === messages.length - 1;
}


/* Search Message */
searchBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim().toLowerCase();
  resultText.textContent = "Searching... ⋆˚✿˖°";

  if (!name) {
    resultText.textContent = "Please enter your first name ˙𐃷˙";
    return;
  }

  try {
    const q = query(collection(db, "messages"), where("to_lower", "==", name));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      currentIndex = 0;
      currentMessage = messages[0];

      show(foundModal);
      openOverlay();
      resultText.textContent = "";
    } else {
      const noMessageModal = document.createElement("div");
      noMessageModal.className = "modal found-modal active";
      noMessageModal.innerHTML = `
        <div class="confirm-box">
          <p>Oh no! Waley pa message for you hehe (ᵕ—ᴗ—)</p>
          <div class="confirm-actions">
            <button class="okay-btn">Okay :(</button>
          </div>
        </div>
      `;
      document.body.appendChild(noMessageModal);

      noMessageModal.querySelector(".okay-btn").onclick = () => {
        hide(noMessageModal);
        noMessageModal.remove();
        closeOverlay();
        nameInput.value = "";
        resultText.textContent = "";
      };
    }
  } catch (err) {
    console.error(err);
    resultText.textContent = "Something went wrong ";
  }
});

/* Open Message */
openBtn.addEventListener("click", () => {
  if (!currentMessage) return;

  hide(foundModal);
  showMessage(currentIndex);
  show(previewModal);
  openOverlay();
});

/* Prev / Next */
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentIndex < messages.length - 1) {
      currentIndex++;
      showMessage(currentIndex);
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      showMessage(currentIndex);
    }
  });
}

/* Close Preview */
function closePreview() {
  hide(previewModal);
  closeOverlay();
}

closePreviewBtn.addEventListener("click", closePreview);
overlay.addEventListener("click", closePreview);

/* Reply */
replyBtn.textContent = "Reply";
replyBtn.addEventListener("click", () => {
  if (!currentMessage) return;

  hide(previewModal);
  closeOverlay();

  toInput.value = currentMessage.from;
  toInput.readOnly = true;
  messageText.value = "";

  show(composeModal);
  openOverlay();
});

/* Send Flow */
composeModal.querySelector(".send-btn").addEventListener("click", () => {
  if (!toInput.value.trim() || !messageText.value.trim()) return;

  hide(composeModal);
  show(confirmModal);
});

/* Cancel Send */
cancelBtn.addEventListener("click", () => {
  hide(confirmModal);
  show(composeModal);
});

/* Confirm Send */
confirmSendBtn.addEventListener("click", async () => {
  try {
    await addDoc(collection(db, "replies"), {
      messageId: currentMessage.id,
      from: nameInput.value.trim(),
      from_lower: nameInput.value.trim().toLowerCase(),
      to: toInput.value.trim(),
      to_lower: toInput.value.trim().toLowerCase(),
      message: messageText.value.trim(),
      createdAt: serverTimestamp()
    });

    hide(confirmModal);
    show(sentSuccessModal);

    setTimeout(() => {
      hide(sentSuccessModal);
      showMessage(currentIndex);
      show(previewModal);
      openOverlay();
    }, 600);

    messageText.value = "";
    toInput.value = "";
    toInput.readOnly = false;

  } catch (err) {
    console.error(err);
    resultText.textContent = "Failed to send message ";
  }
});
