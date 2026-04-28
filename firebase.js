import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBylueNHLLOfmqjxer7agZ0gOAZpZalnXI",
  authDomain: "smart-volunteer-system-8ef35.firebaseapp.com",
  projectId: "smart-volunteer-system-8ef35",
  storageBucket: "smart-volunteer-system-8ef35.firebasestorage.app",
  messagingSenderId: "157881302",
  appId: "1:157881302:web:cee6bc8a66e13fe8910a77",
  measurementId: "G-8LHK20V7RE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };