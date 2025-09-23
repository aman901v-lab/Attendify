// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCgT6au0ArZPz7PJRVvX-Y9wOS_dOdPiPk",
  authDomain: "attendify-d60c6.firebaseapp.com",
  projectId: "attendify-d60c6",
  storageBucket: "attendify-d60c6.firebasestorage.app",
  messagingSenderId: "932362574776",
  appId: "1:932362574776:web:3823f10a8d02fabce08d4d",
  measurementId: "G-S1DYV1T6PL"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ✅ Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
