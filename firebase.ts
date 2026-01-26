
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCgT6au0ArZPz7PJRVvX-Y9wOS_dOdPiPk",
  authDomain: "attendify-d60c6.firebaseapp.com",
  projectId: "attendify-d60c6",
  storageBucket: "attendify-d60c6.firebasestorage.app",
  messagingSenderId: "932362574776",
  appId: "1:932362574776:web:3823f10a8d02fabce08d4d",
  measurementId: "G-S1DYV1T6PL"
};

// Modern Modular Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
