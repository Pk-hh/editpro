// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB1nxfyi5xxvF_yHx0QuTfPSy_cl4AYPYI",
    authDomain: "editpro-dda7f.firebaseapp.com",
    projectId: "editpro-dda7f",
    storageBucket: "editpro-dda7f.firebasestorage.app",
    messagingSenderId: "778119275313",
    appId: "1:778119275313:web:829f857fa247c479134610"
};

// Initialize Firebase
// Using compat libraries from HTML script tags
let app, db, auth;

try {
    if (typeof firebase !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("Firebase initialized successfully");
    } else {
        console.error("Firebase SDK not found. Check internet connection and script tags.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}
