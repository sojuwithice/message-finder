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

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.overlay');

  const composeModal = document.querySelector('.compose-modal');
  const confirmModal = document.querySelector('.confirm-modal');
  const successModal = document.querySelector('.success-modal');
  const previewModal = document.querySelector('.preview-modal');

  const sendBtn = document.querySelector('.send-btn');
  const cancelBtn = document.querySelector('.cancel-btn');
  const confirmSendBtn = document.querySelector('.confirm-send-btn');
  const deleteBtn = document.querySelector('.delete-btn');
  const fab = document.querySelector('.fab');

  const messageText = document.getElementById('messageText');
  const toInput = document.getElementById('toInput');
  const messagesList = document.getElementById('messagesList');

  const previewHeader = document.getElementById('preview-header');
  const previewContent = document.getElementById('preview-content');

  let selectedMessageId = null;

  // ---------- AUTH ----------
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const snap = await db.collection("users").doc(user.uid).get();
    if (snap.exists) {
      document.getElementById("user-name").textContent = snap.data().firstName;
    }

    loadMessages(user.uid);
  });

  // ---------- HELPERS ----------
  const show = (modal) => {
    modal.classList.add('active');
    overlay.classList.add('active');
  };

  const hide = (modal) => {
    modal.classList.remove('active');
    if (![composeModal, confirmModal, successModal, previewModal].some(m => m.classList.contains('active'))) {
      overlay.classList.remove('active');
    }
  };

  // ---------- LOAD MESSAGES ----------
  function loadMessages(uid) {
    db.collection("messages")
      .orderBy("createdAt", "desc")
      .onSnapshot((snap) => {
        messagesList.innerHTML = "";
        snap.forEach(doc => {
          const msg = doc.data();
          if (msg.senderId !== uid) return;

          const div = document.createElement('div');
          div.className = 'message-item';
          div.dataset.id = doc.id;
          div.innerHTML = `
            <span class="name">${msg.toName || "Unknown"}</span>
            <span class="preview">${msg.text}</span>
          `;
          messagesList.appendChild(div);
        });

        if (!messagesList.children.length) {
          messagesList.innerHTML = `<p style="color:#888; padding:10px;">No messages yet.</p>`;
        }
      });
  }

  // ---------- FAB ----------
  fab.addEventListener('click', () => {
    messageText.value = "";
    toInput.value = "";
    show(composeModal);
  });

  // ---------- SEND FLOW ----------
  sendBtn.addEventListener('click', () => {
    if (!messageText.value.trim() || !toInput.value.trim()) return;
    hide(composeModal);
    show(confirmModal);
  });

  cancelBtn.addEventListener('click', () => {
    hide(confirmModal);
    show(composeModal);
  });

  confirmSendBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  const receiverName = toInput.value.trim();

  if (!receiverName || !messageText.value.trim()) return;

  // Get sender's name
  const userSnap = await db.collection("users").doc(user.uid).get();
  const senderName = userSnap.exists ? userSnap.data().firstName : "Unknown";

  await db.collection("messages").add({
    senderId: user.uid,

    // SENDER INFO
    from: senderName,
    from_lower: senderName.toLowerCase(),

    // RECEIVER INFO
    to: receiverName,
    to_lower: receiverName.toLowerCase(),
    toName: receiverName,

    message: messageText.value.trim(),
    text: messageText.value.trim(),

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  toInput.value = "";
  messageText.value = "";

  hide(confirmModal);
  show(successModal);
  setTimeout(() => hide(successModal), 1500);
});



  // ---------- MESSAGE PREVIEW ----------
  messagesList.addEventListener('click', (e) => {
    const item = e.target.closest('.message-item');
    if (!item) return;

    selectedMessageId = item.dataset.id;
    previewHeader.textContent = "To: " + item.querySelector('.name').textContent;
    previewContent.value = item.querySelector('.preview').textContent;

    show(previewModal);
  });

  // ---------- DELETE WITH CONFIRMATION ----------
deleteBtn.addEventListener('click', () => {
  if (!selectedMessageId) return;

  // Create a delete confirmation modal dynamically
  const deleteConfirmModal = document.createElement('div');
  deleteConfirmModal.className = "modal confirm-modal active";
  deleteConfirmModal.innerHTML = `
    <div class="confirm-box">
      <p>Are you sure you want to delete this message?</p>
      <div class="confirm-actions">
        <button class="cancel-delete-btn">Cancel</button>
        <button class="confirm-delete-btn">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(deleteConfirmModal);
  overlay.classList.add('active');

  const cancelDeleteBtn = deleteConfirmModal.querySelector('.cancel-delete-btn');
  const confirmDeleteBtn = deleteConfirmModal.querySelector('.confirm-delete-btn');

  cancelDeleteBtn.addEventListener('click', () => {
    hide(deleteConfirmModal);
    deleteConfirmModal.remove();
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    // Delete the message
    await db.collection("messages").doc(selectedMessageId).delete();

    // Hide preview modal
    hide(previewModal);

    // Hide delete confirmation modal
    hide(deleteConfirmModal);
    deleteConfirmModal.remove();

    // Show success modal with custom text for deletion
    const originalText = successModal.querySelector('p').textContent;
    successModal.querySelector('p').textContent = "Deleted successfully!";
    show(successModal);

    setTimeout(() => {
      hide(successModal);
      // Restore original success text for sending messages
      successModal.querySelector('p').textContent = originalText;
    }, 1500); // auto-close
  });
});

const closePreviewBtn = document.querySelector('.close-preview-btn');

closePreviewBtn.addEventListener('click', () => {
  previewModal.classList.remove('active');
  overlay.classList.remove('active');
});


  // ---------- STOP PROPAGATION INSIDE MODAL ----------
  [composeModal, previewModal].forEach(modal => {
    modal.addEventListener('click', (e) => e.stopPropagation());
  });

  // ---------- OVERLAY ----------
  overlay.addEventListener('click', () => {
    [composeModal, confirmModal, successModal, previewModal].forEach(hide);
    const existingDeleteModal = document.querySelector('.modal.confirm-modal.active');
    if (existingDeleteModal) existingDeleteModal.remove();
  });

  const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', () => {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = 'login.html'; 
    })
    .catch((error) => {
      console.error('Logout error:', error);
    });
});

const closeComposeBtn = document.querySelector('.close-compose-btn');

closeComposeBtn.addEventListener('click', () => {
  composeModal.classList.remove('active');
  overlay.classList.remove('active');
});

});
