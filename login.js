// login.js - multi-user demo

if (localStorage.getItem("loggedIn") === "true") {
  window.location.href = "index.html";
}

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("login-error");

// Demo users list
const users = [
  { user: "aman901v-lab", pass: "12345" },
  { user: "admin", pass: "1234" } // backup
];

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const found = users.find(u => u.user === username && u.pass === password);
  if (found) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);
    window.location.href = "index.html";
  } else {
    errorMsg.style.display = "block";
    errorMsg.innerText = "❌ Invalid Username or Password!";
  }
});
