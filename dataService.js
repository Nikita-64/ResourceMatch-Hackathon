import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Add Need ───
export async function addNeed(need) {
  try {
    const docRef = await addDoc(collection(db, "needs"), need);
    console.log("Need added:", need);
    return docRef.id; 
  } catch (e) {
    console.error("Error adding need:", e);
    return "local_" + Date.now();
  }
}

// ── Add Volunteer ──
export async function addVolunteer(volunteer) {
  try {
    const docRef = await addDoc(collection(db, "volunteers"), volunteer);
    console.log("Volunteer added:", volunteer);
    return docRef.id; 
  } catch (e) {
    console.error("Error adding volunteer:", e);
    return "local_" + Date.now();
  }
}

// ── Get Needs ──
export async function getNeeds() {
  try {
    const snapshot = await getDocs(collection(db, "needs"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting needs:", e);
    return [];
  }
}

// ── Get Volunteers ──
export async function getVolunteers() {
  try {
    const snapshot = await getDocs(collection(db, "volunteers"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting volunteers:", e);
    return [];
  }
}

// ── Delete Need ────
export async function deleteNeed(id) {
  try {
    await deleteDoc(doc(db, "needs", id));
    console.log("Need deleted:", id);
  } catch (e) {
    console.error("Error deleting need:", e);
  }
}

// ── Delete Volunteer ───
export async function deleteVolunteer(id) {
  try {
    await deleteDoc(doc(db, "volunteers", id));
    console.log("Volunteer deleted:", id);
  } catch (e) {
    console.error("Error deleting volunteer:", e);
  }
}