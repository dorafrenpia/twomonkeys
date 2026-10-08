// ============================================================
// FIREBASE CONFIGURATION
// Project: ourfishtale
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    getStorage
} from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCA4j-a61bY8FaNGTry4Rctg586yHpFy0Q",

    authDomain:
        "ourfishtale.firebaseapp.com",

    projectId:
        "ourfishtale",

    storageBucket:
        "ourfishtale.firebasestorage.app",

    messagingSenderId:
        "1094681891704",

    appId:
        "1:1094681891704:web:efee1c99e8a3f515d8ae8d"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// SERVICES
// ============================================================

const db = getFirestore(app);

const storage = getStorage(app);


// ============================================================
// EXPORT
// ============================================================

export {
    app,
    db,
    storage
};
