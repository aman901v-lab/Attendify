document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // Hardcoded credentials (abhi ke liye)
  const validUser = "aman901v-lab";
  const validPass = "12345"; // tum yaha apna password daal sakte ho

  if (username === validUser && password === validPass) {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html"; // Login ke baad dashboard
  } else {
    document.getElementById("login-error").style.display = "block";
  }
});
