// login.js

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Simple check (You can replace this with real authentication later)
  if (username === "admin" && password === "1234") {
    // Save login state
    localStorage.setItem("loggedIn", "true");

    // Redirect to dashboard
    window.location.href = "dashboard.html";
  } else {
    alert("❌ Invalid username or password");
  }
});
