import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBB5mWvmNH780JTE_ZGtO7czlhmwOEw6mI",
  authDomain: "equipmentreservation-7ec83.firebaseapp.com",
  projectId: "equipmentreservation-7ec83",
  storageBucket: "equipmentreservation-7ec83.firebasestorage.app",
  messagingSenderId: "243642760553",
  appId: "1:243642760553:web:e3efb105d5d6649cab11f8",
  measurementId: "G-DQ82W1NYLL",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
