// login.js - Attendify Login System

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  // Dummy credentials (can be updated later)
  const USERNAME = "admin";
  const PASSWORD = "1234";

  // Form submit handler
  loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const enteredUser = document.getElementById("username").value.trim();
    const enteredPass = document.getElementById("password").value.trim();

    if (enteredUser === USERNAME && enteredPass === PASSWORD) {
      // Save login state in localStorage
      localStorage.setItem("isLoggedIn", "true");

      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } else {
      alert("❌ Invalid username or password");
    }
  });
});

// Logout handler (can be called from dashboard)
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
