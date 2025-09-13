// login.js

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Simple check (replace with real auth later)
  if (username === "admin" && password === "1234") {
    // Save login state
    localStorage.setItem("loggedIn", "true");

    // Redirect to index.html (dashboard)
    window.location.href = "index.html";
  } else {
    alert("❌ Invalid username or password");
  }
});
