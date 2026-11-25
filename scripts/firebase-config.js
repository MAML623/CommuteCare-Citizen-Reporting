
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVZBJznv4ze3dq9zqGOe76QMZFnof3Fl4",
  authDomain: "commutecare-71a9b.firebaseapp.com",
  projectId: "commutecare-71a9b",
  storageBucket: "commutecare-71a9b.firebasestorage.app",
  messagingSenderId: "1072012236803",
  appId: "1:1072012236803:web:6407f470b48ee02de95636"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Make Firebase available to our other scripts
export { app, auth, db };
