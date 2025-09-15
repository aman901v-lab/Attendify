// ======================
// Firebase Config
// ======================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ======================
// Social Login Handlers
// ======================
function socialLogin(provider) {
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      console.log("✅ Social Login Success:", user);

      // Check if profile exists
      db.collection("users").doc(user.uid).get().then(doc => {
        if (doc.exists) {
          // Already profile created
          localStorage.setItem("loggedIn", "true");
          window.location.href = "index.html";
        } else {
          // New user → profile setup required
          window.location.href = "profile.html";
        }
      });
    })
    .catch(error => {
      console.error("❌ Login Error:", error);
      alert("Login failed: " + error.message);
    });
}

// Google
document.getElementById("google-login").addEventListener("click", () => {
  socialLogin(new firebase.auth.GoogleAuthProvider());
});

// Facebook
document.getElementById("facebook-login").addEventListener("click", () => {
  socialLogin(new firebase.auth.FacebookAuthProvider());
});

// Apple (Custom OAuth)
document.getElementById("apple-login").addEventListener("click", () => {
  alert("Apple login setup required in Firebase Console");
});

// Phone (Redirect to Firebase Phone Auth flow)
document.getElementById("phone-login").addEventListener("click", () => {
  alert("Phone login setup required in Firebase Console");
});

// Email (Signup/Login with Firebase Email Auth)
document.getElementById("email-login").addEventListener("click", () => {
  let email = prompt("Enter Email:");
  let password = prompt("Enter Password:");
  if (email && password) {
    auth.signInWithEmailAndPassword(email, password)
      .then(res => {
        window.location.href = "index.html";
      })
      .catch(() => {
        // If user not found, create new
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => window.location.href = "profile.html")
          .catch(err => alert(err.message));
      });
  }
});
