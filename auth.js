import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBylueNHLLOfmqjxer7agZ0gOAZpZalnXI",
  authDomain: "smart-volunteer-system-8ef35.firebaseapp.com",
  projectId: "smart-volunteer-system-8ef35",
  storageBucket: "smart-volunteer-system-8ef35.firebasestorage.app",
  messagingSenderId: "157881302",
  appId: "1:157881302:web:cee6bc8a66e13fe8910a77",
  measurementId: "G-8LHK20V7RE"
};

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db   = getFirestore(app);


window.handleLogout = async function () {
  await logOut();
  window.location.href = "login.html";
};


export async function saveUserRole(uid, role, name = "") {
  await setDoc(doc(db, "users", uid), { role, name, createdAt: new Date().toISOString() });
}

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ── 5. Authentication Functions ─
export async function signUpWithEmail(email, password, role, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await saveUserRole(user.uid, role, name);
    return { success: true, user, role };
  } catch (e) {
    console.error("Signup error:", e.message);
    return { success: false, error: e.message };
  }
}

export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const data = await getUserRole(user.uid);
    return { success: true, user, role: data?.role, name: data?.name };
  } catch (e) {
    console.error("Signin error:", e.message);
    return { success: false, error: e.message };
  }
}

export function setupRecaptcha(buttonId) {
  if (window.recaptchaVerifier) return;
  window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
  });
}

export async function sendOTP(phoneNumber) {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    window.confirmationResult = confirmationResult;
    return { success: true };
  } catch (e) {
    console.error("OTP error:", e.message);
    return { success: false, error: e.message };
  }
}

export async function verifyOTP(otp, role, name) {
  try {
    const result = await window.confirmationResult.confirm(otp);
    const user = result.user;
    const existing = await getUserRole(user.uid);
    if (!existing) await saveUserRole(user.uid, role, name);
    const data = await getUserRole(user.uid);
    return { success: true, user, role: data?.role };
  } catch (e) {
    console.error("OTP verify error:", e.message);
    return { success: false, error: e.message };
  }
}

export async function logOut() {
  await signOut(auth);
}

export function onUserStateChange(callback) {
  onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// ── 6. Auth State Listener (Guard & Loop Stopper) ──────────
onUserStateChange(async (user) => {
  const currentPage = window.location.pathname;

  
  if (!user && !currentPage.includes("login.html")) {
    window.location.href = "login.html";
    return;
  }

  
  if (user && currentPage.includes("login.html")) {
    const data = await getUserRole(user.uid);
    if (data?.role === "volunteer") {
      window.location.href = "volunteer.html";
    } else {
      window.location.href = "index.html";
    }
    return;
  }

  
  if (user) {
    const data = await getUserRole(user.uid);
    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
      welcomeMsg.textContent = `Welcome, ${data?.name || user.email || "User"}!`;
    }
  }
});