import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase-konfigurasjon for Tallmester-prosjektet ditt
const firebaseConfig = {
  apiKey: "AIzaSyC6Kp-FRO3oSLshhRElNVShCPW-UmvYgQw",
  authDomain: "tallmester.firebaseapp.com",
  projectId: "tallmester",
  storageBucket: "tallmester.appspot.com",
  messagingSenderId: "906310383990",
  appId: "1:906310383990:web:c2296b573bc97ddb1ba257",
  measurementId: "G-78KN3CTECW",
};

// Initialiserer Firebase og Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
