const loginBox = document.querySelector(".login-box");
const registerBox = document.querySelector(".register-box");

document.getElementById("show-register").addEventListener("click", () => {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
});

document.getElementById("show-login").addEventListener("click", () => {
  registerBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
});
