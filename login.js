// login.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // 🔑 Simple validation (You can replace with real authentication)
    if (username === "admin" && password === "1234") {
      alert("✅ Login successful!");
      // Redirect to dashboard.html
      window.location.href = "dashboard.html";
    } else {
      alert("❌ Invalid username or password!");
    }
  });
});
