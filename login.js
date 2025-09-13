// ----------------------
// Login System
// ----------------------

// Agar already login hai toh direct dashboard par bhej do
if (localStorage.getItem("loggedIn") === "true") {
  window.location.href = "index.html";
}

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("login-error");

// Demo credentials (tum baad me database/API se connect kar sakte ho)
const validUser = "admin";
const validPass = "1234";

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === validUser && password === validPass) {
    // Save login state
    localStorage.setItem("loggedIn", "true");
    // Redirect to dashboard
    window.location.href = "index.html";
  } else {
    // Show error
    errorMsg.style.display = "block";
    errorMsg.innerText = "❌ Invalid Username or Password!";
  }
});
