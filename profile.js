const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById("continue-social").addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) return alert("No user found!");

  db.collection("users").doc(user.uid).set({
    fullName: document.getElementById("fullname").value,
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    email: user.email || "",
    socialLogin: true,
    username: "",
    password: ""
  }).then(() => {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
  });
});

document.getElementById("save-profile").addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) return alert("No user found!");

  let username = document.getElementById("username").value;
  let password = document.getElementById("newPassword").value;

  if (!username || !password) {
    return alert("Please set both username and password!");
  }

  db.collection("users").doc(user.uid).set({
    fullName: document.getElementById("fullname").value,
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    email: user.email || "",
    socialLogin: true,
    username,
    password
  }).then(() => {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
  });
});
