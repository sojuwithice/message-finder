// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDZfHMiQEHJ99MWXTSTGLJmjqjbcuY3M2Q",
  authDomain: "message-finder-80d79.firebaseapp.com",
  projectId: "message-finder-80d79",
  storageBucket: "message-finder-80d79.appspot.com",
  messagingSenderId: "113221971450",
  appId: "1:113221971450:web:4af8ad0c02dc4bdff84843",
  measurementId: "G-7EY22TSCHJ"
};

// Prevent double init
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".btn");
  const inputs = document.querySelectorAll(".input");
  if (!btn) return;

  let errorMsg = document.querySelector(".error-msg");
  if (!errorMsg) {
    errorMsg = document.createElement("div");
    errorMsg.className = "error-msg";
    errorMsg.style.color = "red";
    errorMsg.style.fontSize = "14px";
    errorMsg.style.marginTop = "6px";
    btn.after(errorMsg);
  }

  // toggle password
  document.querySelectorAll(".toggle-password").forEach((btn) => {
  const input = btn.previousElementSibling;
  const slash = btn.querySelector(".eye-slash");

  btn.addEventListener("click", () => {
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      slash.style.display = "none";  
    } else {
      input.type = "password";
      slash.style.display = "block"; 
    }
  });
});


  const page = window.location.pathname;
  const isSignup = page.includes("signup.html");
  const isLogin = page.includes("login.html");

  btn.addEventListener("click", async () => {
    errorMsg.textContent = "";

    try {
      //Signup
      if (isSignup) {
        const firstName = inputs[0].value.trim();
        const lastName = inputs[1].value.trim();
        const email = inputs[2].value.trim();
        const password = inputs[3].value.trim();
        const confirmPassword = inputs[4].value.trim();

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
          errorMsg.textContent = "Please fill in all fields.";
          return;
        }

        if (password !== confirmPassword) {
          errorMsg.textContent = "Passwords do not match.";
          return;
        }

        btn.disabled = true;
        btn.textContent = "Signing up...";

        const cred = await auth.createUserWithEmailAndPassword(email, password);

        await db.collection("users").doc(cred.user.uid).set({
          firstName,
          lastName,
          email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.location.href = "login.html";
      }

      // Login
      if (isLogin) {
        const email = inputs[0].value.trim();
        const password = inputs[1].value.trim();

        if (!email || !password) {
          errorMsg.textContent = "Please fill in all fields.";
          return;
        }

        btn.disabled = true;
        btn.textContent = "Logging in...";

        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = "sender-dashboard.html";
      }
    } catch (error) {
    console.error(error);

    
    if (error.code === "auth/invalid-login-credentials" || error.code === "auth/wrong-password") {
      errorMsg.textContent = "Incorrect email or password.";
    } else if (error.code === "auth/email-already-in-use") {
      errorMsg.textContent = "This email is already registered. Please try logging in."; 
    } else {
      errorMsg.textContent = "An error occurred. Please try again.";
    }

    btn.disabled = false;
    btn.textContent = isSignup ? "SIGN UP" : "LOGIN";
  }

  });
});
