// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDZfHMiQEHJ99MWXTSTGLJmjqjbcuY3M2Q",
  authDomain: "message-finder-80d79.firebaseapp.com",
  projectId: "message-finder-80d79",
  storageBucket: "message-finder-80d79.appspot.com",
  messagingSenderId: "113221971450",
  appId: "1:113221971450:web:4af8ad0c02dc4bdff84843"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const messagesList = document.querySelector(".messages");

  const previewModal = document.querySelector(".preview-modal");
  const previewHeader = document.getElementById("preview-header");
  const previewContent = document.getElementById("preview-content");
  const deleteBtn = previewModal.querySelector(".delete-btn");
  const closePreviewBtn = previewModal.querySelector(".close-preview-btn");

  const overlay = document.querySelector(".overlay");

  let selectedMessageId = null;
  let senderFirstName = "User";

  // Auth
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const snap = await db.collection("users").doc(user.uid).get();
    if (snap.exists) {
      senderFirstName = snap.data().firstName || "User";
      document.getElementById("user-name").textContent = senderFirstName;
    }

    loadMessages(senderFirstName);
  });

  // Load Messages
  async function loadMessages(senderName) {
    messagesList.innerHTML = "";

    const snap = await db
  .collection("messages")
  .where("from", "==", senderName)
  .get();


    if (snap.empty) {
      messagesList.innerHTML = `
        <p style="color:#888;padding:10px;">No messages yet.</p>
      `;
      return;
    }

    snap.forEach((doc) => {
  const msg = doc.data();
  console.log("MESSAGE LOADED:", doc.id, msg);


      const item = document.createElement("div");
      item.className = "message-item";
      item.dataset.id = doc.id;

      item.innerHTML = `
        <div class="message-main">
          <span class="name">To: ${msg.to || "Unknown"}</span>
          <span class="preview">${msg.message || ""}</span>
        </div>
        <div class="replies-container"></div>
      `;

      messagesList.appendChild(item);

      const repliesContainer = item.querySelector(".replies-container");

      // Real-time replies
      db.collection("replies")
  .where("messageId", "==", doc.id)
  .onSnapshot((snapshot) => {

    console.log("REPLIES SNAPSHOT for", doc.id, snapshot.size);

    repliesContainer.innerHTML = "";

    if (snapshot.empty) {
      repliesContainer.innerHTML =
        `<div class="no-replies">No replies yet</div>`;
      return;
    }

    snapshot.forEach((replyDoc) => {
      const reply = replyDoc.data();
      console.log("REPLY DATA:", reply);

      const replyDiv = document.createElement("div");
      replyDiv.className = "reply-item";
      replyDiv.innerHTML = `
        <strong>${reply.from}</strong>: ${reply.message}
      `;

      repliesContainer.appendChild(replyDiv);
    });
  });


    });
  }

  // Open Preview
messagesList.addEventListener("click", (e) => {
  const item = e.target.closest(".message-item");
  if (!item) return;

  selectedMessageId = item.dataset.id;

  previewHeader.textContent =
    item.querySelector(".name").textContent;

  previewContent.value =
    item.querySelector(".preview").textContent;

  previewModal.classList.remove("hidden");
  previewModal.classList.add("active");

  overlay.classList.remove("hidden");
  overlay.classList.add("active");

  loadPreviewReplies(selectedMessageId);
});



  // Close Preview
  closePreviewBtn.addEventListener("click", closePreview);
  overlay.addEventListener("click", closePreview);

  function closePreview() {
    previewModal.classList.remove("active");
    previewModal.classList.add("hidden");

    overlay.classList.remove("active");
    overlay.classList.add("hidden");
  }

  // Delete Message
  deleteBtn.addEventListener("click", async () => {
    if (!selectedMessageId) return;
    if (!confirm("Delete this message?")) return;

    await db.collection("messages").doc(selectedMessageId).delete();

    closePreview();
    selectedMessageId = null;
    loadMessages(senderFirstName);
  });

  function loadPreviewReplies(messageId) {
  const previewReplies = document.querySelector(".preview-replies");
  previewReplies.innerHTML = "";

  db.collection("replies")
    .where("messageId", "==", messageId)
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      previewReplies.innerHTML = "";

      if (snapshot.empty) {
        previewReplies.innerHTML =
          `<div class="no-replies">No replies yet</div>`;
        return;
      }

      snapshot.forEach((doc) => {
        const reply = doc.data();

        const div = document.createElement("div");
        div.className = "preview-reply-item";
        div.innerHTML = `
          <strong>${reply.from}</strong>: ${reply.message}
        `;

        previewReplies.appendChild(div);
      });
    });
}

});
