// login.js - Firebase multi-provider demo for Attendify

// If already logged in, redirect to dashboard
auth.onAuthStateChanged(user => {
  if (user) {
    // user signed in
    // optionally store username/email
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userEmail', user.email || user.phoneNumber || user.providerData[0]?.providerId || '');
    window.location.href = 'index.html';
  }
});

// Elements
const emailForm = document.getElementById('email-form');
const emailInput = document.getElementById('email');
const pwdInput = document.getElementById('pwd');
const err = document.getElementById('login-error');

const btnGoogle = document.getElementById('btn-google');
const btnFacebook = document.getElementById('btn-facebook');
const btnApple = document.getElementById('btn-apple');
const btnPhone = document.getElementById('btn-phone');
const btnEmailLink = document.getElementById('btn-email-link');

// ------------- Email/Password -------------
emailForm.addEventListener('submit', (e) => {
  e.preventDefault();
  err.style.display = 'none';
  auth.signInWithEmailAndPassword(emailInput.value.trim(), pwdInput.value)
    .then(cred => {
      // handled by onAuthStateChanged
    })
    .catch(error => {
      console.error(error);
      err.style.display = 'block';
      err.innerText = error.message;
    });
});

// ------------- Email Link (passwordless) -------------
btnEmailLink.addEventListener('click', () => {
  const email = emailInput.value.trim();
  if (!email) {
    err.style.display = 'block'; err.innerText = 'Enter email first';
    return;
  }
  const actionCodeSettings = {
    // URL you want to redirect back to. Must be whitelisted in Firebase console.
    url: window.location.href,
    handleCodeInApp: true
  };
  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem('emailForSignIn', email);
      alert('Sign-in link sent to email. Open it to complete sign-in.');
    })
    .catch(e => { err.style.display='block'; err.innerText = e.message; });
});

// If user opens with email sign-in link
if (auth.isSignInWithEmailLink && auth.isSignInWithEmailLink(window.location.href)) {
  const email = window.localStorage.getItem('emailForSignIn') || window.prompt('Please provide your email for confirmation');
  auth.signInWithEmailLink(email, window.location.href)
    .catch(e => { console.error(e); });
}

// ------------- Google -------------
btnGoogle.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(e => { err.style.display='block'; err.innerText = e.message; });
});

// ------------- Facebook -------------
btnFacebook.addEventListener('click', () => {
  const provider = new firebase.auth.FacebookAuthProvider();
  auth.signInWithPopup(provider).catch(e => { err.style.display='block'; err.innerText = e.message; });
});

// ------------- Apple -------------
// Note: Apple sign-in on web needs special setup in Firebase console and Apple Developer.
// This triggers provider flow; may require server config for nonce/redirect in production.
btnApple.addEventListener('click', () => {
  const provider = new firebase.auth.OAuthProvider('apple.com');
  // Optionally request additional scopes
  // provider.addScope('email');
  auth.signInWithPopup(provider).catch(e => { err.style.display='block'; err.innerText = e.message; });
});

// ------------- Phone (OTP) -------------
btnPhone.addEventListener('click', async () => {
  // Create/clear previous recaptcha container
  if (document.getElementById('recaptcha-container')) {
    document.getElementById('recaptcha-container').remove();
  }
  const rc = document.createElement('div');
  rc.id = 'recaptcha-container';
  document.body.appendChild(rc);

  // render recaptcha
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible'
  });

  const phoneNumber = prompt('Enter phone number with country code (e.g. +911234567890)');
  if (!phoneNumber) return;

  try {
    const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier);
    const code = prompt('Enter the OTP you received');
    if (!code) return;
    const result = await confirmationResult.confirm(code);
    // logged in
  } catch (e) {
    console.error(e);
    err.style.display = 'block';
    err.innerText = e.message || e;
  }
});
