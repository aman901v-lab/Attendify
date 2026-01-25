
import * as firebaseApp from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgT6au0ArZPz7PJRVvX-Y9wOS_dOdPiPk",
  authDomain: "attendify-d60c6.firebaseapp.com",
  projectId: "attendify-d60c6",
  storageBucket: "attendify-d60c6.firebasestorage.app",
  messagingSenderId: "932362574776",
  appId: "1:932362574776:web:3823f10a8d02fabce08d4d",
  measurementId: "G-S1DYV1T6PL"
};

// Singleton initialization using namespace import to resolve "no exported member" issues
// This ensures we only initialize the Firebase app once, even with Hot Module Replacement (HMR)
const app = firebaseApp.getApps().length === 0 
  ? firebaseApp.initializeApp(firebaseConfig) 
  : firebaseApp.getApp();

export const db = getFirestore(app);
